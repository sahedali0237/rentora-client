"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  MapPin,
  ChevronRight,
  Trash2 as Trash2Icon,
} from "lucide-react";
import { toast } from "react-toastify";
import { getSession } from "@/lib/session";
import { apiFetch } from "@/lib/api-fetch";
import { ApiEquipment, ApiReview, ApiReviewStats } from "@/lib/api-types";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ReviewList } from "@/components/reviews";

type DetailsData = {
  equipment: ApiEquipment;
  reviews: ApiReview[];
  stats: ApiReviewStats;
  currentUserId: string | null;
  isOwner: boolean;
  userHasRented: boolean;
};

export const revalidate = 0;

export default async function EquipmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const currentUserId = session?.user.id ?? null;

  // Fetch equipment + reviews in parallel
  const [equipRes, reviewsRes] = await Promise.all([
    apiFetch(`/api/equipment/${encodeURIComponent(id)}`),
    apiFetch(`/api/reviews?equipmentId=${encodeURIComponent(id)}`),
  ]);

  let equipment: ApiEquipment | null = null;
  let reviews: ApiReview[] = [];
  let stats: ApiReviewStats = { averageRating: 0, totalReviews: 0 };

  if (equipRes.ok) {
    const data = await equipRes.json();
    equipment = data.equipment || data;
  }

  if (reviewsRes.ok) {
    const data = await reviewsRes.json();
    reviews = data.reviews || [];
    stats = data.stats || { averageRating: 0, totalReviews: 0 };
  }

  if (!equipment) {
    notFound();
  }

  // Only approved equipment is viewable by the public.
  const status = equipment.status || "pending";
  if (status !== "approved") {
    notFound();
  }

  // Determine ownership based strictly on user ID.
  const isOwner =
    !!currentUserId &&
    (equipment.ownerId === currentUserId ||
      equipment.ownerId?.toString() === currentUserId.toString());

  // Determine if current user has rented this equipment (for review eligibility).
  let userHasRented = false;
  if (currentUserId) {
    try {
      const bookingsRes = await apiFetch("/api/bookings");
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        const bookings = bookingsData.bookings || [];
        userHasRented = bookings.some(
          (b: any) =>
            (b.equipmentId || b.name) === id && b.renterId === currentUserId,
        );
      }
    } catch {
      // Fail silently - userHasRented stays false
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-zinc-400 mb-6">
        <Link href="/equipment" className="hover:text-amber-600 dark:hover:text-amber-400">
          All Equipment
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 dark:text-white font-medium">
          {equipment.name}
        </span>
      </nav>

      <div className="lg:grid lg:grid-cols-12 gap-8">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative h-[400px] rounded-2xl border border-gray-200 bg-gray-100 dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            {equipment.img || equipment.image ? (
              <Image
                fill
                src={equipment.img || equipment.image || ""}
                alt={equipment.name || "Equipment"}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 75vw"
                priority
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400 dark:text-zinc-500 font-medium">
                No Image Available
              </div>
            )}
            <div className="absolute top-4 left-4 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur text-xs font-semibold text-amber-800 dark:text-amber-400 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Available
              </span>
            </div>
          </div>
        </div>

        {/* Right: Equipment Information */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-semibold">
              {equipment.category || "General"}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              {equipment.name}
            </h1>

            <div className="flex items-center gap-3">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.averageRating ? Number(stats.averageRating).toFixed(1) : "0.0"}
              </span>
              <span className="text-sm text-gray-500 dark:text-zinc-500">
                ({stats.totalReviews || 0} reviews)
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
              <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-sm text-gray-700 dark:text-zinc-300">
                {equipment.location || "Location not specified"}
              </p>
            </div>

            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-500 uppercase font-semibold tracking-wider">
                  Rental Price
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${Number(equipment.rentalPrice || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-500">
                  / {equipment.rentalType || "day"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-zinc-500 uppercase font-semibold tracking-wider">
                  Availability
                </p>
                <p className={`font-semibold ${
                  Number(equipment.availableQuantity || 0) > 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                  {equipment.availableQuantity || 0} available
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {isOwner ? (
              <>
                <Link
                  href={`/owner/edit-equipment/${id}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  Edit Equipment
                </Link>
                <DeleteButton
                  equipmentId={id}
                  equipmentName={equipment.name || "this equipment"}
                />
              </>
            ) : (
              <>
                <RentNowButton
                  equipment={equipment}
                  currentUserId={currentUserId}
                  isLoggedIn={!!currentUserId}
                />
                <Link
                  href="#reviews"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  View Reviews
                </Link>
              </>
            )}
          </div>

          {/* Owner notice when viewing own listing */}
          {isOwner && (
            <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                You own this listing. You can edit or delete it above.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Description
        </h2>
        <p className="text-gray-700 dark:text-zinc-300 leading-relaxed">
          {equipment.description || "No description available."}
        </p>
      </section>

      {/* Specifications */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Specifications
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SpecItem label="Brand" value={equipment.brand || "Not specified"} />
          <SpecItem label="Model" value={equipment.model || "Not specified"} />
          <SpecItem label="Condition" value={equipment.condition || "Not specified"} />
          <SpecItem
            label="Available Quantity"
            value={String(equipment.availableQuantity || 0)}
          />
          <SpecItem label="Rental Type" value={equipment.rentalType || "Daily"} />
          <SpecItem label="Category" value={equipment.category || "General"} />
          <SpecItem label="Location" value={equipment.location || "Not specified"} />
          <SpecItem label="Status" value={equipment.status || "pending"} />
        </div>
      </section>

      {/* Rental Terms */}
      {equipment.terms && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Rental Terms
          </h2>
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <p className="text-gray-700 dark:text-zinc-300 leading-relaxed">
              {equipment.terms}
            </p>
          </div>
        </section>
      )}

      {/* Owner Information */}
      <section className="mt-10">
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-zinc-800 flex items-center justify-center text-amber-800 dark:text-amber-400 font-semibold">
            {(equipment.ownerName || "O").charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {equipment.ownerName || "Equipment Owner"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-zinc-500">
              Listing owner
            </p>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Customer Reviews
        </h2>
        <ReviewList
          equipmentId={id}
          currentUserId={currentUserId}
          initialReviews={reviews}
          initialStats={stats}
          canSubmit={!!currentUserId}
          userHasRented={userHasRented}
          onReviewSubmitted={() => {
            toast.success("Thanks for your review!");
          }}
        />
      </section>
    </div>
  );
}

function SpecItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-gray-700 dark:text-zinc-300">{value}</span>
    </div>
  );
}

function RentNowButton({
  equipment,
  currentUserId,
  isLoggedIn,
}: {
  equipment: ApiEquipment;
  currentUserId: string | null;
  isLoggedIn: boolean;
}) {
  const isInStock = Number(equipment.availableQuantity || 0) > 0;

  return (
    <a
      href={`/rent/${equipment._id || equipment.id}`}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
        isInStock
          ? "bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-600/20"
          : "bg-gray-400 dark:bg-zinc-600 text-gray-900 dark:text-gray-900 cursor-not-allowed"
      }`}
    >
      {isInStock ? (
        <>
          Rent Now <ChevronRight className="h-4 w-4" />
        </>
      ) : (
        "Out of Stock"
      )}
    </a>
  );
}

function DeleteButton({
  equipmentId,
  equipmentName,
}: {
  equipmentId: string;
  equipmentName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/equipment?id=${encodeURIComponent(equipmentId)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        toast.success("Equipment deleted successfully.");
        setIsOpen(false);
        window.location.href = "/equipment";
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to delete equipment.");
        setDeleting(false);
      }
    } catch {
      toast.error("Failed to delete equipment.");
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-destructive dark:border-zinc-700 text-sm font-semibold text-destructive dark:text-red-400 hover:bg-destructive/10 dark:hover:bg-red-900/10 transition-colors"
      >
        <Trash2Icon className="h-4 w-4" /> Delete
      </button>
      <ConfirmDialog
        isOpen={isOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsOpen(false)}
        title="Delete Equipment"
        equipmentName={equipmentName}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
      />
    </>
  );
}
