import Link from "next/link";

/**
 * Categories a piece of equipment can be listed under. Kept in sync with
 * the add-equipment form's CATEGORIES so the chips always match real data.
 */
const CATEGORIES = [
  "Construction",
  "Photography",
  "Vehicles & Transportation",
  "Agriculture",
  "Electronics",
  "Event Equipment",
];

/**
 * "Browse by category" strip. Each chip deep-links into the equipment
 * listing with that category pre-filtered. Renders as white pills on a
 * light cream panel (dark-mode aware), matching the site's look.
 */
export default function BrowseCategories() {
  return (
    <section
      aria-label="Browse equipment by category"
      className="rounded-2xl bg-[#f5f1ea] dark:bg-zinc-900/40 px-5 py-6 sm:px-6"
    >
      <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
        Browse by category
      </h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {CATEGORIES.map((category) => (
          <Link
            key={category}
            href={`/equipment?category=${encodeURIComponent(category)}`}
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
          >
            {category}
          </Link>
        ))}
      </div>
    </section>
  );
}
