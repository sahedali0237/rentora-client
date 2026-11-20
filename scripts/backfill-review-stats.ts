/**
 * One-time backfill: compute `rating` / `reviewCount` for every equipment
 * document from the `reviews` collection and store them on the equipment
 * doc. Run this after upgrading from a version that did not write those
 * fields, so list cards show live numbers instead of 0.
 *
 * Usage: `node scripts/backfill-review-stats.ts`
 *
 * The script is safe to re-run: it recomputes and overwrites the two fields.
 */
import { db } from "../lib/auth";
import { computeReviewStats } from "../lib/review-stats";

async function main() {
  const equipment = await db.collection("equipment").find({}).toArray();
  console.log(
    `Backfilling review stats for ${equipment.length} equipment document(s)...`,
  );

  let updated = 0;
  for (const eq of equipment) {
    const equipmentId = eq._id?.toString?.() ?? eq.id;
    if (!equipmentId) continue;
    const stats = await computeReviewStats(String(equipmentId));
    const current = {
      rating: eq.rating ?? 0,
      reviewCount: eq.reviewCount ?? 0,
    };
    if (
      current.rating === stats.averageRating &&
      current.reviewCount === stats.totalReviews
    ) {
      continue;
    }
    await db.collection("equipment").updateOne(
      { _id: eq._id ?? eq.id },
      {
        $set: {
          rating: stats.averageRating,
          reviewCount: stats.totalReviews,
        },
      },
    );
    updated += 1;
    console.log(
      `  ${equipmentId}: ${current.rating} (${current.reviewCount}) -> ` +
        `${stats.averageRating} (${stats.totalReviews})`,
    );
  }

  console.log(`Done. ${updated} document(s) updated.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
