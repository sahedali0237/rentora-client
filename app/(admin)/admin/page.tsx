import { Ban, LayoutGrid, UsersRound, Wrench } from "lucide-react";

const features = [
  {
    icon: UsersRound,
    title: "Users",
    description: "Review accounts, inspect roles and manage user access.",
  },
  {
    icon: LayoutGrid,
    title: "Listings",
    description: "Approve, reject or remove equipment listed on the platform.",
  },
  {
    icon: Ban,
    title: "Disputes",
    description: "Resolve conflicts between renters and owners.",
  },
  {
    icon: Wrench,
    title: "Platform",
    description: "Configure categories, payments and platform settings.",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-wide text-amber-500">
          Admin Dashboard
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Users, Listings, Disputes, Platform
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Admins have a dedicated role that cannot be switched to or from the
          role switcher.
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
