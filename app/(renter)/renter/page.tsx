import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/stat-card";
import { PackageSearch, CreditCard, Star, Truck, Clock } from "lucide-react";
import { getSession, getActiveRole } from "@/lib/session";
import { apiFetch } from "@/lib/api-fetch";
import type { ApiBooking } from "@/lib/api-types";

export const instant = false;

async function getRenterStats(userId: string) {
  const res = await apiFetch("/api/bookings");
  const data = await res.json();

  void userId;
  const bookings: ApiBooking[] = data.bookings || [];

  const totalRentals = bookings.length;
  const activeRentals = bookings.filter(
    (b) => b.status === "active" || b.status === "pending",
  ).length;
  const completedRentals = bookings.filter(
    (b) => b.status === "completed",
  ).length;
  const totalSpent = bookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum: number, b) => sum + (Number(b.amount) || 0), 0);

  return { totalRentals, activeRentals, completedRentals, totalSpent };
}

export default async function RenterDashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const role = getActiveRole(session.user);
  const stats = await getRenterStats(session.user.id);

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
              Renter Overview
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Browse equipment, track your rentals, and manage your favorites.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Rentals"
            value={stats.totalRentals}
            subtitle="Bookings placed"
            icon={PackageSearch}
            color="blue"
            trend={{ value: "+1 this month", positive: true }}
          />
          <StatCard
            title="Active Rentals"
            value={stats.activeRentals}
            subtitle="Ongoing or pending"
            icon={Truck}
            color="emerald"
            trend={{ value: "Up to date", positive: true }}
          />
          <StatCard
            title="Completed Rentals"
            value={stats.completedRentals}
            subtitle="Successfully finished"
            icon={Star}
            color="rose"
            trend={{ value: "+1 this month", positive: true }}
          />
          <StatCard
            title="Total Spent"
            value={`$${stats.totalSpent.toLocaleString()}`}
            subtitle="On paid rentals"
            icon={CreditCard}
            color="amber"
            trend={{ value: "All payments clear", positive: true }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <a
            href="/renter/my-rentals"
            className="rounded-xl border border-gray-200 bg-white p-6 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
          >
            <CreditCard className="mb-3 h-6 w-6 text-gray-400" aria-hidden />
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
              My Rentals
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Track your active bookings
            </p>
          </a>
          <a
            href="/renter/favorites"
            className="rounded-xl border border-gray-200 bg-white p-6 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
          >
            <Star className="mb-3 h-6 w-6 text-gray-400" aria-hidden />
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
              Favorites
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your saved equipment
            </p>
          </a>
          <a
            href="/renter/profile"
            className="rounded-xl border border-gray-200 bg-white p-6 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
          >
            <Clock className="mb-3 h-6 w-6 text-gray-400" aria-hidden />
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
              Profile
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Update your information
            </p>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
