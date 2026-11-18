import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/stat-card";
import { ListPlus, Package, Truck, DollarSign, Users } from "lucide-react";
import { getSession, getActiveRole } from "@/lib/session";
import { apiFetch } from "@/lib/api-fetch";
import type { ApiBooking, ApiEquipment } from "@/lib/api-types";
import { EarningsChart } from "@/components/earnings-chart";

// Cache Components: the signed-in check uses headers()/sessions, so this
// segment must be a blocking route.
export const instant = false;

function OwnerDashboardSkeleton() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <Suspense fallback={<OwnerDashboardSkeleton />}>
      <OwnerDashboard />
    </Suspense>
  );
}

async function OwnerDashboard() {
  const session = await getSession();
  if (!session) return null;

  const role = getActiveRole(session.user);
  const userId = session.user.id;

  const equipRes = await apiFetch("/api/equipment");
  const equipData = await equipRes.json();

  const bookRes = await apiFetch("/api/bookings");
  const bookData = await bookRes.json();

  const equipment: ApiEquipment[] = (equipData.equipment || []).filter(
    (e: ApiEquipment) => e.ownerId === userId,
  );
  const bookings: ApiBooking[] = (bookData.bookings || []).filter(
    (b: ApiBooking) => b.ownerId === userId,
  );

  const totalEquipment = equipment.length;
  const completedRentals = bookings.filter((b) => b.status === "completed").length;
  const totalEarnings = bookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum: number, b) => sum + (Number(b.amount) || 0), 0);

  const now = new Date();
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const earnings = bookings
      .filter((b) => {
        const d = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear() && b.paymentStatus === "paid";
      })
      .reduce((sum: number, b) => sum + (Number(b.amount) || 0), 0);
    return { month: month.toLocaleString("default", { month: "short" }), earnings };
  }).reverse();

  return (
    <DashboardLayout role={role} userName={session.user.name} userEmail={session.user.email}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Owner Overview</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage your equipment listings, bookings, and earnings.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Listed Equipment"
            value={totalEquipment}
            subtitle="Your active listings"
            icon={Package}
            color="emerald"
            trend={{ value: "+2 this month", positive: true }}
          />
          <StatCard
            title="Completed Rentals"
            value={completedRentals}
            subtitle="Successfully fulfilled"
            icon={Truck}
            color="blue"
            trend={{ value: "+1 this month", positive: true }}
          />
          <StatCard
            title="Total Earnings"
            value={`$${totalEarnings.toLocaleString()}`}
            subtitle="From paid bookings"
            icon={DollarSign}
            color="amber"
            trend={{ value: "+12% this month", positive: true }}
          />
          <StatCard
            title="Active Listings"
            value={totalEquipment}
            subtitle="Currently available"
            icon={Users}
            color="rose"
            trend={{ value: "All available", positive: true }}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Monthly Earnings
          </h2>
          <div className="h-64 w-full">
            <EarningsChart data={monthly} dataKey="earnings" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <a
            href="/owner/add-equipment"
            className="rounded-xl border border-gray-200 bg-white p-6 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
          >
            <ListPlus className="mb-3 h-6 w-6 text-amber-500" aria-hidden />
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Add Equipment</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">List a new item for rent</p>
          </a>
          <a
            href="/owner/my-equipment"
            className="rounded-xl border border-gray-200 bg-white p-6 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
          >
            <Package className="mb-3 h-6 w-6 text-gray-400" aria-hidden />
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">My Equipment</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">View and manage your listings</p>
          </a>
          <a
            href="/owner/my-equipment-rental"
            className="rounded-xl border border-gray-200 bg-white p-6 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
          >
            <Truck className="mb-3 h-6 w-6 text-gray-400" aria-hidden />
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">My Rentals</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Track incoming bookings</p>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}