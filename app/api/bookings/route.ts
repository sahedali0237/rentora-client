import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth";
import { userIdFilter } from "@/lib/users";

const bookingsCollection = () => db.collection("bookings");

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const activeRole = session.user.activeRole;
  const userId = session.user.id;

  const filter: Record<string, unknown> = {};

  if (activeRole === "owner") {
    filter.ownerId = userIdFilter(userId);
  } else if (activeRole === "renter") {
    filter.renterId = userIdFilter(userId);
  }
  // Admins see all bookings (no filter)

  const bookings = await bookingsCollection()
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (session.user.activeRole !== "renter") {
    return NextResponse.json({ error: "Renter access required" }, { status: 403 });
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
    renterId: session.user.id,
    renterName: session.user.name,
    status: "pending",
    paymentStatus: "unpaid",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await bookingsCollection().insertOne(doc);

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
  } else if (activeRole === "renter") {
    filter.renterId = userIdFilter(userId);
  }

  const result = await bookingsCollection().updateOne(
    filter,
    { $set: { ...updates, updatedAt: new Date() } },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Booking not found or not authorized" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}