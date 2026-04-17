import { logoutAction } from "@/app/actions";
import { getSessionContext } from "@/lib/auth/session";

export default async function SessionSwitcher() {
  const session = await getSessionContext();
  if (!session) {
    return null;
  }

  return (
    <form action={logoutAction} className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">
        {session.fullName} ({session.orgId})
      </span>
      <button
        type="submit"
        className="rounded-md border px-2 py-1 text-xs font-medium hover:bg-accent"
      >
        Logout
      </button>
    </form>
  );
}
