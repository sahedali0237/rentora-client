"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { ArrowLeft, Trash2 as Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiEquipment } from "@/lib/api-types";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { authClient } from "@/lib/auth-client";

const CATEGORIES = [
  "Construction",
  "Electronics",
  "Photography",
  "Vehicles & Transportation",
  "Agriculture",
  "Event Equipment",
  "Other",
];

const RENTAL_TYPES = ["Daily", "Weekly", "Monthly"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

type EquipmentForm = {
  name: string;
  description: string;
  category: string;
  location: string;
  rentalPrice: string;
  rentalType: string;
  availableQuantity: string;
  condition: string;
  brand?: string;
  model?: string;
  image: string;
  terms: string;
};

export default function EditEquipmentClient() {
  const router = useRouter();
  const { id } = useParams();
  const equipmentId = Array.isArray(id) ? id[0] : id || "";
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user.id ?? null;

  const [equipment, setEquipment] = useState<ApiEquipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [form, setForm] = useState<EquipmentForm>({
    name: "",
    description: "",
    category: CATEGORIES[0],
    location: "",
    rentalPrice: "",
    rentalType: RENTAL_TYPES[0],
    availableQuantity: "1",
    condition: CONDITIONS[0],
    brand: "",
    model: "",
    image: "",
    terms: "",
  });

  useEffect(() => {
    fetchEquipment();
  }, [equipmentId]);

  const fetchEquipment = async () => {
    try {
      const res = await fetch(
        `/api/equipment/${encodeURIComponent(equipmentId)}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = await res.json();
        const eq = data.equipment || data;
        setEquipment(eq);
        setForm({
          name: eq.name || "",
          description: eq.description || "",
          category: eq.category || CATEGORIES[0],
          location: eq.location || "",
          rentalPrice: String(eq.rentalPrice ?? ""),
          rentalType: eq.rentalType || RENTAL_TYPES[0],
          availableQuantity: String(eq.availableQuantity ?? "1"),
          condition: eq.condition || CONDITIONS[0],
          brand: eq.brand || "",
          model: eq.model || "",
          image: eq.img || eq.image || "",
          terms: eq.terms || "",
        });
      } else {
        toast.error("Failed to load equipment.");
      }
    } catch {
      toast.error("Failed to load equipment.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/equipment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: equipmentId,
          name: form.name,
          description: form.description,
          category: form.category,
          location: form.location,
          rentalPrice: form.rentalPrice,
          rentalType: form.rentalType,
          availableQuantity: form.availableQuantity,
          condition: form.condition,
          brand: form.brand,
          model: form.model,
          image: form.image,
          terms: form.terms,
        }),
      });

      if (res.ok) {
        toast.success("Equipment updated successfully!");
        router.push(`/equipment/${equipmentId}`);
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to update equipment.");
      }
    } catch {
      toast.error("Failed to update equipment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/equipment?id=${encodeURIComponent(equipmentId)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        toast.success("Equipment deleted successfully.");
        setDeleteDialogOpen(false);
        router.push("/equipment");
        router.refresh();
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-48 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500 dark:text-zinc-500">Equipment not found.</p>
      </div>
    );
  }

  // Owner check based on user ID only.
  const isOwner =
    !!currentUserId &&
    (equipment.ownerId === currentUserId ||
      equipment.ownerId?.toString() === currentUserId.toString());

  if (!isOwner) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center p-6">
        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
          <ArrowLeft className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Not Authorized
        </h2>
        <p className="text-gray-500 dark:text-zinc-400 mb-6">
          You do not own this equipment listing.
        </p>
        <Button onClick={() => router.push("/equipment")}>
          Back to All Equipment
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Equipment
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-500">
            Update your listing details below.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/equipment/${equipmentId}`)}
          >
            View Listing
          </Button>
          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-destructive dark:border-zinc-700 text-sm font-semibold text-destructive dark:text-red-400 hover:bg-destructive/10 dark:hover:bg-red-900/10 transition-colors"
          >
            <Trash2Icon className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50/70 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Equipment Details
            </h2>
          </div>

          <div className="p-6 divide-y divide-gray-200 dark:divide-zinc-800">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Equipment Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full h-10 px-3.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-10 px-3.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Description *
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
                className="w-full p-3.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Location *
              </label>
              <input
                type="text"
                placeholder="City, State"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
                className="w-full h-10 px-3.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 bg-gray-50/70 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pricing & Availability
            </h2>
          </div>

          <div className="p-6 divide-y divide-gray-200 dark:divide-zinc-800">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Rental Price *
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-medium text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.rentalPrice}
                    onChange={(e) =>
                      setForm({ ...form, rentalPrice: e.target.value })
                    }
                    required
                    className="w-full h-10 pl-8 pr-3.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Rental Type *
                </label>
                <select
                  value={form.rentalType}
                  onChange={(e) =>
                    setForm({ ...form, rentalType: e.target.value })
                  }
                  className="w-full h-10 px-3.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                >
                  {RENTAL_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Available Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.availableQuantity}
                  onChange={(e) =>
                    setForm({ ...form, availableQuantity: e.target.value })
                  }
                  required
                  className="w-full h-10 px-3.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Condition *
                </label>
                <select
                  value={form.condition}
                  onChange={(e) =>
                    setForm({ ...form, condition: e.target.value })
                  }
                  className="w-full h-10 px-3.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 bg-gray-50/70 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Specifications
            </h2>
          </div>

          <div className="p-6 divide-y divide-gray-200 dark:divide-zinc-800">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Brand
                </label>
                <input
                  type="text"
                  placeholder="e.g., Bosch"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Model
                </label>
                <input
                  type="text"
                  placeholder="e.g., 4100XC-10"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 bg-gray-50/70 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Equipment Image
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Image URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full h-10 px-3.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
            </div>
            {form.image && (
              <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700">
                <img
                  src={form.image}
                  alt="Equipment preview"
                  className="h-48 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image: "" })}
                  className="absolute top-2 right-2 rounded-lg bg-red-600/90 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-xs hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 bg-gray-50/70 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Rental Terms
            </h2>
          </div>

          <div className="p-6 space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Terms and Conditions *
            </label>
            <textarea
              rows={3}
              value={form.terms}
              onChange={(e) => setForm({ ...form, terms: e.target.value })}
              required
              className="w-full p-3.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
          </div>
        </div>

        <div className="bg-gray-50/70 px-6 py-4 dark:bg-zinc-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push(`/equipment/${equipmentId}`)}
            className="rounded-lg border border-gray-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-gray-900 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-xs"
          >
            {submitting ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        title="Delete Equipment"
        equipmentName={equipment.name}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
      />
    </div>
  );
}
