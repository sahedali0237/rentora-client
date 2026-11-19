import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth";
import { userIdFilter } from "@/lib/users";

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
      renterId: r.renterId,
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
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (session.user.activeRole !== "renter") {
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

  // Prevent duplicate reviews: one review per renter per equipment.
  const existing = await reviewsCollection().findOne({
    equipmentId,
    renterId: session.user.id,
  });

  if (existing) {
    return NextResponse.json(
      { error: "You have already reviewed this equipment." },
      { status: 400 },
    );
  }

  const doc = {
    equipmentId,
    renterId: session.user.id,
    renterName: session.user.name ?? "Anonymous",
    renterImage: session.user.image ?? null,
    rating: ratingNum,
    comment: comment ?? "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await reviewsCollection().insertOne(doc);

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
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (session.user.activeRole !== "renter") {
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

  // Only the review author can update.
  const _filterId: any = userIdFilter(String(id));
  const _filterRenterId: any = userIdFilter(String(session.user.id));
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

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/reviews?id=...
 * Delete a review. Only the review author may delete it.
 */
export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (session.user.activeRole !== "renter") {
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

  // Only the review author can delete.
  const result = await (reviewsCollection() as any).deleteOne(
    {
      _id: userIdFilter(id),
      renterId: userIdFilter(session.user.id),
    },
  );

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { error: "Review not found or not authorized" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
