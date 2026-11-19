import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { getSession, getActiveRole } from "@/lib/session";
import { apiFetch } from "@/lib/api-fetch";
import type { ApiBooking } from "@/lib/api-types";

export const instant = false;

type RentalRow = {
  customer: string;
  owner: string;
  equipment: string;
  duration: string;
  amount: string;
  paymentStatus: string;
  bookingStatus: string;
  id: string;
};

export default async function AllRentalsPage() {
  const session = await getSession();
  if (!session) return null;

  const role = getActiveRole(session.user);

  const res = await apiFetch("/api/bookings");
  const data = await res.json();
  const rentals: RentalRow[] = (data.bookings || []).map((b: ApiBooking) => ({
    customer: b.renterName || "Unknown",
    owner: b.ownerName || "Unknown",
    equipment: b.equipmentName || b.name || "Untitled",
    duration: `${b.startDate || "-"} to ${b.endDate || "-"}`,
    amount: `$${b.amount || 0}`,
    paymentStatus: b.paymentStatus || "unpaid",
    bookingStatus: b.status || "pending",
    id: b._id || b.id || "",
  }));

  const columns = [
    { key: "customer", label: "Customer" },
    { key: "owner", label: "Owner" },
    { key: "equipment", label: "Equipment" },
    { key: "duration", label: "Rental Duration" },
    { key: "amount", label: "Amount" },
    { key: "paymentStatus", label: "Payment" },
    { key: "bookingStatus", label: "Status" },
  ];

  return (
    <DashboardLayout role={role} userName={session.user.name} userEmail={session.user.email}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Rentals</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitor and manage all rental activity across the platform.
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={rentals}
          cellRenderer={(key, value, row) => {
            if (key === "paymentStatus") {
              const variant = value === "paid" ? "success" : "warning";
              return <Badge variant={variant}><span>{String(value).charAt(0).toUpperCase() + String(value).slice(1)}</span></Badge>;
            }
            if (key === "bookingStatus") {
              const variant = value === "completed" ? "success" : value === "cancelled" ? "destructive" : "secondary";
              return <Badge variant={variant}><span>{String(value).charAt(0).toUpperCase() + String(value).slice(1)}</span></Badge>;
            }
            return value as React.ReactNode;
          }}
        />
      </div>
    </DashboardLayout>
  );
}