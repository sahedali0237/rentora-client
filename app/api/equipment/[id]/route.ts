import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/auth";
import { userIdFilter } from "@/lib/users";

const equipmentCollection = () => db.collection("equipment");

/**
 * GET /api/equipment/[id]
 * Returns a single equipment item. Publicly readable if approved.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const equipment = await equipmentCollection().findOne({
    _id: userIdFilter(id),
    status: "approved",
  } as Record<string, unknown>);

  if (!equipment) {
    return NextResponse.json(
      { error: "Equipment not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ equipment });
}
