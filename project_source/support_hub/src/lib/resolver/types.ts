export type ResolverDecision = "resolve" | "clarify" | "escalate";

export type SupportCaseInputPayload = {
  case_id: string;
  title: string;
  description: string;
  customer_id?: string | null;
  org_id?: string | null;
  severity?: string;
  issue_category_hint?: string;
  session_id?: string | null;
  thread_id?: string | null;
  metadata?: Record<string, string>;
};

export type ResolverOutput = {
  issue_type?: string;
  required_tools?: string[];
  missing_information?: string[];
  docs_evidence?: Record<string, unknown>[];
  tool_evidence?: Record<string, unknown>[];
  decision: ResolverDecision;
  decision_rationale?: string;
  customer_response?: string;
  internal_note?: string;
  escalation_artifact_id?: string | null;
};

export type ResolverProvider = {
  providerName: "beginner" | "standard";
  health: () => Promise<{ status: string }>;
  resolveCase: (payload: SupportCaseInputPayload) => Promise<ResolverOutput>;
};
