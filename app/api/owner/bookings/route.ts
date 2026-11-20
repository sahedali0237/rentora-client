import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth";
import { getActiveRole, hasRole } from "@/lib/roles";
import { resolveCanonicalUserId, userRefFilter } from "@/lib/users";

const bookingsCollection = () => db.collection("bookings");
const equipmentCollection = () => db.collection("equipment");

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      console.log("[AUTH] owner/bookings GET: unauthenticated request");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
    const activeRole = getActiveRole(session.user);
    console.log(
      "[AUTH] owner/bookings GET:",
      { id: session.user.id, email: session.user.email, activeRole, roles },
    );

    if (activeRole !== "owner" || !roles.includes("owner")) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }

    // Resolve canonical user ID (MongoDB _id as string)
    const userId = await resolveCanonicalUserId(session.user.id);

    // Step 1: Find all equipment owned by this owner
    // ownerId is stored as a string on equipment documents; userRefFilter
    // matches both the string and ObjectId representations.
    const ownerEquipment = await equipmentCollection()
      .find({ ownerId: userRefFilter(userId) })
      .project({ _id: 1, name: 1 })
      .toArray();

    if (ownerEquipment.length === 0) {
      return NextResponse.json({ bookings: [] });
    }

    // Step 2: Extract equipment IDs as strings (bookings store equipmentId as string)
    const equipmentIds = ownerEquipment.map((eq) => eq._id.toString());

    // Step 3: Find bookings for these equipment IDs
    const bookings = await bookingsCollection()
      .find({ equipmentId: { $in: equipmentIds } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching owner bookings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}