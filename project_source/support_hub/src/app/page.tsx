import Link from "next/link";

import { requireSessionContext } from "@/lib/auth/session";
import { listCases } from "@/lib/cases/service";
import { env } from "@/lib/env";

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
          {session.role === "admin" || session.isSuperAdmin ? (
            <Link
              href="/admin"
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Admin
            </Link>
          ) : null}
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
                className="flex items-center justify-between px-4 py-3 hover:bg-accent"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.caseId} · {item.severity} · {item.status}
                  </p>
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
