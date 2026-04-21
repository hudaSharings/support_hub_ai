import Link from "next/link";

import {
  createOrganizationAction,
  createUserAction,
} from "@/app/actions";
import { requireAdminSessionContext } from "@/lib/auth/session";
import { listAdminData } from "@/lib/admin/service";

type AdminPageProps = {
  searchParams?: Promise<{
    status?: "success" | "error";
    message?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await requireAdminSessionContext();
  const [{ orgs, users, memberships, customers }, params] = await Promise.all([
    listAdminData(session),
    searchParams,
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="space-y-2">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Admin: Users and Organizations</h1>
        <p className="text-sm text-muted-foreground">
          {session.isSuperAdmin
            ? "Super admin can manage all organizations, users, and role mappings."
            : "Org admin can manage users within the current organization."}
        </p>
        {session.isSuperAdmin ? (
          <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Super admins are automatically members of every organization—existing orgs and any new org you create—so they can access org-scoped data without adding a separate membership each time.
          </p>
        ) : null}
      </header>

      {params?.message ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            params.status === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {params.message}
        </p>
      ) : null}

      <section className={`grid gap-4 ${session.isSuperAdmin ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
        {session.isSuperAdmin ? (
          <form action={createOrganizationAction} className="space-y-3 rounded-lg border bg-card p-4">
            <h2 className="font-medium">Add organization</h2>
            <input
              name="customerId"
              required
              placeholder="customer_id (e.g. cust_newco)"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              name="customerName"
              required
              placeholder="Customer name"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              name="orgId"
              required
              placeholder="org_id (e.g. org_newco_platform)"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              name="orgName"
              required
              placeholder="Organization name"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <button className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              Create organization
            </button>
          </form>
        ) : null}
        <form action={createUserAction} className="space-y-3 rounded-lg border bg-card p-4">
          <h2 className="font-medium">Add user (with org mapping)</h2>
          <input
            name="fullName"
            required
            placeholder="Full name"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="name@company.com"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Temporary password"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <select name="orgId" required className="w-full rounded-md border bg-background px-3 py-2 text-sm">
            {orgs.map((org) => (
              <option key={org.orgId} value={org.orgId}>
                {org.orgName} ({org.orgId})
              </option>
            ))}
          </select>
          <select
            name="role"
            defaultValue={session.isSuperAdmin ? "agent" : "viewer"}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="admin">admin</option>
            <option value="agent">agent</option>
            <option value="viewer">viewer</option>
          </select>
          <button className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            Create user
          </button>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3 font-medium">Organizations ({orgs.length})</div>
          <div className="divide-y">
            {orgs.map((org) => (
              <div key={org.orgId} className="px-4 py-3 text-sm">
                <p className="font-medium">{org.orgName}</p>
                <p className="text-xs text-muted-foreground">
                  {org.orgId} · customer {org.customerId ?? "-"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3 font-medium">Users ({users.length})</div>
          <div className="divide-y">
            {users.map((user) => (
              <div key={user.userId} className="px-4 py-3 text-sm">
                <p className="font-medium">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {user.email} · default org {user.defaultOrgId ?? "-"} · global role{" "}
                  {user.globalRole}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3 font-medium">Memberships ({memberships.length})</div>
        <div className="divide-y">
          {memberships.map((m) => (
            <div key={m.membershipId} className="px-4 py-3 text-sm">
              <p className="font-medium">
                {m.userId} → {m.orgId}
              </p>
              <p className="text-xs text-muted-foreground">
                role {m.role} · customer {m.customerId} · default {m.isDefault ? "yes" : "no"}
              </p>
            </div>
          ))}
        </div>
      </section>
      <p className="text-xs text-muted-foreground">
        Customers available: {customers.map((c) => c.customerId).join(", ")}
      </p>
    </main>
  );
}
