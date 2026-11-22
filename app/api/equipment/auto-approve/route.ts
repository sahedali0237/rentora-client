import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/auth";

/**
 * POST /api/equipment/auto-approve
 *
 * Auto-approves every pending equipment listing. Meant to be called by a
 * scheduled job (Vercel Cron / external cron) once a day at midnight.
 *
 * Security: the endpoint is guarded by a shared secret. The caller must send
 * one of:
 *   - Authorization: Bearer <secret>
 *   - x-auto-approve-secret: <secret>
 *   - ?secret=<secret>
 * matching the AUTO_APPROVE_SECRET environment variable (CRON_SECRET is
 * accepted as an alias). Without a valid secret the request is rejected, so
 * a stray external POST can't trigger it.
 *
 * Vercel Cron calls this path with GET (see vercel.json); GET is accepted
 * with the same secret guard so the midnight job works, while the documented
 * POST keeps working for external/manual callers.
 */
async function run(request: Request) {
  const secret =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-auto-approve-secret") ??
    new URL(request.url).searchParams.get("secret");

  const expected =
    process.env.AUTO_APPROVE_SECRET ?? process.env.CRON_SECRET;

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
        { _id: new ObjectId(listingId), status: "pending" },
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

export const POST = run;
export const GET = run;
