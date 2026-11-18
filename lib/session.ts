import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardPath, normalizeRole, type Role } from "@/lib/roles";

type FullSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type UserSession = FullSession;
export type SessionUser = FullSession["user"];

export function getActiveRole(user: Pick<SessionUser, "activeRole">): Role {
  return normalizeRole(user.activeRole);
}


export async function getSession(): Promise<UserSession | null> {
  return auth.api.getSession({ headers: await headers() });
}

/** Requires any signed-in user; redirects to /sign-in otherwise. */
export async function requireUser(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}

export async function requireRole(role: Role): Promise<UserSession> {
  const session = await requireUser();
  const activeRole = getActiveRole(session.user);
  if (activeRole !== role) {
    redirect(getDashboardPath(activeRole));
  }
  return session;
}
