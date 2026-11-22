import { NextResponse } from "next/server";
import { db } from "@/lib/auth";

function isAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET ?? process.env.AUTO_APPROVE_SECRET;
  if (!expected) return false;

  const bearer = request.headers.get("authorization");
  const custom = request.headers.get("x-auto-approve-secret");
  const query = new URL(request.url).searchParams.get("secret");

  return (
    bearer === `Bearer ${expected}` ||
    custom === expected ||
    query === expected
  );
}

async function run(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await db.collection("equipment").updateMany(
      { status: "pending" },
      { $set: { status: "approved", updatedAt: new Date() } },
    );

    return NextResponse.json({
      success: true,
      matched: result.matchedCount,
      approvedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("auto-approve failed", err);
    return NextResponse.json({ success: false, error: "DB error" }, { status: 500 });
  }
}

export const GET = run;   // Vercel Cron
export const POST = run;  // manual / external cron

