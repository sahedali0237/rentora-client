"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiEquipment } from "@/lib/api-types";

export interface EquipmentCardProps {
  equipment: ApiEquipment;
  isOwner?: boolean;
  userId?: string | null;
}

export function EquipmentCard({
  equipment,
  isOwner = false,
  userId = null,
}: EquipmentCardProps) {
  const id = equipment._id || equipment.id || "";
  const image = equipment.img || equipment.image || "";
  const name = equipment.name || "Untitled Equipment";
  const category = equipment.category || "General";
  const description = equipment.description || "";
  const location = equipment.location || "Location not specified";
  const price = Number(equipment.rentalPrice || 0);
  const rentalType = equipment.rentalType || "Daily";
  const availableQuantity = Number(equipment.availableQuantity || 0);
  const condition = equipment.condition || "Not specified";
  const rating = Number(equipment.rating || 0);
  const reviewCount = Number(equipment.reviewCount || 0);
  const status = equipment.status || "pending";

  const isApproved = status.toLowerCase() === "approved";
  const isInStock = availableQuantity > 0;
  const statusLabel =
    status.toLowerCase() === "approved"
      ? "Approved"
      : status.toLowerCase() === "rejected"
        ? "Rejected"
        : "Pending Approval";
  const statusVariant =
    status.toLowerCase() === "approved"
      ? ("success" as const)
      : status.toLowerCase() === "rejected"
        ? ("destructive" as const)
        : ("warning" as const);
  const [isFavorited, setIsFavorited] = useState(false);
  const { data: session } = authClient.useSession();

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      toast.info("Please log in to save favorites.");
      return;
    }

    try {
      setIsFavorited((prev) => !prev);

      if (isFavorited) {
        // Remove from favorites
        await fetch(`/api/favorites?equipmentId=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        toast.success("Removed from favorites");
      } else {
        // Add to favorites
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ equipmentId: id }),
        });
        if (res.ok) {
          toast.success("Added to favorites");
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || "Failed to add to favorites");
          setIsFavorited(false);
        }
      }
    } catch {
      toast.error("Failed to update favorites");
      setIsFavorited(false);
    }
  };

  return (
    <Link href={`/equipment/${id}`} className="block group">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Image Section */}
        <div className="relative h-64 overflow-hidden">
          {image ? (
            <Image
              fill
              src={image}
              alt={name}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={false}
            />
          ) : (
            <div className="h-full w-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-gray-400 dark:text-zinc-500 text-sm font-medium">
                No Image
              </span>
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="success" className="text-xs font-semibold shadow-sm">
              <span>{category}</span>
            </Badge>
          </div>

          {/* Favorite / Heart Button */}
          <button
            onClick={handleFavorite}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 dark:bg-zinc-800/90 text-gray-700 dark:text-white hover:bg-white transition-all shadow-sm backdrop-blur-sm"
            aria-label="Save to favorites"
          >
            <svg
              className={`h-5 w-5 ${isFavorited ? "text-red-500 fill-red-500" : "text-gray-600"} transition-all`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 19l7-7 7 7M5 19l7-7 7 7M4.458 10A10 10 0 0013 1.148c.265-.241.53-.44.784-.612a1 1 0 011.07-.014 10 10 0 011.476 2.547c.097.178.18.367.244.56a1 1 0 00.318.318c.193.064.382.147.56.244a10 10 0 012.547 1.476c.038.034.066.077.014.108a1 1 0 01-.014 1.07c-.172.254-.371.52-.612.784a10 10 0 00-1.148 13c-.241.265-.44.53-.612.784a1 1 0 01-.014 1.07 1 1 0 01-1.07.014 10 10 0 01-2.547 1.476c-.178.097-.367.18-.56.244a1 1 0 00-.318.318c-.064.193-.147.382-.244.56a10 10 0 01-1.476 2.547c-.034.038-.077.066-.108.014a1 1 0 01-1.07-.014 10 10 0 00-13-1.148c-.265-.241-.44-.53-.612-.784a1 1 0 01.014-1.07 1 1 0 001.07-.014 10 10 0 011.476-2.547c.097-.178.18-.367.244-.56a1 1 0 00-.318-.318c-.193-.064-.382-.147-.56-.244a10 10 0 01-2.547-1.476c-.038-.034-.066-.077-.014-.108a1 1 0 01.014-1.07c.172-.254.371-.52.612-.784a10 10 0 001.148-13c.241-.265.44-.53.612-.784a1 1 0 01.014-1.07 1 1 0 001.07-.014 10 10 0 012.547-1.476c.178-.097.367-.18.56-.244a1 1 0 00.318-.318c.064-.193.147-.382.244-.56a10 10 0 011.476-2.547c.034-.038.077-.066.108-.014a1 1 0 011.07.014c.265.241.44.53.612.784a10 10 0 001.148 13"
              />
            </svg>
          </button>

          {/* Availability Badge */}
          {!isInStock && (
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium shadow-lg">
              <Users className="h-3 w-3" />
              <span>Out of stock</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Name */}
          <h3 className="font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2">
            {name}
          </h3>

          {/* Short description */}
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {description}
            </p>
          )}

          <div className="mt-3 space-y-2">
            {/* Location + Rating */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-zinc-400">
                <MapPin className="h-3 w-3 text-amber-500" />
                <span className="line-clamp-1">{location}</span>
              </div>

              {rating > 0 || reviewCount > 0 ? (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-zinc-500">
                    ({reviewCount})
                  </span>
                </div>
              ) : null}
            </div>

            {/* Price + Rental Type */}
            <div className="flex items-end justify-between gap-2">
              <div>
                <span className="font-bold text-gray-900 dark:text-white">
                  ${price.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 dark:text-zinc-500">
                  / {rentalType}
                </span>
              </div>

              {isOwner ? (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/equipment/${id}`}
                    className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/owner/edit-equipment/${id}`}
                    className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800 text-xs font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              ) : (
                <Button
                  size="sm"
                  disabled={!isApproved || !isInStock}
                  className="w-full px-4 py-2 text-xs font-semibold"
                >
                  {isApproved && isInStock ? (
                    <>
                      Rent Now <span className="ml-1">→</span>
                    </>
                  ) : (
                    <>Unavailable</>
                  )}
                </Button>
              )}
            </div>

            {/* Status + Condition + Availability chips */}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={statusVariant} className="text-xs font-semibold">
                <span className="capitalize">{statusLabel}</span>
              </Badge>
              <Badge variant="outline" className="text-xs">
                <span>{condition}</span>
              </Badge>
              <Badge variant="outline" className="text-xs">
                <span>{availableQuantity} available</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
