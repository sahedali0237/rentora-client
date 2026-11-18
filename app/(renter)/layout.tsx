import { requireRole } from "@/lib/session";

// Cache Components: auth checks use headers()/sessions, so this segment
// must be a blocking route (no static shell leak).
export const instant = false;

export default async function RenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Real authorization happens here on the server on every request.
  await requireRole("renter");
  return <>{children}</>;
}
