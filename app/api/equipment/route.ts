import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveRole } from "@/lib/session";
import { db } from "@/lib/auth";
import { userIdFilter } from "@/lib/users";

const equipmentCollection = () => db.collection("equipment");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "6", 10), 1),
    100,
  );
  const skip = (page - 1) * limit;

  const mine = searchParams.get("mine");

  const session = await auth.api.getSession({ headers: await headers() });
  const isAdmin = session?.user ? getActiveRole(session.user) === "admin" : false;

  const filter: Record<string, unknown> = {};

  if (mine === "true") {
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    filter.ownerId = session.user.id;
  } else if (!isAdmin) {
    // Public / non-admin viewers only see approved listings.
    filter.status = { $regex: /^approved$/i };
  }
  // Admins viewing All Equipment see every listing (pending, approved, rejected)
  // so they can moderate them.

  const category = searchParams.get("category");
  if (category) {
    filter.category = category;
  }

  const location = searchParams.get("location");
  if (location) {
    filter.location = { $regex: location, $options: "i" };
  }

  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  if (minPrice || maxPrice) {
    const priceFilter: Record<string, unknown> = {};
    if (minPrice) priceFilter.$gte = Number(minPrice);
    if (maxPrice) priceFilter.$lte = Number(maxPrice);
    filter.rentalPrice = priceFilter;
  }

  const rentalType = searchParams.get("rentalType");
  if (rentalType) {
    filter.rentalType = rentalType;
  }

  const search = searchParams.get("search");
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const sortField = searchParams.get("sort") ?? "createdAt";
  const sortOrder = searchParams.get("order") === "asc" ? 1 : -1;

  const equipment = await equipmentCollection()
    .find(filter)
    .sort({ [sortField]: sortOrder })
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await equipmentCollection().countDocuments(filter);

  return NextResponse.json({
    equipment,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
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

  const requiredFields = [
    "name",
    "description",
    "category",
    "location",
    "rentalPrice",
    "rentalType",
    "availableQuantity",
    "condition",
    "terms",
  ];
  const missing = requiredFields.filter(
    (field) => data[field] === undefined || data[field] === "",
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  const doc = {
    ...data,
    ownerId: session.user.id,
    ownerName: session.user.name,
    ownerEmail: session.user.email,
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
  const isAdmin = getActiveRole(session.user) === "admin";

  if (activeRole !== "owner" && !isAdmin) {
    return NextResponse.json(
      { error: "Owner access required" },
      { status: 403 },
    );
  }

  const filter: Record<string, unknown> = {
    _id: userIdFilter(id),
  };
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
  const isAdmin = getActiveRole(session.user) === "admin";

  if (activeRole !== "owner" && !isAdmin) {
    return NextResponse.json(
      { error: "Owner access required" },
      { status: 403 },
    );
  }

  const filter: Record<string, unknown> = {
    _id: userIdFilter(id),
  };
  if (activeRole === "owner") {
    filter.ownerId = userIdFilter(userId);
  }

  const result = await equipmentCollection().deleteOne(filter);

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Equipment not found or not authorized" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}