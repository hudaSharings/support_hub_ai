import { asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db/client";
import { appUsers, userOrgMemberships } from "@/lib/db/schema";

const SESSION_COOKIE = "support_hub_user_email";

export type SessionContext = {
  userId: string;
  email: string;
  fullName: string;
  globalRole: "user" | "super_admin";
  isSuperAdmin: boolean;
  orgId: string;
  customerId: string;
  role: "agent" | "admin" | "viewer";
};

const pickMembership = (
  memberships: Array<typeof userOrgMemberships.$inferSelect>,
  preferredOrgId?: string | null,
) => {
  if (preferredOrgId) {
    const matched = memberships.find((m) => m.orgId === preferredOrgId);
    if (matched) {
      return matched;
    }
  }
  return memberships.find((m) => m.isDefault) ?? memberships[0] ?? null;
};

const baseUserSelection = {
  userId: appUsers.userId,
  email: appUsers.email,
  fullName: appUsers.fullName,
  globalRole: appUsers.globalRole,
  status: appUsers.status,
  defaultOrgId: appUsers.defaultOrgId,
};

export const getSessionContext = async (): Promise<SessionContext | null> => {
  const db = getDb();
  const cookieStore = await cookies();
  const emailFromCookie = cookieStore.get(SESSION_COOKIE)?.value?.trim().toLowerCase();

  if (!emailFromCookie) {
    return null;
  }

  const [user] = await db
    .select(baseUserSelection)
    .from(appUsers)
    .where(eq(appUsers.email, emailFromCookie))
    .limit(1);
  if (!user) {
    return null;
  }

  const memberships = await db.query.userOrgMemberships.findMany({
    where: eq(userOrgMemberships.userId, user.userId),
  });
  const activeMembership = pickMembership(memberships, user.defaultOrgId);

  if (!activeMembership) {
    return null;
  }

  return {
    userId: user.userId,
    email: user.email,
    fullName: user.fullName,
    globalRole: user.globalRole,
    isSuperAdmin: user.globalRole === "super_admin",
    orgId: activeMembership.orgId,
    customerId: activeMembership.customerId,
    role: activeMembership.role,
  };
};

export const requireSessionContext = async (): Promise<SessionContext> => {
  const session = await getSessionContext();
  if (!session) {
    redirect("/login");
  }
  return session;
};

export const requireAdminSessionContext = async (): Promise<SessionContext> => {
  const session = await requireSessionContext();
  if (!session.isSuperAdmin && session.role !== "admin") {
    redirect("/");
  }
  return session;
};

export const setSessionUser = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("email is required");
  }
  if (!password.trim()) {
    throw new Error("password is required");
  }

  const db = getDb();
  let userWithPassword:
    | {
        email: string;
        password: string;
      }
    | undefined;
  try {
    [userWithPassword] = await db
      .select({
        email: appUsers.email,
        password: appUsers.password,
      })
      .from(appUsers)
      .where(eq(appUsers.email, normalizedEmail))
      .limit(1);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "cause" in error &&
      error.cause &&
      typeof error.cause === "object" &&
      "code" in error.cause &&
      (error.cause as { code?: string }).code === "42703"
    ) {
      throw new Error("Authentication schema not migrated yet. Run db:migrate then db:seed.");
    }
    throw error;
  }
  if (!userWithPassword) {
    throw new Error("Invalid email or password.");
  }
  if (userWithPassword.password !== password) {
    throw new Error("Invalid email or password.");
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, normalizedEmail, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
};

export const listAvailableUsers = async () => {
  const db = getDb();
  const users = await db.select(baseUserSelection).from(appUsers).orderBy(asc(appUsers.fullName));

  return Promise.all(
    users.map(async (user) => {
      const membershipCount = await db
        .select()
        .from(userOrgMemberships)
        .where(eq(userOrgMemberships.userId, user.userId));
      return {
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        membershipCount: membershipCount.length,
      };
    }),
  );
};
