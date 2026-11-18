import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth";
import { userIdFilter } from "@/lib/users";

const equipmentCollection = () => db.collection("equipment");

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const activeRole = session.user.activeRole;
  const userId = session.user.id;

  const filter: Record<string, unknown> = {};

  if (activeRole === "owner") {
    // Owners see only their own equipment
    filter.ownerId = userIdFilter(userId);
  }
  // Admins see all equipment (no filter)
  // Renters should not access this route

  if (activeRole === "renter") {
    return NextResponse.json({ error: "Renters cannot access equipment management" }, { status: 403 });
  }

  const equipment = await equipmentCollection()
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ equipment });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (session.user.activeRole !== "owner") {
    return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;

  const doc = {
    ...data,
    ownerId: session.user.id,
    ownerName: session.user.name,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await equipmentCollection().insertOne(doc);

  return NextResponse.json({ success: true, id: result.insertedId });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, ...updates } = body as { id?: string; [key: string]: unknown };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const activeRole = session.user.activeRole;
  const userId = session.user.id;

  const filter: Record<string, unknown> = { _id: userIdFilter(id) };

  if (activeRole === "owner") {
    filter.ownerId = userIdFilter(userId);
  }

  const result = await equipmentCollection().updateOne(
    filter,
    { $set: { ...updates, updatedAt: new Date() } },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Equipment not found or not authorized" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const activeRole = session.user.activeRole;
  const userId = session.user.id;

  const filter: Record<string, unknown> = { _id: userIdFilter(id) };

  if (activeRole === "owner") {
    filter.ownerId = userIdFilter(userId);
  }

  const result = await equipmentCollection().deleteOne(filter);

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Equipment not found or not authorized" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}