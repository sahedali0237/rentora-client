"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { authClient } from "@/lib/auth-client";

export function SocialLoginButtons() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(provider);
    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: window.location.origin,
      });
      if (error) {
        toast.error(error.message || "Sign in failed.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  const buttonClass =
    "flex items-center justify-center py-2 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => handleOAuth("google")}
        disabled={loading === "google"}
        className={buttonClass}
      >
        {loading === "google" ? "Signing in..." : "Google"}
      </button>
      <button
        type="button"
        onClick={() => handleOAuth("github")}
        disabled={loading === "github"}
        className={buttonClass}
      >
        {loading === "github" ? "Signing in..." : "GitHub"}
      </button>
    </div>
  );
}
