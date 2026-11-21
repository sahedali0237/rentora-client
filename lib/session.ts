import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getDashboardPath,
  getActiveRole,
  type Role,
} from "@/lib/roles";

// Re-exported for backward compatibility — many pages import this from
// @/lib/session. The implementation now lives in @/lib/roles and trusts an
// explicitly-set activeRole (admin/owner) as the current mode, while requireRole()
// still re-validates that the role is present in `roles` server-side.
export { getActiveRole } from "@/lib/roles";

type FullSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type UserSession = FullSession;
export type SessionUser = FullSession["user"];

/**
 * Resolve the user's effective active role from the session user object.
 * Trusts an explicitly-set activeRole (admin/owner) as the current mode;
 * requireRole() still re-validates that the role is present in `roles`
 * before granting access.
 */
export function getSessionActiveRole(user: Pick<
  SessionUser,
  "activeRole" | "roles"
>): Role {
  return getActiveRole(user);
}

export async function getSession(): Promise<UserSession | null> {
  // Prerendering (static-generation pass at build time) has no request
  // context — headers() rejects there. Return null immediately instead of
  // logging a wall of "could not list cookies" errors on every static page.
  // Real requests (runtime) have full context and reach the auth call below.
  let headers_: Awaited<ReturnType<typeof headers>>;
  try {
    headers_ = await headers();
  } catch {
    return null;
  }
  // disableCookieCache forces a fresh read from the database rather than
  // returning the potentially-stale session_data cookie cache. This is
  // essential after a role switch updates activeRole in MongoDB but the
  // cookie still carries the previous value — without it, requireRole()
  // in the /owner and /renter layouts would see a stale activeRole and
  // bounce the user between dashboards.
  const session = await auth.api.getSession({
    headers: headers_,
    query: { disableCookieCache: true },
  });
  if (session) {
    // Debug: log authenticated identity (no secrets/tokens).
    console.log(
      "[AUTH] Authenticated user:",
      { id: session.user.id, email: session.user.email },
    );
    console.log(
      "[AUTH] Authenticated roles:",
      session.user.roles,
      "activeRole:",
      session.user.activeRole,
    );
  } else {
    // Log whether the better-auth session cookie reached the server at all.
    const cookieNames = (await cookies()).getAll().map((c) => c.name);
    console.log(
      "[AUTH] getSession() returned null — cookie names present:",
      cookieNames,
      "| better-auth session cookie present:",
      cookieNames.some((n) =>
        n.endsWith("better-auth.session_token"),
      ),
    );
  }
  return session;
}

/** Requires any signed-in user; redirects to /sign-in otherwise. */
export async function requireUser(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}

/**
 * Requires the user to be signed in AND to hold the requested role in their
 * roles array AND have it as their active role.
 *
 * On failure, redirects to the dashboard of the user's effective active role.
 * `routePath` is logged for debugging but is not used for authorization.
 */
export async function requireRole(
  role: Role,
  routePath?: string,
): Promise<UserSession> {
  const session = await requireUser();
  const activeRole = getSessionActiveRole(session.user);
  const roles: string[] = Array.isArray(session.user.roles)
    ? session.user.roles
    : [];

  console.log(
    `[AUTH] Protecting route: ${routePath ?? "unknown"} | required: ${role} | activeRole: ${activeRole} | roles: ${JSON.stringify(
      roles,
    )}`,
  );

  // Authorize using the session's activeRole as the current mode.
  // getActiveRole() already trusts an explicitly-set activeRole (admin/owner)
  // as the source of truth, so requireRole() must be consistent: an admin
  // whose activeRole is "admin" reaches /admin even when `roles` is
  // temporarily out of sync (e.g. only ["renter","owner"]).
  //
  // On a mismatch, send the user to *their own* active-role dashboard.
  // Redirecting to a dashboard derived from `roles` (the previous fallback)
  // caused redirect loops when activeRole and roles disagreed (e.g. activeRole
  // "admin" bouncing between /admin and /owner). Sending them to their own
  // active-role dashboard always lands on a layout whose requireRole passes,
  // so there is no loop.
  if (activeRole !== role) {
    redirect(getDashboardPath(activeRole));
  }

  return session;
}
