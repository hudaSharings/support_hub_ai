import Link from "next/link";
import { notFound } from "next/navigation";

import { resolveCaseAction } from "@/app/actions";
import { ResolveCaseSubmitButton } from "@/components/resolve-case-submit-button";
import { requireSessionContext } from "@/lib/auth/session";
import { getCaseDetail } from "@/lib/cases/service";

type Props = {
  params: Promise<{ caseId: string }>;
};

const decisionBadgeClass = (decision: string | null | undefined) => {
  if (decision === "resolve") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }
  if (decision === "clarify") {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }
  if (decision === "escalate") {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }
  return "border-border bg-muted text-muted-foreground";
};

type DocEvidence = {
  source_url?: string;
  excerpt?: string;
  relevance_score?: number;
};

type ToolEvidence = {
  tool_name?: string;
  findings?: Record<string, unknown>;
  status?: string;
};

export default async function CaseDetailPage({ params }: Props) {
  const { caseId } = await params;
  const session = await requireSessionContext();
  const detail = await getCaseDetail(caseId);
  if (!detail) notFound();
  if (detail.caseRecord.orgId !== session.orgId) notFound();

  const { caseRecord, latestOutcome, runs } = detail;
  const docsEvidence = (latestOutcome?.docsEvidence ?? []) as DocEvidence[];
  const toolEvidence = (latestOutcome?.toolEvidence ?? []) as ToolEvidence[];
  const citations = docsEvidence.slice(0, 3);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="space-y-2">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{caseRecord.title}</h1>
        <p className="text-sm text-muted-foreground">
          {caseRecord.caseId} · {caseRecord.status} · severity {caseRecord.severity}
        </p>
      </header>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-2 text-lg font-medium">Case description</h2>
        <p className="whitespace-pre-wrap text-sm leading-6">{caseRecord.description}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Customer: {caseRecord.customerId ?? "-"}</span>
          <span>Organization: {caseRecord.orgId ?? "-"}</span>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-lg font-medium">Run resolver</h2>
        {session.role === "viewer" ? (
          <p className="text-sm text-muted-foreground">
            Viewer accounts can view cases but cannot trigger resolver runs.
          </p>
        ) : (
          <form action={resolveCaseAction}>
            <input type="hidden" name="caseId" value={caseRecord.caseId} />
            <ResolveCaseSubmitButton />
          </form>
        )}
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-lg font-medium">Latest AI outcome</h2>
        {!latestOutcome ? (
          <p className="text-sm text-muted-foreground">
            No AI outcome yet. Run resolver to generate one.
          </p>
        ) : (
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-medium">Decision:</span>{" "}
              <span
                className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${decisionBadgeClass(
                  latestOutcome.decision,
                )}`}
              >
                {latestOutcome.decision ?? "unknown"}
              </span>
            </p>
            <p>
              <span className="font-medium">Issue type:</span>{" "}
              {latestOutcome.issueType ?? "unknown"}
            </p>
            <p>
              <span className="font-medium">Rationale:</span>{" "}
              {latestOutcome.decisionRationale ?? "-"}
              {citations.length > 0 ? (
                <span className="ml-2 inline-flex gap-1 align-middle">
                  {citations.map((_, index) => (
                    <span
                      key={`rat-cite-${index + 1}`}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      title={`Documentation citation ${index + 1}`}
                    >
                      [{index + 1}]
                    </span>
                  ))}
                </span>
              ) : null}
            </p>
            <p>
              <span className="font-medium">Customer response:</span>{" "}
              {latestOutcome.customerResponse ?? "-"}
              {citations.length > 0 ? (
                <span className="ml-2 inline-flex gap-1 align-middle">
                  {citations.map((_, index) => (
                    <span
                      key={`resp-cite-${index + 1}`}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      title={`Documentation citation ${index + 1}`}
                    >
                      [{index + 1}]
                    </span>
                  ))}
                </span>
              ) : null}
            </p>
            <p>
              <span className="font-medium">Internal note:</span>{" "}
              {latestOutcome.internalNote ?? "-"}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-lg font-medium">Documentation evidence</h2>
        {docsEvidence.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No documentation evidence captured in the latest run.
          </p>
        ) : (
          <div className="space-y-3 text-sm">
            {docsEvidence.map((doc, index) => (
              <div key={`${doc.source_url ?? "doc"}-${index}`} className="rounded-md border p-3">
                <p className="mb-1 text-xs text-muted-foreground">[{index + 1}]</p>
                <p className="font-medium break-all">
                  {doc.source_url ? (
                    <a
                      href={doc.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {doc.source_url}
                    </a>
                  ) : (
                    "Unknown source"
                  )}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {doc.excerpt?.slice(0, 240) ?? "No excerpt available."}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Relevance:{" "}
                  {typeof doc.relevance_score === "number"
                    ? doc.relevance_score.toFixed(3)
                    : "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-lg font-medium">Tools and important findings</h2>
        {toolEvidence.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tool evidence captured in the latest run.
          </p>
        ) : (
          <div className="space-y-3 text-sm">
            {toolEvidence.map((tool, index) => (
              <div key={`${tool.tool_name ?? "tool"}-${index}`} className="rounded-md border p-3">
                <p>
                  <span className="font-medium">Tool:</span> {tool.tool_name ?? "unknown"}
                </p>
                <p>
                  <span className="font-medium">Status:</span> {tool.status ?? "unknown"}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Findings:</span>{" "}
                  {tool.findings ? JSON.stringify(tool.findings) : "No findings"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-lg font-medium">Resolver run history</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No runs recorded.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {runs.map((run) => (
              <div key={run.id} className="rounded-md border p-3">
                <p>
                  <span className="font-medium">{run.provider}</span> ·{" "}
                  {run.success ? "success" : "failed"} · {run.latencyMs ?? "-"} ms
                </p>
                {run.errorMessage ? (
                  <p className="text-destructive">{run.errorMessage}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
