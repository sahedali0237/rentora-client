import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userIdFilter, usersCollection } from "@/lib/users";
import { requireRole } from "@/lib/session";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const activeRole = session.user.activeRole;
  if (activeRole !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const users = await usersCollection()
    .find(
      {},
      { projection: { name: 1, email: 1, roles: 1, activeRole: 1, createdAt: 1 } },
    )
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ users });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (session.user.activeRole !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, role } = body as { userId?: string; role?: string };

  if (!userId || !role) {
    return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
  }

  if (!["admin", "owner", "renter"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  await usersCollection().updateOne(
    { _id: userIdFilter(userId) },
    { $set: { roles: [role], activeRole: role } },
  );

  return NextResponse.json({ success: true });
}