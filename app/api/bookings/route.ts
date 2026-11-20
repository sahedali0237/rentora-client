import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth";
import { userIdFilter, resolveCanonicalUserId, usersCollection } from "@/lib/users";

const bookingsCollection = () => db.collection("bookings");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  // If email is provided, find bookings by user email (no auth required)
  if (email) {
    try {
      // Find user by email in the "user" collection
      const user = await usersCollection().findOne({ email });
      
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Convert user's _id to string (renterId in bookings is stored as string)
      const userIdString = user._id?.toString();

      if (!userIdString) {
        return NextResponse.json({ error: "User ID not found" }, { status: 404 });
      }

      // Find bookings where renterId matches the user's _id string
      const bookings = await bookingsCollection()
        .find({ renterId: userIdString })
        .sort({ createdAt: -1 })
        .toArray();

      return NextResponse.json({ bookings });
    } catch (error) {
      console.error("Error fetching bookings by email:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  // Original session-based logic (requires authentication)
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const activeRole = session.user.activeRole;
  // Canonical Mongo _id (as string) of the current user.
  const userId = await resolveCanonicalUserId(session.user.id);
  // The raw session id. Older rows may have been written with this value
  // before we started canonicalizing, so match on both to stay inclusive.
  const sessionId = session.user.id;

  const match: Array<ObjectId | string> = [userIdFilter(userId)];
  if (sessionId !== userId) {
    match.push(userIdFilter(sessionId));
  }

  const filter: Record<string, unknown> = {};

  if (activeRole === "owner") {
    filter.ownerId = { $in: match };
  } else if (activeRole === "renter") {
    filter.renterId = { $in: match };
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

  const startDate = typeof data.startDate === "string" ? data.startDate : null;
  const endDate = typeof data.endDate === "string" ? data.endDate : null;

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 });
  }

  if (startDate < new Date().toISOString().split("T")[0]) {
    return NextResponse.json({ error: "Start date cannot be before today" }, { status: 400 });
  }

  if (endDate < startDate) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
  }

  const renterId = await resolveCanonicalUserId(session.user.id);

  const doc = {
    ...data,
    renterId,
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
  const userId = await resolveCanonicalUserId(session.user.id);

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