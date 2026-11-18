import { redirect } from "next/navigation";
import { getDashboardPath } from "@/lib/roles";
import { getActiveRole, requireUser } from "@/lib/session";

// Cache Components: the redirect needs the live session, so this is a
// blocking route.
export const instant = false;

/**
 * Landing spot after sign-in: bounces the user to the dashboard of
 * their active role.
 */
export default async function DashboardPage() {
  const session = await requireUser();
  redirect(getDashboardPath(getActiveRole(session.user)));
}
