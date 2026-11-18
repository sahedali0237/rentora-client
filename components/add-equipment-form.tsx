"use client";

import { useState } from "react";
import { toast } from "react-toastify";

type EquipmentForm = {
  name: string;
  description: string;
  category: string;
  location: string;
  rentalPrice: string;
  rentalType: string;
  availableQuantity: string;
  condition: string;
  brand: string;
  model: string;
  image: string;
  terms: string;
};

const CATEGORIES = [
  "Construction",
  "Photography",
  "Vehicles & Transportation",
  "Agriculture",
  "Electronics",
  "Event Equipment",
];

const RENTAL_TYPES = ["Daily", "Weekly", "Monthly"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

const EMPTY_FORM: EquipmentForm = {
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
};

export function AddEquipmentForm() {
  const [form, setForm] = useState<EquipmentForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          rentalPrice: Number(form.rentalPrice) || 0,
          availableQuantity: Number(form.availableQuantity) || 1,
          status: "pending",
        }),
      });
      if (res.ok) {
        toast.success("Equipment listed successfully! It will be reviewed by an admin.");
        setForm(EMPTY_FORM);
      } else {
        toast.error("Failed to list equipment. Please try again.");
      }
    } catch {
      toast.error("Failed to list equipment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Equipment</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          List your gear for rent. An admin will review and approve it before it goes live.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Equipment Name</label>
              <input
                type="text"
                className="h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-amber-500 transition-colors"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
              <select
                className="h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-amber-500 transition-colors"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              rows={4}
              className="h-32 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-amber-500 transition-colors"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
              <input
                type="text"
                className="h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-amber-500 transition-colors"
                placeholder="City, State"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rental Price</label>
              <div className="flex items-end gap-2">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  className="h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-amber-500 transition-colors"
                  value={form.rentalPrice}
                  onChange={(e) => setForm({ ...form, rentalPrice: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rental Type</label>
              <select
                className="h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-amber-500 transition-colors"
                value={form.rentalType}
                onChange={(e) => setForm({ ...form, rentalType: e.target.value })}
              >
                {RENTAL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Quantity</label>
              <input
                type="number"
                className="h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-amber-500 transition-colors"
                value={form.availableQuantity}
                onChange={(e) => setForm({ ...form, availableQuantity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Condition</label>
              <select
                className="h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-amber-500 transition-colors"
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand</label>
              <input
                type="text"
                className="h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-amber-500 transition-colors"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Model</label>
            <input
              type="text"
              className="h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-amber-500 transition-colors"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Image URL (imgbb or direct link)</label>
            <input
              type="url"
              className="h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-amber-500 transition-colors"
              placeholder="https://example.com/image.jpg"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rental Terms and Conditions</label>
            <textarea
              rows={4}
              className="h-32 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-amber-500 transition-colors"
              value={form.terms}
              onChange={(e) => setForm({ ...form, terms: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-6 rounded-md bg-amber-500 text-gray-900 font-semibold hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors active:scale-95 shadow-sm"
          >
            {submitting ? "Listing Equipment..." : "List Equipment for Rent"}
          </button>
        </form>
      </div>
    </div>
  );
}
