"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";

/**
 * Client-side error boundary for the /admin route segment.
 *
 * Catches any unhandled error thrown during Server Component rendering
 * (e.g. "Minified React error #441") and shows the error's digest so the
 * developer can look it up in the Vercel server logs.
 */
export default function AdminErrorBoundary({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[Admin] Render error:", error);
  }, [error]);

  const err = error as { digest?: string; message?: string };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      window.location.href = "/sign-in";
    } catch {
      window.location.href = "/sign-in";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-zinc-950">
      <div className="max-w-md space-y-6 text-center">
        {/* Error icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <AlertTriangle className="h-7 w-7 text-amber-500" />
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            This page couldn't load
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Something went wrong while rendering the admin dashboard.
          </p>
        </div>

        {/* Digest / message panel */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-900/30 dark:bg-amber-900/10">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Error details
          </p>
          {err.digest && (
            <p className="mb-1 font-mono text-sm text-amber-900 dark:text-amber-300">
              Digest: {err.digest}
            </p>
          )}
          {err.message && err.message !== "An unexpected response was received from the server." ? (
            <p className="text-sm text-amber-800 dark:text-amber-400">
              {err.message}
            </p>
          ) : null}
          <p className="text-xs text-amber-600 dark:text-amber-500">
            Search for the digest in your Vercel server logs to find the root
            cause.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-300 dark:hover:bg-zinc-800"
          >
            Go to home
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
