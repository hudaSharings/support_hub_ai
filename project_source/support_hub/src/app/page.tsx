import Link from "next/link";

import { requireSessionContext } from "@/lib/auth/session";
import { listCases } from "@/lib/cases/service";
import { env } from "@/lib/env";

const severityChipClass = (severity: string | null | undefined) => {
  if (severity === "critical") {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }
  if (severity === "high") {
    return "border-orange-300 bg-orange-50 text-orange-700";
  }
  if (severity === "medium") {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }
  if (severity === "low") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }
  return "border-border bg-muted text-muted-foreground";
};

const statusChipClass = (status: string | null | undefined) => {
  if (status === "resolved_pending_confirmation" || status === "closed") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }
  if (status === "clarification_required" || status === "reopened") {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }
  if (status === "escalated") {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }
  if (status === "new" || status === "triage") {
    return "border-sky-300 bg-sky-50 text-sky-700";
  }
  return "border-border bg-muted text-muted-foreground";
};

const nextActionFromStatus = (status: string | null | undefined) => {
  if (status === "new") return "Run resolver";
  if (status === "triage") return "Review triage";
  if (status === "clarification_required") return "Ask customer";
  if (status === "resolved_pending_confirmation") return "Await confirmation";
  if (status === "escalated") return "Handle escalation";
  if (status === "reopened") return "Re-investigate";
  if (status === "closed") return "No action";
  return "Review";
};

const actionChipClass = (status: string | null | undefined) => {
  if (status === "clarification_required" || status === "new" || status === "reopened") {
    return "border-violet-300 bg-violet-50 text-violet-700";
  }
  if (status === "escalated") {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }
  if (status === "resolved_pending_confirmation" || status === "closed") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }
  return "border-border bg-muted text-muted-foreground";
};

export default async function Home() {
  const session = await requireSessionContext();
  const cases = await listCases(session);
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{env.appName}</h1>
          <p className="text-sm text-muted-foreground">
            Shared ticketing business app for AI-assisted support.
          </p>
          <p className="text-xs text-muted-foreground">
            Signed in as {session.fullName} ({session.email}) · org {session.orgId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/cases/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Create case
          </Link>
        </div>
      </header>

      <section className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="font-medium">Recent cases</h2>
        </div>
        <div className="divide-y">
          {cases.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              No cases yet. Create one to start testing resolver integration.
            </p>
          ) : (
            cases.map((item) => (
              <Link
                key={item.caseId}
                href={`/cases/${item.caseId}`}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-accent"
              >
                <div className="space-y-1.5">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.caseId}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${severityChipClass(item.severity)}`}
                    >
                      Severity: {item.severity ?? "unknown"}
                    </span>
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${statusChipClass(item.status)}`}
                    >
                      Status: {item.status ?? "unknown"}
                    </span>
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${actionChipClass(item.status)}`}
                    >
                      Action: {nextActionFromStatus(item.status)}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.updatedAt?.toISOString().slice(0, 10)}
                </span>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
