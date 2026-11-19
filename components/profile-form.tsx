"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Camera,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { toast } from "react-toastify";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ProfileFormProps = {
  title?: string;
  description?: string;
  initialName: string;
  initialEmail: string;
  initialPhone?: string;
  initialAddress?: string;
  initialImage?: string | null;
  initialRole?: string | null;
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  const letters = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return letters || "U";
}

function ProfileAvatar({
  image,
  name,
  circleClassName,
  fallbackClassName,
}: {
  image?: string;
  name: string;
  circleClassName: string;
  fallbackClassName?: string;
}) {
  const initials = initialsOf(name);
  const avatarClassName = `relative flex items-center justify-center overflow-hidden ${circleClassName}`;

  return (
    <div className={avatarClassName}>
      {image ? (
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="112px"
        />
      ) : (
        <span className={fallbackClassName}>{initials}</span>
      )}
    </div>
  );
}

export function ProfileForm({
  title = "My Profile",
  description = "Manage your personal information and account settings.",
  initialName,
  initialEmail,
  initialPhone = "",
  initialAddress = "",
  initialImage = null,
  initialRole = null,
}: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: initialName,
    email: initialEmail,
    phone: initialPhone,
    address: initialAddress,
    image: initialImage ?? "",
  });
  const [imageUrl, setImageUrl] = useState(initialImage ?? "");
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const displayName = formData.name.trim() || "User";
  const activeRole = initialRole ? initialRole.charAt(0).toUpperCase() + initialRole.slice(1) : null;

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    e.target.value = "";

    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("Image size must be less than 2MB.");
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WEBP image.");
      return;
    }

    setUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: uploadFormData,
      });

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        imageUrl?: string;
        error?: string;
      } | null;

      if (!res.ok || !data?.success || !data?.imageUrl) {
        toast.error(data?.error || "Image upload failed. Please try again.");
        return;
      }

      const uploadedImageUrl = data.imageUrl;

      setFormData((prev) => ({
        ...prev,
        image: uploadedImageUrl,
      }));

      setImageUrl(uploadedImageUrl);
      setImageMode("upload");

      toast.success("Profile photo uploaded successfully.");
    } catch {
      toast.error("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleImageUrl = (value: string) => {
    setImageUrl(value);

    setFormData((prev) => ({
      ...prev,
      image: value,
    }));
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: "",
    }));

    setImageUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          image: formData.image,
        }),
      });

      if (res.ok) {
        toast.success("Profile updated successfully.");
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);

        toast.error(data?.message || "Failed to update profile.");
      }
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* PAGE HEADER */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h1>

          <span className="h-2 w-10 rounded-full bg-amber-500" />
        </div>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      {/* PROFILE HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#064e3b] via-[#065f46] to-[#047857] px-6 py-8 shadow-sm sm:px-8">
        {/* Decorative background */}
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-400/10" />
        <div className="absolute -bottom-32 right-20 h-72 w-72 rounded-full border-40px border-emerald-300/5" />

        <div className="relative flex flex-col items-center gap-5 sm:flex-row">
          {/* Avatar */}
          <div className="relative shrink-0">
            <ProfileAvatar
              image={formData.image || undefined}
              name={displayName}
              circleClassName="h-28 w-28 rounded-full border-4 border-white/90 bg-amber-500 shadow-lg"
              fallbackClassName="text-3xl font-bold text-gray-900"
            />

            {/* Camera button */}
            <button
              type="button"
              onClick={() => {
                setImageMode("upload");
                fileInputRef.current?.click();
              }}
              className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#065f46] bg-amber-500 text-white shadow-md transition hover:bg-amber-600"
              aria-label="Change profile photo"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* User information */}
          <div className="min-w-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-2xl font-bold text-white">{displayName}</h2>

              {activeRole ? (
                <span className="inline-flex items-center rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                  {activeRole}
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-emerald-50 sm:justify-start">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{formData.email}</span>
            </div>

            <p className="mt-2 text-sm italic text-emerald-100">
              Welcome to Rentora!
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        {/* PROFILE PHOTO CARD */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <ImageIcon className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Profile Photo
              </h2>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Upload a new profile picture
              </p>
            </div>
          </div>

          {/* Image preview */}
          <div className="mb-5 flex justify-center">
            <div className="relative h-48 w-48 overflow-hidden rounded-2xl border border-gray-200 bg-amber-100 dark:border-zinc-700 dark:bg-zinc-800">
              {formData.image ? (
                <Image
                  src={formData.image}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="192px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-5xl font-bold text-amber-600 dark:text-amber-400">
                  {initialsOf(displayName)}
                </span>
              )}

              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Upload / URL tabs */}
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setImageMode("upload")}
              className={`flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition ${
                imageMode === "upload"
                  ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                  : "bg-white text-gray-500 hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>

            <button
              type="button"
              onClick={() => setImageMode("url")}
              className={`flex items-center justify-center gap-2 border-l border-gray-200 px-3 py-3 text-sm font-medium transition dark:border-zinc-700 ${
                imageMode === "url"
                  ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                  : "bg-white text-gray-500 hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              }`}
            >
              <LinkIcon className="h-4 w-4" />
              Image URL
            </button>
          </div>

          {/* Hidden file input — always mounted so the hero camera button
              works even while the "Image URL" tab is active. */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload */}
          {imageMode === "upload" && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-4 py-7 text-center transition hover:border-amber-400 hover:bg-amber-50/50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-700 dark:hover:border-amber-500 dark:hover:bg-amber-500/5"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mb-2 h-7 w-7 animate-spin text-amber-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Uploading...
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="mb-2 h-7 w-7 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Click to choose a photo
                    </span>
                  </>
                )}

                <span className="mt-1 text-xs text-gray-400">
                  JPG, PNG, WEBP · Maximum 2MB
                </span>
              </button>
            </div>
          )}

          {/* Image URL */}
          {imageMode === "url" && (
            <div className="mt-4 space-y-3">
              <label
                htmlFor="imageUrl"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Profile image URL
              </label>

              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/profile.jpg"
                  value={imageUrl}
                  onChange={(e) => handleImageUrl(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Remove image */}
          {formData.image && (
            <button
              type="button"
              onClick={removeImage}
              className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
            >
              <Trash2 className="h-4 w-4" />
              Remove Photo
            </button>
          )}
        </div>

        {/* PERSONAL INFORMATION CARD */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <User className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Personal Information
              </h2>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Update your personal details
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name + Email */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Full Name */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Full Name
                  <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                    className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email Address
                  <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    readOnly
                    required
                    className="h-11 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 pl-10 pr-3 text-sm text-gray-500 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Phone + Address */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Phone */}
              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Phone Number
                  <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label
                  htmlFor="address"
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Address
                  <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

                  <textarea
                    id="address"
                    rows={3}
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    className="min-h-11 w-full resize-none rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Save */}
            <button
              type="submit"
              disabled={saving}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 text-sm font-bold text-gray-950 shadow-sm transition hover:bg-amber-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-5 w-5" />

              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
