"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  equipmentId: string;
}

/**
 * Client toggle for adding/removing a favorite on the equipment details page.
 * Requires sign-in; prompts the user to log in when they're not authenticated.
 */
export function FavoriteButton({ equipmentId }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [toggling, setToggling] = useState(false);
  const { data: session } = authClient.useSession();

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      toast.info("Please log in to save favorites.");
      return;
    }

    setToggling(true);
    try {
      if (isFavorited) {
        await fetch(`/api/favorites?equipmentId=${encodeURIComponent(equipmentId)}`, {
          method: "DELETE",
        });
        setIsFavorited(false);
        toast.success("Removed from favorites");
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ equipmentId }),
        });
        if (res.ok) {
          setIsFavorited(true);
          toast.success("Added to favorites");
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || "Failed to add to favorites");
        }
      }
    } catch {
      toast.error("Failed to update favorites");
    } finally {
      setToggling(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={toggling}
      aria-pressed={isFavorited}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors border",
        isFavorited
          ? "border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-900/20 dark:text-red-400"
          : "border-gray-200 bg-white text-gray-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50"
      )}
    >
      <svg
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        className={`h-5 w-5 ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-zinc-400"}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 19l7-7 7 7M5 19l7-7 7 7M4.458 10A10 10 0 0013 1.148c.265-.241.53-.44.784-.612a1 1 0 011.07-.014 10 10 0 011.476 2.547c.097.178.18.367.244.56a1 1 0 00.318.318c.193.064.382.147.56.244a10 10 0 012.547 1.476c.038.034.066.077.014.108a1 1 0 01-.014 1.07c-.172.254-.371.52-.612.784a10 10 0 00-1.148 13c-.241.265-.44.53-.612.784a1 1 0 01-.014 1.07 1 1 0 01-1.07.014 10 10 0 01-2.547 1.476c-.178.097-.367.18-.56.244a1 1 0 00-.318.318c-.064.193-.147.382-.244.56a10 10 0 01-1.476 2.547c-.034-.038-.077-.066-.108-.014a1 1 0 01-1.07-.014 10 10 0 001.476-2.547c.097-.178.18-.367.244-.56a1 1 0 00-.318-.318c-.193-.064-.382-.147-.56-.244a10 10 0 01-2.547-1.476c-.038-.034-.066-.077-.014-.108a1 1 0 01.014-1.07c.172-.254.371-.52.612-.784a10 10 0 001.148-13c.241-.265.44-.53.612-.784a1 1 0 011.07-.014 10 10 0 012.547-1.476c.178-.097.367-.18.56-.244a1 1 0 00-.318-.318c-.064-.193-.147-.382-.244-.56a10 10 0 011.476-2.547c.034-.038.077-.066.108-.014a1 1 0 011.07.014c.265.241.44.53.612.784a10 10 0 001.148 13"
        />
      </svg>
      {isFavorited ? "Favorited" : "Save to Favorites"}
    </button>
  );
}
