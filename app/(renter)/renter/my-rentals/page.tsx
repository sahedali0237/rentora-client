import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { getSession, getActiveRole } from "@/lib/session";
import { apiFetch } from "@/lib/api-fetch";
import type { ApiBooking } from "@/lib/api-types";

export const instant = false;

type RentalRow = {
  equipment: string;
  startDate: string;
  endDate: string;
  bookingDate: string;
  amount: string;
  paymentStatus: string;
  bookingStatus: string;
  id: string;
};

export default async function MyRentalsPage() {
  const session = await getSession();
  if (!session) return null;

  const role = getActiveRole(session.user);

  // Pass the logged-in user's email to the bookings API for reliable lookup
  const email = session.user.email;
  console.log("Logged-in user:", { email, name: session.user.name, id: session.user.id });
  
  const url = `/api/bookings?email=${encodeURIComponent(email)}`;
  console.log("Bookings API URL:", url);
  
  const res = await apiFetch(url);
  const data = await res.json();
  console.log("Bookings response:", data);
  
  const rentals: RentalRow[] = (data.bookings || []).map((b: ApiBooking) => ({
      equipment: b.equipmentName || b.name || "Untitled",
      startDate: b.startDate || "-",
      endDate: b.endDate || "-",
      bookingDate: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "-",
      amount: `$${b.amount || 0}`,
      paymentStatus: b.paymentStatus || "unpaid",
      bookingStatus: b.status || "pending",
      id: b._id || b.id || "",
    }));

  const statusCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0, active: 0, other: 0 };
  for (const r of rentals) {
    const s = r.bookingStatus.toLowerCase();
    if (s === "pending" || s === "confirmed" || s === "completed" || s === "cancelled" || s === "active") {
      statusCounts[s] += 1;
    } else {
      statusCounts.other += 1;
    }
  }

  const columns = [
    { key: "equipment", label: "Equipment" },
    { key: "startDate", label: "Start Date" },
    { key: "endDate", label: "End Date" },
    { key: "bookingDate", label: "Booked On" },
    { key: "amount", label: "Total" },
    { key: "paymentStatus", label: "Payment" },
    { key: "bookingStatus", label: "Status" },
  ];

  return (
    <DashboardLayout role={role} userName={session.user.name} userEmail={session.user.email}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Rentals</h1>
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

        <DataTable
          columns={columns}
          data={rentals}
          cellRenderer={(key, value, row) => {
            if (key === "paymentStatus") {
              const variant = value === "paid" ? "success" : "warning";
              return <Badge variant={variant}><span>{String(value).charAt(0).toUpperCase() + String(value).slice(1)}</span></Badge>;
            }
            if (key === "bookingStatus") {
              const statusMap: Record<string, "default" | "secondary" | "destructive" | "success" | "warning"> = {
                pending: "warning",
                confirmed: "success",
                active: "success",
                completed: "success",
                cancelled: "destructive",
                canceled: "destructive",
              };
              const variant = statusMap[String(value).toLowerCase()] || "secondary";
              return <Badge variant={variant}><span>{String(value).charAt(0).toUpperCase() + String(value).slice(1)}</span></Badge>;
            }
            return value as React.ReactNode;
          }}
        />
      </div>
    </DashboardLayout>
  );
}