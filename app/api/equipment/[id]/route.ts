import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveRole } from "@/lib/session";
import { db } from "@/lib/auth";
import { userIdFilter } from "@/lib/users";
import { ApiEquipment } from "@/lib/api-types";

const equipmentCollection = () => db.collection("equipment");

/**
 * GET /api/equipment/[id]
 * Returns a single equipment item.
 * - Admins can view any listing.
 * - Owners can view their own listings regardless of approval status
 *   (so they can manage pending/rejected items).
 * - Everyone else (renters/public) can only view approved equipment.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  const isAdmin = session?.user ? getActiveRole(session.user) === "admin" : false;

  const equipment = (await equipmentCollection().findOne({
    _id: userIdFilter(id),
  } as Record<string, unknown>)) as ApiEquipment | null;

  if (!equipment) {
    return NextResponse.json(
      { error: "Equipment not found" },
      { status: 404 },
    );
  }

  const isOwner =
    !!userId &&
    (equipment.ownerId === userId ||
      equipment.ownerId?.toString() === userId.toString());

  const status = String(equipment.status ?? "pending").toLowerCase();
  if (!isAdmin && !isOwner && status !== "approved") {
    return NextResponse.json(
      { error: "Equipment not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ equipment });
}
