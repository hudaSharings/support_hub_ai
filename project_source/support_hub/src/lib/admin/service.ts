import { asc, eq, inArray } from "drizzle-orm";

import type { SessionContext } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { appUsers, customers, githubOrganizations, userOrgMemberships } from "@/lib/db/schema";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const suffix = () => Date.now().toString().slice(-8);
const superAdminMembershipId = (userId: string, orgId: string) => `mem_super_${userId}_${orgId}`;

const ensureSuperAdminsMappedToAllOrgs = async () => {
  const db = getDb();
  const [superAdmins, orgs] = await Promise.all([
    db.query.appUsers.findMany({
      where: eq(appUsers.globalRole, "super_admin"),
    }),
    db.query.githubOrganizations.findMany(),
  ]);

  for (const admin of superAdmins) {
    for (const org of orgs) {
      if (!org.customerId) {
        continue;
      }
      const membershipId = superAdminMembershipId(admin.userId, org.orgId);
      await db
        .insert(userOrgMemberships)
        .values({
          membershipId,
          userId: admin.userId,
          orgId: org.orgId,
          customerId: org.customerId,
          role: "admin",
          isDefault: admin.defaultOrgId === org.orgId,
        })
        .onConflictDoNothing({ target: userOrgMemberships.membershipId });
    }
  }
};

export const listAdminData = async (session: SessionContext) => {
  const db = getDb();

  if (session.isSuperAdmin) {
    await ensureSuperAdminsMappedToAllOrgs();
    const [orgs, users, memberships, customerRows] = await Promise.all([
      db.query.githubOrganizations.findMany({
        orderBy: [asc(githubOrganizations.orgName)],
      }),
      db.query.appUsers.findMany({
        orderBy: [asc(appUsers.fullName)],
      }),
      db.query.userOrgMemberships.findMany({
        orderBy: [asc(userOrgMemberships.createdAt)],
      }),
      db.query.customers.findMany({
        orderBy: [asc(customers.customerName)],
      }),
    ]);

    return {
      orgs,
      users,
      memberships,
      customers: customerRows,
    };
  }

  const memberships = await db.query.userOrgMemberships.findMany({
    where: eq(userOrgMemberships.orgId, session.orgId),
    orderBy: [asc(userOrgMemberships.createdAt)],
  });
  const userIds = Array.from(new Set(memberships.map((m) => m.userId)));
  const users =
    userIds.length > 0
      ? await db.select().from(appUsers).where(inArray(appUsers.userId, userIds)).orderBy(asc(appUsers.fullName))
      : [];
  const orgs = await db.query.githubOrganizations.findMany({
    where: eq(githubOrganizations.orgId, session.orgId),
    orderBy: [asc(githubOrganizations.orgName)],
  });
  const customerRows = await db.query.customers.findMany({
    where: eq(customers.customerId, session.customerId),
    orderBy: [asc(customers.customerName)],
  });

  return {
    orgs,
    users,
    memberships,
    customers: customerRows,
  };
};

export const createOrganization = async (input: {
  customerId: string;
  customerName: string;
  orgId: string;
  orgName: string;
}) => {
  const db = getDb();

  const existingCustomer = await db.query.customers.findFirst({
    where: eq(customers.customerId, input.customerId),
  });
  if (!existingCustomer) {
    await db.insert(customers).values({
      customerId: input.customerId,
      customerName: input.customerName,
      status: "active",
    });
  }

  const existingOrg = await db.query.githubOrganizations.findFirst({
    where: eq(githubOrganizations.orgId, input.orgId),
  });
  if (existingOrg) {
    throw new Error(`Organization already exists: ${input.orgId}`);
  }

  await db.insert(githubOrganizations).values({
    orgId: input.orgId,
    orgName: input.orgName,
    customerId: input.customerId,
    currentPlan: "team",
    billingStatus: "paid",
    ssoEnabled: false,
  });

  await ensureSuperAdminsMappedToAllOrgs();
};

export const createUserWithMembership = async (input: {
  fullName: string;
  email: string;
  password: string;
  orgId: string;
  role: "agent" | "admin" | "viewer";
  createdBy: SessionContext;
}) => {
  const db = getDb();
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await db.query.appUsers.findFirst({
    where: eq(appUsers.email, normalizedEmail),
  });
  if (existing) {
    throw new Error(`User already exists: ${normalizedEmail}`);
  }

  const org = await db.query.githubOrganizations.findFirst({
    where: eq(githubOrganizations.orgId, input.orgId),
  });
  if (!org || !org.customerId) {
    throw new Error("Selected organization is invalid.");
  }
  if (!input.createdBy.isSuperAdmin && input.createdBy.orgId !== input.orgId) {
    throw new Error("Org admins can only create users for their own organization.");
  }

  const userId = `user_${slugify(normalizedEmail.split("@")[0] ?? normalizedEmail)}_${suffix()}`;
  await db.insert(appUsers).values({
    userId,
    fullName: input.fullName.trim(),
    email: normalizedEmail,
    password: input.password,
    globalRole: "user",
    status: "active",
    defaultOrgId: input.orgId,
  });

  await db.insert(userOrgMemberships).values({
    membershipId: `mem_${userId}_${input.orgId}`,
    userId,
    orgId: input.orgId,
    customerId: org.customerId,
    role: input.role,
    isDefault: true,
  });
};
