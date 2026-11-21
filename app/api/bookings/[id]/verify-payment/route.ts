import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Proxy POST /bookings/:id/verify-payment to the Express backend.
 * Authenticates via session and forwards Authorization: Bearer <email>
 * and the { sessionId } body. Next.js 15: `params` is a Promise.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const base = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!base) {
    return NextResponse.json(
      { error: "Payment backend is not configured." },
      { status: 500 },
    );
  }

  const backendUrl = new URL(
    `/bookings/${encodeURIComponent(id)}/verify-payment`,
    base,
  );

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const res = await fetch(backendUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.user.email}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
