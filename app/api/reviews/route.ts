import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth";
import { getActiveRole, hasRole } from "@/lib/roles";
import {
  resolveCanonicalUserId,
  userRefFilter,
  usersCollection,
} from "@/lib/users";
import { refreshEquipmentReviewStats } from "@/lib/review-stats";

const reviewsCollection = () => db.collection("reviews");

/**
 * Retry an async MongoDB operation up to `tries` times.
 * Delays grow linearly: 400ms * attempt before each retry.
 */
async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === tries - 1) throw err;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw new Error("withRetry: unreachable");
}

const EMPTY_STATS = {
  averageRating: 0,
  totalReviews: 0,
  ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
};

/**
 * Compute review stats server-side so the frontend never sees raw data it
 * shouldn't.
 */
function computeStats(reviews: Array<Record<string, unknown>>) {
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

  return { averageRating, totalReviews, ratingBreakdown };
}

/**
 * GET /api/reviews?equipmentId=...&userId=...&email=...
 * Returns reviews newest-first. Supports optional filters by equipment,
 * renter (canonical user id), or renter email. Returns all reviews when no
 * query params are provided. Publicly readable - no auth required.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const equipmentId = searchParams.get("equipmentId");
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    const filter: Record<string, unknown> = {};

    if (equipmentId) {
      filter.equipmentId = equipmentId;
    }

    // Identity-based filters (`userId` takes precedence over `email`). Reviews
    // store `renterId` (the user's canonical Mongo `_id`), so an email filter
    // is resolved to a user document first.
    if (userId) {
      filter.renterId = userRefFilter(userId);
    } else if (email) {
      const user = await usersCollection().findOne({ email } as any);
      if (!user) {
        return NextResponse.json({ reviews: [], stats: EMPTY_STATS });
      }
      const canonicalId = user._id?.toString();
      if (!canonicalId) {
        return NextResponse.json({ reviews: [], stats: EMPTY_STATS });
      }
      filter.renterId = userRefFilter(canonicalId);
    }

    const reviews = await withRetry(() =>
      reviewsCollection()
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray(),
    );

    const { averageRating, totalReviews, ratingBreakdown } = computeStats(reviews);

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
  } catch (err) {
    console.error("GET /api/reviews failed:", err);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 503 });
  }
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

  // Accept the review id from the JSON body or as a query param.
  let id: string | null = null;
  try {
    const data = await request.json();
    id = data.id ? String(data.id) : null;
  } catch {
    id = null;
  }
  if (!id) {
    const { searchParams } = new URL(request.url);
    id = searchParams.get("id");
  }

  // 1. Validate the id is a valid MongoDB ObjectId.
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
  }

  const filterId =
    id.length === 24 && /^[0-9a-f]{24}$/i.test(id) ? new ObjectId(id) : id;
  // 2. Find the review by _id and verify the requester is its author.
  //    Authorize against the canonical user id (with a legacy ObjectId
  //    fallback).
  const userId = await resolveCanonicalUserId(session.user.id);
  const coll = reviewsCollection() as any;
  const docToDelete = await coll.findOne({ _id: filterId });

  const storedRenterId = docToDelete?.renterId;
  const idMatches =
    storedRenterId === userId ||
    String(storedRenterId) === String(userId) ||
    (storedRenterId instanceof ObjectId &&
      userId.length === 24 &&
      /^[0-9a-f]{24}$/i.test(userId) &&
      storedRenterId.equals(new ObjectId(userId)));

  if (!docToDelete || !idMatches) {
    return NextResponse.json(
      { error: "Review not found or not authorized" },
      { status: 404 },
    );
  }

  const result = await coll.deleteOne({ _id: filterId });

  // Refresh the equipment's denormalized rating/reviewCount after deletion.
  if (docToDelete?.equipmentId) {
    await refreshEquipmentReviewStats(String(docToDelete.equipmentId));
  }

  return NextResponse.json({ success: true });
}
