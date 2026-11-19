"use client";

import Image from "next/image";
import { useState, useRef } from "react";
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
  brand?: string;
  model?: string;
  status?: string;
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

const inputClass =
  "w-full h-10 px-3.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-white dark:placeholder:text-zinc-500 transition-all";

const labelClass =
  "block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export function AddEquipmentForm() {
  const [form, setForm] = useState<EquipmentForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Image upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      return;
    }

    setUploadingImage(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

      if (apiKey) {
        // Upload to ImgBB
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch(
          `https://api.imgbb.com/1/upload?key=${apiKey}`,
          {
            method: "POST",
            body: formData,
          },
        );
        const data = await res.json();

        if (data.success) {
          setForm((prev) => ({ ...prev, image: data.data.display_url }));
          toast.success("Image uploaded successfully!");
        } else {
          throw new Error("ImgBB upload failed");
        }
      } else {
        // Fallback: Convert to Base64 data URL (works locally without an API key)
        const reader = new FileReader();
        reader.onloadend = () => {
          setForm((prev) => ({ ...prev, image: reader.result as string }));
          toast.success("Image attached!");
        };
        reader.readAsDataURL(file);
      }
    } catch {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (formData: EquipmentForm) => {
    setSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/add-equipment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.error || errorBody.message || errorMessage;
        } catch {
          // ignore non-JSON error bodies
        }
        throw new Error(`Server responded with ${response.status}: ${errorMessage}`);
      }

      const data = await response.json();
      console.log("Saved to MongoDB:", data);
      toast.success("Equipment listed successfully!");
    } catch (error) {
      console.error("Failed to add equipment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add equipment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Card Header */}
        <div className="border-b border-gray-200 bg-gray-50/70 px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Add New Equipment
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                List your gear for rent. An admin will review and approve it
                before it goes live.
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-400">
              Pending Approval
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit({
              ...form,
              rentalPrice: form.rentalPrice,
              availableQuantity: form.availableQuantity,
              status: "pending",
            });
          }}
          className="divide-y divide-gray-200 dark:divide-zinc-800"
        >
          {/* Section 1: Basic Information */}
          <div className="p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Basic Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Equipment Name *</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g., Sony A7 IV Mirrorless Camera"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Category *</label>
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Description *</label>
              <textarea
                rows={4}
                className="w-full p-3.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-white dark:placeholder:text-zinc-500 transition-all"
                placeholder="Describe key features, included accessories, and ideal use cases..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Section 2: Pricing & Availability */}
          <div className="p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Pricing &amp; Availability
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Rental Price *</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-medium text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${inputClass} pl-8`}
                    placeholder="0.00"
                    value={form.rentalPrice}
                    onChange={(e) =>
                      setForm({ ...form, rentalPrice: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Rental Type *</label>
                <select
                  className={inputClass}
                  value={form.rentalType}
                  onChange={(e) =>
                    setForm({ ...form, rentalType: e.target.value })
                  }
                >
                  {RENTAL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Available Quantity *</label>
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={form.availableQuantity}
                  onChange={(e) =>
                    setForm({ ...form, availableQuantity: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Location *</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="City, State"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Specifications */}
          <div className="p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Specifications
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Condition *</label>
                <select
                  className={inputClass}
                  value={form.condition}
                  onChange={(e) =>
                    setForm({ ...form, condition: e.target.value })
                  }
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Brand</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g., DeWalt, Sony"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Model</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g., DCD771C2"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Equipment Image */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                Equipment Photo
              </h2>

              <div className="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => setImageMode("upload")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    imageMode === "upload"
                      ? "bg-white text-gray-900 shadow-xs dark:bg-zinc-700 dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-zinc-400"
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode("url")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    imageMode === "url"
                      ? "bg-white text-gray-900 shadow-xs dark:bg-zinc-700 dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-zinc-400"
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {imageMode === "upload" ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />

                {!form.image ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                      dragActive
                        ? "border-amber-500 bg-amber-50/50 dark:bg-amber-500/10"
                        : "border-gray-300 hover:border-amber-400 hover:bg-gray-50 dark:border-zinc-700 dark:hover:border-amber-500/60 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                        <p className="text-sm font-medium text-gray-600 dark:text-zinc-300">
                          Uploading image...
                        </p>
                      </div>
                    ) : (
                      <>
                        <svg
                          className="mb-3 h-10 w-10 text-gray-400 dark:text-zinc-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                          />
                        </svg>
                        <p className="text-sm font-medium text-gray-700 dark:text-zinc-200">
                          Click to upload{" "}
                          <span className="font-normal text-gray-500 dark:text-zinc-400">
                            or drag and drop
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
                          PNG, JPG, or WEBP (max 5MB)
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="relative overflow-hidden h-56 w-full rounded-xl border border-gray-200 dark:border-zinc-700">
                    <Image
                      fill
                      src={form.image}
                      alt="Equipment preview"
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 56vw"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-xs hover:bg-black/85 transition-colors"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="rounded-lg bg-red-600/90 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-xs hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="url"
                  className={inputClass}
                  placeholder="https://i.ibb.co/.../image.jpg"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
                {form.image && (
                  <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700">
                    <Image
                      src={form.image}
                      alt="Equipment preview"
                      className="h-48 w-full object-cover"
                      width={300}
                      height={200}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 5: Terms & Conditions */}
          <div className="p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Rental Terms
            </h2>

            <div>
              <label className={labelClass}>Terms and Conditions *</label>
              <textarea
                rows={3}
                className="w-full p-3.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-white dark:placeholder:text-zinc-500 transition-all"
                placeholder="Specify security deposit, late return fees, pickup/delivery rules, or damage policies..."
                value={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Card Footer / Submit */}
          <div className="bg-gray-50/70 px-6 py-4 dark:bg-zinc-900/50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY_FORM);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-gray-900 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-xs"
            >
              {submitting ? "Listing Equipment..." : "List Equipment for Rent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
