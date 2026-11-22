import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveRole } from "@/lib/roles";
import { db } from "@/lib/auth";

const usersCollection = () => db.collection("user");
const equipmentCollection = () => db.collection("equipment");
const bookingsCollection = () => db.collection("bookings");

/**
 * GET /api/admin/stats
 * Aggregated admin dashboard statistics (admin only).
 *
 * Returns a single source of truth for the four headline stat cards:
 * total users, total equipment, pending approvals, and total revenue.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    console.log("[AUTH] admin/stats GET: unauthenticated request");
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const activeRole = getActiveRole(session.user);
  console.log(
    "[AUTH] admin/stats GET:",
    { id: session.user.id, email: session.user.email, activeRole },
  );

  if (activeRole !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const [totalUsers, totalEquipment, pendingApprovals, revenueResult] =
      await Promise.all([
        usersCollection().countDocuments({}),
        equipmentCollection().countDocuments({}),
        equipmentCollection().countDocuments({ status: "pending" }),
        // Sum revenue server-side with $group/$sum instead of loading every
        // paid booking document into memory (.find().toArray()).
        bookingsCollection().aggregate([
          { $match: { paymentStatus: "paid" } },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $convert: {
                    // Newer bookings carry `totalPrice`, older ones `amount`.
                    // Guard against missing/non-numeric values.
                    input: { $ifNull: ["$totalPrice", "$amount", 0] },
                    to: "double",
                    onError: 0,
                    onNull: 0,
                  },
                },
              },
            },
          },
        ]).toArray(),
      ]);

    const totalRevenue = Number(revenueResult[0]?.total ?? 0);

    return NextResponse.json({
      totalUsers,
      totalEquipment,
      pendingApprovals,
      totalRevenue,
    });
  } catch (error) {
    console.error("GET /api/admin/stats failed:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
