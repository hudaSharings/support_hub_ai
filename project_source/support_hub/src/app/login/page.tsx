import { redirect } from "next/navigation";

import { switchUserAction } from "@/app/actions";
import { getSessionContext, listAvailableUsers } from "@/lib/auth/session";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    email?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSessionContext();
  if (session) {
    redirect("/");
  }

  const [users, params] = await Promise.all([listAvailableUsers(), searchParams]);
  const errorMessage = params?.error;
  const selectedEmail = params?.email;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Support Hub Login</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with a seeded user account to access organization-scoped cases.
        </p>
      </header>

      <form action={switchUserAction} className="space-y-4 rounded-lg border bg-card p-5">
        {errorMessage ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}
        <label className="space-y-1 text-sm">
          <span>Email</span>
          <select
            name="email"
            defaultValue={selectedEmail || users[0]?.email}
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            {users.map((user) => (
              <option key={user.userId} value={user.email}>
                {user.fullName} - {user.email}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span>Password</span>
          <input
            name="password"
            type="password"
            required
            placeholder="Enter password"
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
