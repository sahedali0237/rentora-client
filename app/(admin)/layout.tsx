import { requireRole } from "@/lib/session";

// Cache Components: auth checks use headers()/sessions, so this segment
// must be a blocking route (no static shell leak).
export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Real authorization happens here on the server on every request.
  // requireRole() calls getSession(), which returns null when the user is
  // simply not signed in — in that case requireUser() redirects to /sign-in.
  // If getSession() threw (Better Auth / MongoDB failure, e.g. on Vercel),
  // rethrow so this segment's error.tsx boundary shows the error details
  // instead of silently bouncing a logged-in admin to /sign-in.
  await requireRole("admin");
  return <>{children}</>;
}
