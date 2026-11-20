import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth";
import { getActiveRole, hasRole } from "@/lib/roles";
import {
  userIdFilter,
  resolveCanonicalUserId,
  userRefFilter,
} from "@/lib/users";
import { refreshEquipmentReviewStats } from "@/lib/review-stats";

const reviewsCollection = () => db.collection("reviews");

/**
 * GET /api/reviews?equipmentId=...
 * Returns reviews for a given equipment plus stats (average rating, breakdown).
 * Publicly readable - no auth required.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const equipmentId = searchParams.get("equipmentId");

  if (!equipmentId) {
    return NextResponse.json(
      { error: "equipmentId is required" },
      { status: 400 },
    );
  }

  const filter: Record<string, unknown> = { equipmentId };

  const reviews = await reviewsCollection()
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  // Compute stats server-side so the frontend never sees raw data it shouldn't.
  let averageRating = 0;
  let totalReviews = reviews.length;
  const ratingBreakdown: Record<number, number> = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  let sum = 0;
  for (const r of reviews) {
    const rating = Number(r.rating);
    if (rating >= 1 && rating <= 5) {
      sum += rating;
      ratingBreakdown[rating] = (ratingBreakdown[rating] ?? 0) + 1;
    }
  }

  if (totalReviews > 0) {
    averageRating = Math.round((sum / totalReviews) * 10) / 10;
  }

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r._id?.toString(),
      equipmentId: r.equipmentId,
      renterId: r.renterId?.toString?.() ?? r.renterId,
      renterName: r.renterName,
      renterImage: r.renterImage,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    stats: {
      averageRating,
      totalReviews,
      ratingBreakdown,
    },
  });
}

/**
 * POST /api/reviews
 * Create a review. Requires authentication and an active renter role.
 * Prevents duplicate reviews for the same equipment by the same renter.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    console.log("[AUTH] reviews POST: unauthenticated request");
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
  const activeRole = getActiveRole(session.user);
  console.log(
    "[AUTH] reviews POST:",
    { id: session.user.id, email: session.user.email, activeRole, roles },
  );

  if (activeRole !== "renter" || !roles.includes("renter")) {
    return NextResponse.json(
      { error: "Renter access required" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const { equipmentId, rating, comment } = data;

  if (!equipmentId) {
    return NextResponse.json(
      { error: "equipmentId is required" },
      { status: 400 },
    );
  }

  const ratingNum = Number(rating);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5" },
      { status: 400 },
    );
  }

  // Store the canonical user identifier (the user document's `_id`), which
  // is the same value the bookings/other review paths use. This keeps the
  // one-review-per-renter guarantee and the UI's "you already reviewed this"
  // detection consistent regardless of which form submitted the review.
  const renterId = await resolveCanonicalUserId(session.user.id);

  // Prevent duplicate reviews: one review per renter per equipment. Match
  // both the canonical id and any legacy ObjectId/stored form.
  const existing = await reviewsCollection().findOne({
    equipmentId,
    renterId: userRefFilter(renterId),
  });

  if (existing) {
    return NextResponse.json(
      { error: "You have already reviewed this equipment." },
      { status: 409 },
    );
  }

  const doc = {
    equipmentId,
    renterId,
    renterName: session.user.name ?? "Anonymous",
    renterImage: session.user.image ?? null,
    rating: ratingNum,
    comment: comment ?? "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await reviewsCollection().insertOne(doc);

  // Keep the equipment doc's denormalized rating/reviewCount in sync so list
  // cards show live numbers without needing a second fetch.
  await refreshEquipmentReviewStats(String(equipmentId));

  return NextResponse.json({
    success: true,
    id: result.insertedId,
  });
}

/**
 * PATCH /api/reviews
 * Update a review. Only the review author may update it.
 */
export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    console.log("[AUTH] reviews PATCH: unauthenticated request");
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
  const activeRole = getActiveRole(session.user);
  console.log(
    "[AUTH] reviews PATCH:",
    { id: session.user.id, email: session.user.email, activeRole, roles },
  );

  if (activeRole !== "renter" || !roles.includes("renter")) {
    return NextResponse.json(
      { error: "Renter access required" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const { id, rating, comment } = data;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (rating !== undefined) {
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }
    updates.rating = ratingNum;
  }
  if (comment !== undefined) {
    updates.comment = comment;
  }
  updates.updatedAt = new Date();

  // Only the review author can update. Authorize against the canonical user
  // id (with a legacy ObjectId fallback) so the author's own review matches.
  const userId = await resolveCanonicalUserId(session.user.id);
  const _filterId: any = userIdFilter(String(id));
  const _filterRenterId: any = userRefFilter(userId);
  const result = await (reviewsCollection() as any).updateOne(
    { _id: _filterId, renterId: _filterRenterId },
    { $set: updates },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { error: "Review not found or not authorized" },
      { status: 404 },
    );
  }

  // The review belongs to some equipment; refresh that equipment's denormalized
  // rating/reviewCount so list cards stay accurate after an edit.
  const updated = await (reviewsCollection() as any).findOne(
    { _id: _filterId },
  );
  if (updated?.equipmentId) {
    await refreshEquipmentReviewStats(String(updated.equipmentId));
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/reviews?id=...
 * Delete a review. Only the review author may delete it.
 */
export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    console.log("[AUTH] reviews DELETE: unauthenticated request");
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
  const activeRole = getActiveRole(session.user);
  console.log(
    "[AUTH] reviews DELETE:",
    { id: session.user.id, email: session.user.email, activeRole, roles },
  );

  if (activeRole !== "renter" || !roles.includes("renter")) {
    return NextResponse.json(
      { error: "Renter access required" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Only the review author can delete. Authorize against the canonical user
  // id (with a legacy ObjectId fallback).
  const userId = await resolveCanonicalUserId(session.user.id);
  const filter = {
    _id: userIdFilter(id),
    renterId: userRefFilter(userId),
  };
  const docToDelete = await (reviewsCollection() as any).findOne(filter);
  const result = await (reviewsCollection() as any).deleteOne(filter);

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { error: "Review not found or not authorized" },
      { status: 404 },
    );
  }

  // Refresh the equipment's denormalized rating/reviewCount after deletion.
  if (docToDelete?.equipmentId) {
    await refreshEquipmentReviewStats(String(docToDelete.equipmentId));
  }

  return NextResponse.json({ success: true });
}
