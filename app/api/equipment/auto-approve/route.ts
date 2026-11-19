import { NextResponse } from "next/server";
import { db } from "@/lib/auth";

/**
 * POST /api/equipment/auto-approve
 *
 * Auto-approves every pending equipment listing. Meant to be called by a
 * scheduled job (Vercel Cron / external cron) once a day at midnight.
 *
 * Security: the endpoint is guarded by a shared secret. The caller must send
 * a header `x-auto-approve-secret` (or query param `secret`) matching
 * `AUTO_APPROVE_SECRET` from the environment. Without the secret the request
 * is rejected, so a stray GET or external POST can't trigger it.
 */
export async function POST(request: Request) {
  const secret =
    request.headers.get("x-auto-approve-secret") ??
    new URL(request.url).searchParams.get("secret");

  const expected = process.env.AUTO_APPROVE_SECRET;

  if (!expected || !secret || secret !== expected) {
    return NextResponse.json(
      { error: "Invalid or missing secret" },
      { status: 401 },
    );
  }

  const pending = await db.collection("equipment").find({ status: "pending" });
  const docs = await pending.toArray();

  const approvedCount = docs.length;
  const failedDocs: string[] = [];

  for (const doc of docs) {
    const listingId = String(doc._id);
    try {
      const result = await db.collection("equipment").findOneAndUpdate(
        { _id: doc._id, status: "pending" },
        { $set: { status: "approved", updatedAt: new Date() } },
      );

      if (!result) {
        failedDocs.push(listingId);
      }
    } catch {
      failedDocs.push(listingId);
    }
  }

  return NextResponse.json({
    success: failedDocs.length === 0,
    approvedCount,
    failed: failedDocs,
    message:
      failedDocs.length > 0
        ? `Auto-approved ${approvedCount - failedDocs.length}/${approvedCount} pending listings; ${failedDocs.length} failed.`
        : `Auto-approved ${approvedCount} pending equipment listing(s).`,
  });
}
