import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth";
import { getActiveRole } from "@/lib/roles";
import { resolveCanonicalUserId } from "@/lib/users";
import { refreshEquipmentReviewStats } from "@/lib/review-stats";

const reviewsCollection = () => db.collection("reviews");

/**
 * Coerce a review id to a Mongo-native filter value. Review `_id`s are written
 * as ObjectIds, so a 24-char hex string is converted to an ObjectId; anything
 * else is passed through as-is.
 */
function reviewIdFilter(id: string): ObjectId | string {
  if (id.length === 24 && /^[0-9a-f]{24}$/i.test(id)) {
    return new ObjectId(id);
  }
  return id;
}

/**
 * PATCH /api/reviews/:id
 * Update a review's rating and/or comment. Only the review author may update it.
 *
 * Validates the id is a valid ObjectId, validates rating (1-5) and a
 * non-empty comment, verifies the review exists and belongs to the requester
 * (matched by canonical user id, with an email cross-check when `userEmail`
 * is provided), then returns the updated review with status 200.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    console.log("[AUTH] reviews PATCH :id: unauthenticated request");
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
  const activeRole = getActiveRole(session.user);
  console.log(
    "[AUTH] reviews PATCH :id:",
    { id, userId: session.user.id, email: session.user.email, activeRole, roles },
  );

  if (activeRole !== "renter" || !roles.includes("renter")) {
    return NextResponse.json(
      { error: "Renter access required" },
      { status: 403 },
    );
  }

  // 1. Validate the id is a valid MongoDB ObjectId.
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const { rating, comment } = data;

  const updates: Record<string, unknown> = {};
  let hasUpdate = false;

  // 2. Validate rating (1-5) when provided.
  if (rating !== undefined) {
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }
    updates.rating = ratingNum;
    hasUpdate = true;
  }

  // 3. Validate non-empty comment when provided.
  if (comment !== undefined) {
    const commentText = String(comment).trim();
    if (commentText === "") {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 });
    }
    updates.comment = commentText;
    hasUpdate = true;
  }

  if (!hasUpdate) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  updates.updatedAt = new Date();

  // 4. Verify the review exists.
  const filterId = reviewIdFilter(id);
  const coll = reviewsCollection() as any;
  const existing = await coll.findOne({ _id: filterId });
  if (!existing) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  // 5. Authorize: the review must belong to the requester. Match the canonical
  //    user id (with legacy ObjectId fallback), and cross-check email when the
  //    requester's email / userEmail is provided.
  const userId = await resolveCanonicalUserId(session.user.id);
  const storedRenterId = existing.renterId;

  const idMatches =
    storedRenterId === userId ||
    String(storedRenterId) === String(userId) ||
    (storedRenterId instanceof ObjectId &&
      userId.length === 24 &&
      /^[0-9a-f]{24}$/i.test(userId) &&
      storedRenterId.equals(new ObjectId(userId)));

  let emailMatches = true;
  const storedEmail = String(existing.renterEmail ?? "").toLowerCase();
  if (storedEmail && session.user.email) {
    emailMatches = storedEmail === String(session.user.email).toLowerCase();
  }

  if (!idMatches || !emailMatches) {
    return NextResponse.json(
      { error: "Review not found or not authorized" },
      { status: 404 },
    );
  }

  const result = await coll.updateOne({ _id: filterId }, { $set: updates });

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { error: "Review not found or not authorized" },
      { status: 404 },
    );
  }

  // Keep the equipment's denormalized rating/reviewCount in sync so list cards
  // stay accurate after an edit.
  const updated = await coll.findOne({ _id: filterId });
  if (updated?.equipmentId) {
    await refreshEquipmentReviewStats(String(updated.equipmentId));
  }

  // 6. Return the updated review with status 200.
  return NextResponse.json(
    {
      id: updated?._id?.toString?.() ?? id,
      equipmentId: updated?.equipmentId,
      renterId: updated?.renterId?.toString?.() ?? updated?.renterId,
      renterName: updated?.renterName,
      renterImage: updated?.renterImage,
      rating: updated?.rating,
      comment: updated?.comment,
      createdAt: updated?.createdAt,
      updatedAt: updated?.updatedAt,
    },
    { status: 200 },
  );
}
