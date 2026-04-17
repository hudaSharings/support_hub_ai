import { desc, eq } from "drizzle-orm";

import type { SessionContext } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import {
  caseHistoryEvents,
  resolverRuns,
  supportCaseAiOutcomes,
  supportCases,
} from "@/lib/db/schema";
import { getResolverProvider } from "@/lib/resolver/providers";
import type { ResolverDecision, ResolverOutput } from "@/lib/resolver/types";

type CreateCaseInput = {
  title: string;
  description: string;
  orgId: string;
  customerId: string;
  actor: string;
  severity?: string;
  metadata?: Record<string, string>;
};

const statusByDecision: Record<ResolverDecision, typeof supportCases.$inferInsert.status> = {
  resolve: "resolved_pending_confirmation",
  clarify: "clarification_required",
  escalate: "escalated",
};

const generateCaseId = () => {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const random = Math.floor(Math.random() * 900 + 100);
  return `CASE-${stamp}-${random}`;
};

const newEventId = () => {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 17);
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `evt_${stamp}_${random}`;
};

export const listCases = async (session: SessionContext) => {
  try {
    const db = getDb();
    return db.query.supportCases.findMany({
      where: eq(supportCases.orgId, session.orgId),
      orderBy: [desc(supportCases.updatedAt)],
      limit: 50,
    });
  } catch {
    return [];
  }
};

export const getCaseDetail = async (caseId: string) => {
  const db = getDb();
  const caseRecord = await db.query.supportCases.findFirst({
    where: eq(supportCases.caseId, caseId),
  });
  if (!caseRecord) {
    return null;
  }

  const latestOutcome = await db.query.supportCaseAiOutcomes.findFirst({
    where: eq(supportCaseAiOutcomes.caseId, caseId),
  });
  const runs = await db.query.resolverRuns.findMany({
    where: eq(resolverRuns.caseId, caseId),
    orderBy: [desc(resolverRuns.createdAt)],
    limit: 10,
  });
  return { caseRecord, latestOutcome, runs };
};

export const createCase = async (input: CreateCaseInput) => {
  const db = getDb();
  const caseId = generateCaseId();
  await db.insert(supportCases).values({
    caseId,
    title: input.title,
    description: input.description,
    customerId: input.customerId,
    orgId: input.orgId,
    severity: input.severity ?? "medium",
    status: "new",
    metadata: input.metadata ?? {},
  });

  await db.insert(caseHistoryEvents).values({
    eventId: newEventId(),
    caseId,
    eventType: "case_created",
    actor: input.actor,
    notes: "Case created from Support Hub form.",
  });

  return caseId;
};

const persistOutcome = async (caseId: string, output: ResolverOutput) => {
  const db = getDb();
  const existing = await db.query.supportCaseAiOutcomes.findFirst({
    where: eq(supportCaseAiOutcomes.caseId, caseId),
  });

  if (!existing) {
    await db.insert(supportCaseAiOutcomes).values({
      caseId,
      issueType: output.issue_type ?? null,
      decision: output.decision,
      decisionRationale: output.decision_rationale ?? null,
      customerResponse: output.customer_response ?? null,
      internalNote: output.internal_note ?? null,
      missingInformation: output.missing_information ?? [],
      docsEvidence: output.docs_evidence ?? [],
      toolEvidence: output.tool_evidence ?? [],
      escalationArtifactId: output.escalation_artifact_id ?? null,
    });
    return;
  }

  await db
    .update(supportCaseAiOutcomes)
    .set({
      issueType: output.issue_type ?? null,
      decision: output.decision,
      decisionRationale: output.decision_rationale ?? null,
      customerResponse: output.customer_response ?? null,
      internalNote: output.internal_note ?? null,
      missingInformation: output.missing_information ?? [],
      docsEvidence: output.docs_evidence ?? [],
      toolEvidence: output.tool_evidence ?? [],
      escalationArtifactId: output.escalation_artifact_id ?? null,
      updatedAt: new Date(),
    })
    .where(eq(supportCaseAiOutcomes.caseId, caseId));
};

export const resolveCase = async (caseId: string) => {
  const db = getDb();
  const caseRecord = await db.query.supportCases.findFirst({
    where: eq(supportCases.caseId, caseId),
  });
  if (!caseRecord) {
    throw new Error(`Case not found: ${caseId}`);
  }

  const provider = getResolverProvider();
  const payload = {
    case_id: caseRecord.caseId,
    title: caseRecord.title,
    description: caseRecord.description,
    customer_id: caseRecord.customerId,
    org_id: caseRecord.orgId,
    severity: caseRecord.severity,
    metadata: caseRecord.metadata ?? {},
  };

  const started = Date.now();
  try {
    const output = await provider.resolveCase(payload);
    const latency = Date.now() - started;

    await db.insert(resolverRuns).values({
      caseId: caseRecord.caseId,
      provider: provider.providerName,
      requestPayload: payload,
      responsePayload: output,
      latencyMs: latency,
      success: true,
    });

    await db
      .update(supportCases)
      .set({
        status: statusByDecision[output.decision],
        updatedAt: new Date(),
      })
      .where(eq(supportCases.caseId, caseId));

    await persistOutcome(caseId, output);
    return output;
  } catch (error) {
    const latency = Date.now() - started;
    await db.insert(resolverRuns).values({
      caseId: caseRecord.caseId,
      provider: provider.providerName,
      requestPayload: payload,
      responsePayload: null,
      latencyMs: latency,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown provider error",
    });
    throw error;
  }
};
