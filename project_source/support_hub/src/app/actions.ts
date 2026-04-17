"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createCase, getCaseDetail, resolveCase } from "@/lib/cases/service";
import { requireAdminSessionContext, requireSessionContext, setSessionUser } from "@/lib/auth/session";
import { cookies } from "next/headers";
import {
  createOrganization,
  createUserWithMembership,
} from "@/lib/admin/service";

const required = (value: FormDataEntryValue | null, field: string): string => {
  const normalized = value?.toString().trim() ?? "";
  if (!normalized) {
    throw new Error(`${field} is required.`);
  }
  return normalized;
};

export const createCaseAction = async (formData: FormData) => {
  const session = await requireSessionContext();
  if (session.role === "viewer") {
    throw new Error("Viewer accounts cannot create cases.");
  }
  const title = required(formData.get("title"), "title");
  const description = required(formData.get("description"), "description");
  const severity = formData.get("severity")?.toString().trim() || "medium";

  const caseId = await createCase({
    title,
    description,
    customerId: session.customerId,
    orgId: session.orgId,
    actor: session.email,
    severity,
    metadata: {
      created_by: session.email,
      actor_role: session.role,
    },
  });

  revalidatePath("/");
  redirect(`/cases/${caseId}`);
};

export const resolveCaseAction = async (formData: FormData) => {
  const caseId = required(formData.get("caseId"), "caseId");
  const session = await requireSessionContext();
  const detail = await getCaseDetail(caseId);
  if (!detail) {
    throw new Error(`Case not found: ${caseId}`);
  }
  if (detail.caseRecord.orgId !== session.orgId) {
    throw new Error("You are not authorized to resolve this case.");
  }
  await resolveCase(caseId);
  revalidatePath("/");
  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}`);
};

export const switchUserAction = async (formData: FormData) => {
  const email = required(formData.get("email"), "email");
  const password = required(formData.get("password"), "password");
  try {
    await setSessionUser(email, password);
    revalidatePath("/");
    redirect("/");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sign in. Please try again.";
    const isKnown =
      message === "Invalid email or password." ||
      message === "Authentication schema not migrated yet. Run db:migrate then db:seed.";
    const encoded = encodeURIComponent(
      isKnown ? message : "Unable to sign in right now. Please try again.",
    );
    redirect(`/login?error=${encoded}&email=${encodeURIComponent(email)}`);
  }
};

export const logoutAction = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("support_hub_user_email");
  redirect("/login");
};

const adminRedirect = (status: "success" | "error", message: string) =>
  redirect(`/admin?status=${status}&message=${encodeURIComponent(message)}`);

export const createOrganizationAction = async (formData: FormData) => {
  const session = await requireAdminSessionContext();
  if (!session.isSuperAdmin) {
    adminRedirect("error", "Only super admin can create organizations.");
  }
  const customerId = required(formData.get("customerId"), "customerId");
  const customerName = required(formData.get("customerName"), "customerName");
  const orgId = required(formData.get("orgId"), "orgId");
  const orgName = required(formData.get("orgName"), "orgName");
  try {
    await createOrganization({ customerId, customerName, orgId, orgName });
    revalidatePath("/admin");
    adminRedirect("success", "Organization created successfully.");
  } catch (error) {
    adminRedirect("error", error instanceof Error ? error.message : "Failed to create organization.");
  }
};

export const createUserAction = async (formData: FormData) => {
  const session = await requireAdminSessionContext();
  const fullName = required(formData.get("fullName"), "fullName");
  const email = required(formData.get("email"), "email");
  const password = required(formData.get("password"), "password");
  const orgId = required(formData.get("orgId"), "orgId");
  const role = required(formData.get("role"), "role");
  try {
    if (role !== "admin" && role !== "agent" && role !== "viewer") {
      throw new Error("Invalid role value.");
    }
    await createUserWithMembership({
      fullName,
      email,
      password,
      orgId,
      role,
      createdBy: session,
    });
    revalidatePath("/admin");
    adminRedirect("success", "User created successfully.");
  } catch (error) {
    adminRedirect("error", error instanceof Error ? error.message : "Failed to create user.");
  }
};
