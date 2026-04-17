"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createCase, resolveCase } from "@/lib/cases/service";

const required = (value: FormDataEntryValue | null, field: string): string => {
  const normalized = value?.toString().trim() ?? "";
  if (!normalized) {
    throw new Error(`${field} is required.`);
  }
  return normalized;
};

export const createCaseAction = async (formData: FormData) => {
  const caseId = required(formData.get("caseId"), "caseId");
  const title = required(formData.get("title"), "title");
  const description = required(formData.get("description"), "description");
  const customerId = formData.get("customerId")?.toString().trim() || undefined;
  const orgId = formData.get("orgId")?.toString().trim() || undefined;
  const severity = formData.get("severity")?.toString().trim() || "medium";

  await createCase({
    caseId,
    title,
    description,
    customerId,
    orgId,
    severity,
  });

  revalidatePath("/");
  redirect(`/cases/${caseId}`);
};

export const resolveCaseAction = async (formData: FormData) => {
  const caseId = required(formData.get("caseId"), "caseId");
  await resolveCase(caseId);
  revalidatePath("/");
  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}`);
};
