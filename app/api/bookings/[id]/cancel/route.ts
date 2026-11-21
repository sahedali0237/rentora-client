import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Proxy PATCH /bookings/:id/cancel to the Express backend.
 * Authenticates via session and forwards Authorization: Bearer <email>
 * so the backend owns cancellation logic and authorization.
 * Next.js 15: `params` is a Promise.
 */
export async function PATCH(
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
      { error: "Backend is not configured." },
      { status: 500 },
    );
  }

  const backendUrl = new URL(
    `/bookings/${encodeURIComponent(id)}/cancel`,
    base,
  );

  // Forward the body if present (some callers send no body).
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }

  const init: RequestInit = {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${session.user.email}`,
    },
  };
  if (body !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] =
      "application/json";
    (init as RequestInit & { body?: string }).body = JSON.stringify(body);
  }

  const res = await fetch(backendUrl.toString(), init);
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
