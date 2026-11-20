import { headers } from "next/headers";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveRole, hasRole } from "@/lib/roles";
import { db } from "@/lib/auth";
import { userIdFilter, resolveCanonicalUserId, userRefFilter } from "@/lib/users";

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
  const email = searchParams.get("email");

  const session = await auth.api.getSession({ headers: await headers() });
  const isAdmin = session?.user ? getActiveRole(session.user) === "admin" : false;

  const filter: Record<string, unknown> = {};

  if (mine === "true") {
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    filter.ownerId = userRefFilter(await resolveCanonicalUserId(session.user.id));
  } else if (email) {
    // Allow filtering by owner email (for My Equipment page)
    filter.ownerEmail = email;
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
    .sort({ [sortField]: sortOrder, createdAt: -1 })
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
    console.log("[AUTH] equipment POST: unauthenticated request");
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const activeRole = session.user.activeRole;
  const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
  console.log(
    "[AUTH] equipment POST:",
    { id: session.user.id, email: session.user.email, activeRole, roles },
  );

  if (activeRole !== "owner" || !roles.includes("owner")) {
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

  const ownerId = await resolveCanonicalUserId(session.user.id);

  // Prevent duplicate listings: same owner cannot list the same equipment name twice.
  const escapedName = String(data.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existing = await equipmentCollection().findOne({
    ownerId: userRefFilter(ownerId),
    name: { $regex: `^${escapedName}$`, $options: "i" },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already have an equipment listing with this name." },
      { status: 409 },
    );
  }

  const doc = {
    ...data,
    ownerId,
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
    console.log("[AUTH] equipment PATCH: unauthenticated request");
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
  const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
  const userId = await resolveCanonicalUserId(session.user.id);

  // Admins can moderate any listing. Resolve the effective role the same way
  // the GET handler does (trusts an explicitly-set activeRole, falling back to
  // the highest granted role) so an admin whose activeRole is "admin" is never
  // rejected with "Owner access required".
  const isAdmin = getActiveRole(session.user) === "admin";
  console.log(
    "[AUTH] equipment PATCH:",
    { id: session.user.id, email: session.user.email, activeRole, roles, targetId: id },
  );

  if (!isAdmin && (activeRole !== "owner" || !roles.includes("owner"))) {
    return NextResponse.json(
      { error: "Owner access required" },
      { status: 403 },
    );
  }

  const filter: Record<string, unknown> = {
    _id: userIdFilter(id),
  };
  // Non-admin owners may only edit their own listings. Admins are not scoped
  // by ownerId, so they can update moderation/approval fields (status,
  // isApproved, approved, etc.) on any equipment item.
  if (activeRole === "owner" && !isAdmin) {
    filter.ownerId = userRefFilter(userId);
  }

  const result = await equipmentCollection().updateOne(
    filter,
    { $set: { ...updates, updatedAt: new Date() } },
  );

  if (result.matchedCount === 0) {
    const exists = await equipmentCollection().countDocuments({
      _id: userIdFilter(id),
    } as Record<string, unknown>);
    if (exists === 0) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "You are not allowed to edit this listing." },
      { status: 403 },
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    console.log("[AUTH] equipment DELETE: unauthenticated request");
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const activeRole = session.user.activeRole;
  const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
  const userId = await resolveCanonicalUserId(session.user.id);
  const isAdmin = hasRole(roles, "admin") && activeRole === "admin";
  console.log(
    "[AUTH] equipment DELETE:",
    { id: session.user.id, email: session.user.email, activeRole, roles, targetId: id },
  );

  // Fetch the listing first so we can authorize on *ownership* or admin role.
  const doc = (await equipmentCollection().findOne({
    _id: userIdFilter(id),
  } as Record<string, unknown>)) as { ownerId?: string; _id?: unknown } | null;

  if (!doc) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  const isOwner =
    !!userId &&
    (doc.ownerId === userId ||
      doc.ownerId?.toString() === userId.toString() ||
      userIdFilter(doc.ownerId as string) === userIdFilter(userId));

  if (!isAdmin && !isOwner) {
    return NextResponse.json(
      { error: "You are not allowed to delete this listing." },
      { status: 403 },
    );
  }

  const result = await equipmentCollection().deleteOne({
    _id: userIdFilter(id),
  } as Record<string, unknown>);

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { error: "Equipment not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    deletedCount: result.deletedCount,
  });
}