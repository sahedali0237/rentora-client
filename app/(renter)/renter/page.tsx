import { ExternalLink, PackageSearch, CreditCard, Star, Truck } from "lucide-react";

const features = [
  {
    icon: PackageSearch,
    title: "Find Equipment",
    description:
      "Browse the marketplace and search for the gear you need by category, price and availability.",
  },
  {
    icon: CreditCard,
    title: "Book & Pay",
    description:
      "Pick your rental period, book the item and pay securely online.",
  },
  {
    icon: Star,
    title: "Review",
    description:
      "Rate owners and leave reviews after each completed rental.",
  },
  {
    icon: Truck,
    title: "Track Rentals",
    description:
      "Follow your active bookings from confirmation to return.",
  },
];

export default function RenterDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-wide text-amber-500">
          Renter Dashboard
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Find Equipment, Book, Pay, Review, Track Rentals
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Everything you need as a renter on Rentora. Switch to Owner mode any
          time from the avatar menu to list your own equipment.
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

      <p className="mt-10 flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
        Placeholder dashboard — feature pages are on the way.
        <ExternalLink className="h-3 w-3" aria-hidden />
      </p>
    </div>
  );
}
