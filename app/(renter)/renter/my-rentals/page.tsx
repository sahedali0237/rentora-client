import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/stat-card";
import { MyRentalsTable, type RentalRow } from "@/components/my-rentals-table";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { getSession, getActiveRole } from "@/lib/session";
import { apiFetch } from "@/lib/api-fetch";
import { resolveCanonicalUserId } from "@/lib/users";
import type {
  ApiBooking,
  ApiEquipment,
  ApiReview,
  BookingStatus,
} from "@/lib/api-types";

export const instant = false;

export default async function MyRentalsPage() {
  const session = await getSession();
  if (!session) return null;

  const role = getActiveRole(session.user);

  // Pass the logged-in user's email to the bookings API for reliable lookup
  const email = session.user.email;

  // The reviews API stores renterId as the user's canonical Mongo `_id`.
  // Resolve it once so "is this review mine?" matches the stored value.
  const canonicalUserId = await resolveCanonicalUserId(session.user.id);

  const bookingsRes = await apiFetch(
    `/api/bookings?email=${encodeURIComponent(email)}`,
  );
  const bookingsData = await bookingsRes.json();
  const rawBookings: ApiBooking[] = bookingsData.bookings || [];

  // Fetch equipment for all booked equipment so the dialog can display
  // the name/image used by the ReviewDialog.
  const equipmentIds = Array.from(
    new Set(
      rawBookings
        .map((b) => b.equipmentId)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  let allEquipment: ApiEquipment[] = [];
  if (equipmentIds.length > 0) {
    try {
      const [first] = equipmentIds;
      const equipRes = await apiFetch(
        `/api/equipment/${encodeURIComponent(first)}`,
      );
      if (equipRes.ok) {
        const equipData = await equipRes.json();
        allEquipment = [equipData.equipment || equipData];
      }
      const remaining = equipmentIds.slice(1);
      if (remaining.length > 0) {
        const results = await Promise.all(
          remaining.map(async (eid) => {
            const res = await apiFetch(
              `/api/equipment/${encodeURIComponent(eid)}`,
            );
            if (!res.ok) return null;
            const d = await res.json();
            return d.equipment || d;
          }),
        );
        allEquipment.push(
          ...results.filter((r): r is ApiEquipment => r !== null),
        );
      }
    } catch {
      // Fail silently — the table will render without equipment thumbnails
    }
  }

  // Build the set of booking IDs that already have a review from the current
  // user, so the UI can flip "Write a Review" to "✓ Reviewed" on load.
  //
  // The current /api/reviews route does not yet support per-user lookup (it
  // requires equipmentId), so we fetch reviews per equipment the user has
  // booked and union the booking IDs found. This way, if the backend
  // already has the user's review for a piece of equipment, we show
  // "Reviewed" without needing a new endpoint.
  const userReviewBookingIds: string[] = [];

  const completedEquipmentIds = Array.from(
    new Set(
      rawBookings
        .filter((b) => String(b.status || "").toLowerCase() === "completed")
        .map((b) => b.equipmentId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  if (completedEquipmentIds.length > 0) {
    try {
      const results = await Promise.all(
        completedEquipmentIds.map(async (eid) => {
          const res = await apiFetch(
            `/api/reviews?equipmentId=${encodeURIComponent(eid)}`,
          );
          if (!res.ok) return [];
          const data = await res.json();
          return (data.reviews || []) as ApiReview[];
        }),
      );
      const allReviews = results.flat() as Array<
        ApiReview & { bookingId?: string }
      >;
      // Filter to reviews authored by the current user, and collect the
      // bookingIds (if present) plus the equipmentIds (as a fallback to
      // mark the completed booking as reviewed).
      const userReviewIds = new Set<string>();
      for (const r of allReviews) {
        const isMine =
          (r.renterId && r.renterId === canonicalUserId) ||
          (r.renterName && r.renterName === session.user.name);
        if (!isMine) continue;
        if (r.bookingId) userReviewIds.add(r.bookingId);
        // Also mark the booking(s) for this equipment as reviewed, since
        // the backend deduplicates one review per (renter, equipment).
        for (const b of rawBookings) {
          if (b.equipmentId === r.equipmentId) {
            userReviewIds.add(b._id || b.id || "");
          }
        }
      }
      for (const id of userReviewIds) {
        if (id && !userReviewBookingIds.includes(id)) {
          userReviewBookingIds.push(id);
        }
      }
    } catch {
      // Fail silently — the table will render with the best-known state
    }
  }

  // Build rows
  const rows: RentalRow[] = rawBookings.map((b) => {
    const rawStatus = String(b.status || "").toLowerCase();
    const status: BookingStatus =
      rawStatus === "pending" ||
      rawStatus === "confirmed" ||
      rawStatus === "active" ||
      rawStatus === "completed" ||
      rawStatus === "cancelled"
        ? rawStatus
        : "pending";
    return {
      booking: b,
      status,
      reviewed:
        status === "completed" &&
        userReviewBookingIds.includes(b._id || b.id || ""),
    };
  });

  const statusCounts = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    active: 0,
    other: 0,
  };
  for (const r of rows) {
    const s = r.status.toLowerCase();
    if (
      s === "pending" ||
      s === "confirmed" ||
      s === "completed" ||
      s === "cancelled" ||
      s === "active"
    ) {
      statusCounts[s] += 1;
    } else {
      statusCounts.other += 1;
    }
  }

  return (
    <DashboardLayout
      role={role}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Rentals
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track your active, upcoming, and past bookings.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Pending"
            value={statusCounts.pending}
            subtitle="Awaiting approval"
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="Confirmed"
            value={statusCounts.confirmed}
            subtitle="Active bookings"
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            title="Cancelled"
            value={statusCounts.cancelled}
            subtitle="No longer active"
            icon={XCircle}
            color="rose"
          />
        </div>

        <MyRentalsTable
          initialRows={rows}
          userReviewBookingIds={userReviewBookingIds}
          allEquipment={allEquipment}
        />
      </div>
    </DashboardLayout>
  );
}
