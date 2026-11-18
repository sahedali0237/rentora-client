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
  // Only accounts whose activeRole is "admin" can reach this segment.
  await requireRole("admin");
  return <>{children}</>;
}
