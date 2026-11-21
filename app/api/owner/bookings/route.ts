import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Proxy GET /bookings/owner to the Express backend.
 * Authenticates via session and forwards Authorization: Bearer <email>
 * so the backend scopes bookings to the signed-in owner.
 * Next.js 15: params is a Promise (not used here, but kept consistent
 * with the route pattern).
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const base = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!base) {
    return NextResponse.json(
      { error: "Backend is not configured." },
      { status: 500 },
    );
  }

  const backendUrl = new URL("/bookings/owner", base);

  const res = await fetch(backendUrl.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.user.email}`,
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
