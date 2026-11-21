import { DashboardLayout } from "@/components/dashboard-layout";
import { MyRentalsTable, type RentalRow } from "@/components/my-rentals-table";
import { RentalStatsBar } from "@/components/rental-stats-bar";
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
      const results = await Promise.all(
        equipmentIds.map(async (eid) => {
          const res = await apiFetch(
            `/api/equipment/${encodeURIComponent(eid)}`,
          );
          if (!res.ok) return null;
          const d = await res.json();
          return d.equipment || d;
        }),
      );
      allEquipment = results.filter((r): r is ApiEquipment => r !== null);
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

  // Reviews are available at any time, so look up the user's existing reviews
  // against every piece of equipment the user has booked (regardless of
  // booking status).
  const equipmentIdsWithBookings = Array.from(
    new Set(
      rawBookings
        .map((b) => b.equipmentId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  if (equipmentIdsWithBookings.length > 0) {
    try {
      const results = await Promise.all(
        equipmentIdsWithBookings.map(async (eid) => {
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
      // A review can exist for this equipment regardless of booking status;
      // mark the row "reviewed" purely on whether the user has a review.
      reviewed: userReviewBookingIds.includes(b._id || b.id || ""),
    };
  });

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

        <RentalStatsBar initialRows={rows} />

        <MyRentalsTable
          initialRows={rows}
          userReviewBookingIds={userReviewBookingIds}
          allEquipment={allEquipment}
        />
      </div>
    </DashboardLayout>
  );
}
