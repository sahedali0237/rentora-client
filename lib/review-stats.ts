import { db } from "@/lib/auth";
import { userIdFilter } from "@/lib/users";

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>;
}

/**
 * Compute aggregate review stats (average rating, total, per-star breakdown)
 * for a piece of equipment. Pure aggregation over the `reviews` collection,
 * so it's cheap enough to run on review writes (POST/PATCH/DELETE) to keep
 * the denormalized `rating` / `reviewCount` fields on equipment docs in sync.
 */
export async function computeReviewStats(
  equipmentId: string,
): Promise<ReviewStats> {
  const pipeline = [
    { $match: { equipmentId } },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
  ];

  const groups = await db
    .collection("reviews")
    .aggregate(pipeline)
    .toArray();

  let averageRating = 0;
  let totalReviews = 0;
  const ratingBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  for (const g of groups) {
    const rating = Number(g._id);
    const count = Number(g.count) || 0;
    if (rating >= 1 && rating <= 5) {
      totalReviews += count;
      sum += rating * count;
      ratingBreakdown[rating] = count;
    }
  }

  if (totalReviews > 0) {
    averageRating = Math.round((sum / totalReviews) * 10) / 10;
  }

  return { averageRating, totalReviews, ratingBreakdown };
}

/**
 * Refresh the denormalized `rating` / `reviewCount` fields on an equipment
 * document after a review was created, updated, or deleted. No-op when the
 * equipment no longer exists.
 */
export async function refreshEquipmentReviewStats(
  equipmentId: string,
): Promise<void> {
  const stats = await computeReviewStats(equipmentId);
  await (db.collection("equipment") as unknown as {
    updateOne(
      filter: Record<string, unknown>,
      update: Record<string, unknown>,
    ): Promise<unknown>;
  }).updateOne(
    { _id: userIdFilter(String(equipmentId)) },
    {
      $set: {
        rating: stats.averageRating,
        reviewCount: stats.totalReviews,
      },
    },
  );
}
