import { BarChart3, CalendarCheck, ListPlus, Tags } from "lucide-react";

const features = [
  {
    icon: ListPlus,
    title: "List Equipment",
    description:
      "Add the gear you own with photos, categories, terms and availability.",
  },
  {
    icon: Tags,
    title: "Set Prices",
    description:
      "Choose daily, weekly or monthly rates and update them whenever you like.",
  },
  {
    icon: CalendarCheck,
    title: "Manage Bookings",
    description:
      "Approve requests, track returns and keep your inventory up to date.",
  },
  {
    icon: BarChart3,
    title: "Earnings",
    description:
      "Watch your completed rentals and payouts grow month over month.",
  },
];

export default function OwnerDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-wide text-amber-500">
          Owner Dashboard
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          List Equipment, Set Prices, Manage Bookings, Earnings
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Your owner workspace. Switch back to Renter mode any time from the
          avatar menu to book equipment yourself.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <feature.icon className="h-5 w-5 text-amber-500" aria-hidden />
            <h2 className="mt-3 text-base font-semibold text-gray-900 dark:text-white">
              {feature.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-xs text-zinc-400 dark:text-zinc-500">
        Placeholder dashboard — feature pages are on the way.
      </p>
    </div>
  );
}
