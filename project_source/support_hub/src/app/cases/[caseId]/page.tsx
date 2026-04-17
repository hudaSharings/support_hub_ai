import Link from "next/link";
import { notFound } from "next/navigation";

import { resolveCaseAction } from "@/app/actions";
import { getCaseDetail } from "@/lib/cases/service";
import { env } from "@/lib/env";

type Props = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseDetailPage({ params }: Props) {
  const { caseId } = await params;
  const detail = await getCaseDetail(caseId);
  if (!detail) notFound();

  const { caseRecord, latestOutcome, runs } = detail;

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
          <span>Provider: {env.resolverProvider}</span>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-lg font-medium">Run resolver</h2>
        <form action={resolveCaseAction}>
          <input type="hidden" name="caseId" value={caseRecord.caseId} />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Resolve case with {env.resolverProvider}
          </button>
        </form>
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
              <span className="font-medium">Decision:</span> {latestOutcome.decision}
            </p>
            <p>
              <span className="font-medium">Issue type:</span>{" "}
              {latestOutcome.issueType ?? "unknown"}
            </p>
            <p>
              <span className="font-medium">Rationale:</span>{" "}
              {latestOutcome.decisionRationale ?? "-"}
            </p>
            <p>
              <span className="font-medium">Customer response:</span>{" "}
              {latestOutcome.customerResponse ?? "-"}
            </p>
            <p>
              <span className="font-medium">Internal note:</span>{" "}
              {latestOutcome.internalNote ?? "-"}
            </p>
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
