import Link from "next/link";

import { createCaseAction } from "@/app/actions";
import { requireSessionContext } from "@/lib/auth/session";

export default async function NewCasePage() {
  const session = await requireSessionContext();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="space-y-2">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Create support case</h1>
        <p className="text-sm text-muted-foreground">
          Case ID is generated automatically and assigned to org {session.orgId}.
        </p>
      </header>

      <form action={createCaseAction} className="space-y-4 rounded-lg border bg-card p-5">
        <label className="space-y-1 text-sm">
          <span>Severity</span>
          <select
            name="severity"
            defaultValue="medium"
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span>Title *</span>
          <input
            name="title"
            required
            placeholder="PAT failing for org resources"
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>Description *</span>
          <textarea
            name="description"
            required
            rows={6}
            placeholder="Customer says PAT works for user endpoints but fails for org resources."
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Create case
        </button>
      </form>
    </main>
  );
}
