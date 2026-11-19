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

  const result = await db.collection("equipment").updateMany(
    { status: "pending" },
    {
      $set: { status: "approved", updatedAt: new Date() },
    },
  );

  const approvedCount = result.modifiedCount;

  return NextResponse.json({
    success: true,
    approvedCount,
    message: `Auto-approved ${approvedCount} pending equipment listing(s).`,
  });
}
