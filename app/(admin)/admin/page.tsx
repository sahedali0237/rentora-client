import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/stat-card";
import {
  UsersRound,
  List,
  Truck,
  CreditCard,
  TrendingUp,
  DollarSign,
  Clock,
} from "lucide-react";
import { getSession, getActiveRole } from "@/lib/session";
import { apiFetch } from "@/lib/api-fetch";
import type { ApiBooking, ApiEquipment, ApiUser } from "@/lib/api-types";
import { EarningsChart } from "@/components/earnings-chart";

// Cache Components: the signed-in check uses headers()/sessions, so this
// segment must be a blocking route.
export const instant = false;

async function getStats() {
  // Only parse JSON when the API responded successfully. Error responses are
  // always JSON from our API routes, but guarding here prevents a client-side
  // JSON parse error (and a crashed dashboard) if a route ever returns a
  // non-JSON error page while failing/unauthenticated.
  async function readJson(res: Response) {
    if (!res.ok) return {};
    try {
      return (await res.json()) ?? {};
    } catch {
      return {};
    }
  }

  const usersRes = await apiFetch("/api/admin/users");
  const usersData = await readJson(usersRes);

  const equipRes = await apiFetch("/api/equipment");
  const equipData = await readJson(equipRes);

  const bookRes = await apiFetch("/api/bookings");
  const bookData = await readJson(bookRes);

  const users: ApiUser[] = (usersData as { users?: ApiUser[] }).users || [];
  const equipment: ApiEquipment[] = (equipData as { equipment?: ApiEquipment[] }).equipment || [];
  const bookings: ApiBooking[] = (bookData as { bookings?: ApiBooking[] }).bookings || [];

  const totalUsers = users.length;
  const totalEquipment = equipment.length;
  const totalBookings = bookings.length;
  const pendingApprovals = equipment.filter((e) => e.status === "pending").length;
  const completedRentals = bookings.filter((b) => b.status === "completed").length;
  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum: number, b) => sum + (Number(b.amount) || 0), 0);

  const now = new Date();
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const count = bookings.filter((b) => {
      const d = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
    }).length;
    return { month: month.toLocaleString("default", { month: "short" }), bookings: count };
  }).reverse();

  return {
    totalUsers,
    totalEquipment,
    totalBookings,
    pendingApprovals,
    completedRentals,
    totalRevenue,
    monthly,
  };
}

function AdminDashboardSkeleton() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminDashboard />
    </Suspense>
  );
}

async function AdminDashboard() {
  const session = await getSession();
  if (!session) return null;

  const role = getActiveRole(session.user);
  const stats = await getStats();

  return (
    <DashboardLayout role={role} userName={session.user.name} userEmail={session.user.email}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Overview</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage users, equipment, and rentals across the platform.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            subtitle="Registered accounts"
            icon={UsersRound}
            color="blue"
            trend={{ value: "+12% this month", positive: true }}
          />
          <StatCard
            title="Total Equipment"
            value={stats.totalEquipment}
            subtitle="Listed on platform"
            icon={List}
            color="emerald"
            trend={{ value: "+8% this month", positive: true }}
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            subtitle="Equipment awaiting review"
            icon={Clock}
            color="amber"
            trend={{ value: "-5% since last week", positive: true }}
          />
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            subtitle="From completed rentals"
            icon={DollarSign}
            color="rose"
            trend={{ value: "+18% this month", positive: true }}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Monthly Booking Statistics
          </h2>
          <div className="h-64 w-full">
            <EarningsChart data={stats.monthly} dataKey="bookings" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <a
            href="/admin/all-users"
            className="rounded-xl border border-gray-200 bg-white p-6 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
          >
            <UsersRound className="mb-3 h-6 w-6 text-gray-400" aria-hidden />
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">All Users</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Manage accounts and roles</p>
          </a>
          <a
            href="/admin/all-equipment"
            className="rounded-xl border border-gray-200 bg-white p-6 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
          >
            <List className="mb-3 h-6 w-6 text-gray-400" aria-hidden />
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">All Equipment</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Approve, reject, or remove listings</p>
          </a>
          <a
            href="/admin/all-rentals"
            className="rounded-xl border border-gray-200 bg-white p-6 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
          >
            <Truck className="mb-3 h-6 w-6 text-gray-400" aria-hidden />
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">All Rentals</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Monitor all rental activity</p>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}