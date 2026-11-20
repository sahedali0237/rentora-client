"use client";

import { useCallback, useState } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Shared client-side source of truth for the signed-in user.
 *
 * The Better Auth session (`authClient.useSession()`) is the source of truth
 * for name, email, image and roles. This hook adds a single reactive piece of
 * state — a profile image override — so the Navbar and any other component
 * can reflect a newly uploaded profile photo *immediately*, without a hard
 * browser refresh and without keeping a stale private copy.
 *
 * After the profile is saved, `updateUser` is called with the new image URL.
 * It:
 *   1. Persists the URL to the user's profile (PATCH /api/user/profile — the
 *      identity-based endpoint the app already uses for all profile edits).
 *   2. Updates the shared Better Auth user record with `authClient.updateUser`,
 *      so the session cookie cache stays in sync and no later "normal"
 *      refresh can surface the old image.
 *   3. Triggers `authClient.useSession().refetch` with `disableCookieCache`,
 *      which re-reads the user from the database and re-renders every
 *      subscriber (including the Navbar) — all in React state, no reload.
 *   4. Sets the local override as an instant, guaranteed-visual fallback.
 *
 * The override only *fills in* the image; name, email, roles and activeRole
 * always come from the session, so nothing else is duplicated or desynced.
 */

type BetterAuthSessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  phone?: string;
  address?: string;
  roles: string[];
  activeRole: string;
};

/** Merge the session user with a profile image override. */
export function withSessionUserOverride<T extends { image?: string | null }>(
  user: T | null | undefined,
  imageOverride: string,
): T | null | undefined {
  if (!user) return user;
  // Only override when the override is a real URL; otherwise keep the
  // session's existing image (or lack thereof) untouched.
  if (!imageOverride) return user;
  return { ...user, image: imageOverride };
}

/** Shape of the profile the app's `/api/user/profile` endpoint persists. */
export type ProfileUpdate = {
  name?: string;
  phone?: string;
  address?: string;
  /** ImgBB (or any https) image URL, or empty string to clear the photo. */
  image?: string;
};

/**
 * Return the shared signed-in user plus an updater for the profile.
 *
 * `user` reflects the session user, with the profile image overridden the
 * moment `updateUser` resolves — so the Navbar and every other consumer
 * re-render without a page reload.
 */
export function useSessionUser() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const [imageOverride, setImageOverride] = useState("");

  const user = withSessionUserOverride(
    session?.user as unknown as BetterAuthSessionUser | undefined,
    imageOverride,
  );

  const setUserImage = useCallback((url: string) => {
    setImageOverride(url);
  }, []);

  /**
   * Persist a profile change and propagate it to the shared user state.
   * Safe to call for any subset of fields; omitted fields are left untouched.
   */
  const updateUser = useCallback(
    async (
      patch: Partial<ProfileUpdate> & { image?: string },
      base?: BetterAuthSessionUser | null,
    ) => {
      const currentUser = base ?? user;
      const profile: ProfileUpdate = {
        ...(currentUser?.name !== undefined
          ? { name: currentUser.name }
          : {}),
        ...(currentUser?.phone !== undefined
          ? { phone: currentUser.phone }
          : {}),
        ...(currentUser?.address !== undefined
          ? { address: currentUser.address }
          : {}),
        // Only include image when a patch supplies one (or an explicit ""),
        // so callers that update just name/phone/address don't clobber it.
        ...(patch.image !== undefined ? { image: patch.image } : {}),
      };

      // 1. Persist to the database via the app's identity-based profile API.
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          (data && (data as { message?: string }).message) ||
            "Failed to update profile.",
        );
      }

      const newImage =
        patch.image !== undefined ? patch.image : currentUser?.image ?? "";

      // 2. Keep the shared Better Auth user record + session cookie in sync so
      //    a normal refresh can never show the old photo again.
      if (newImage) {
        try {
          await authClient.updateUser({ image: newImage });
        } catch {
          // Non-fatal: the database already holds the URL and the local
          // override + refetch below still show the new photo immediately.
        }
      }

      // 3. Reactively re-read the user from the database and refresh the
      //    session atom. disableCookieCache bypasses the session cookie cache
      //    that still carries the previous user.
      try {
        await refetch({ query: { disableCookieCache: true } });
      } catch {
        // Fallback is the local override below.
      }

      // 4. Instant visual update, guaranteed regardless of fetch latency.
      setUserImage(newImage);

      return newImage;
    },
    [user, refetch, setUserImage],
  );

  return { user, isPending, updateUser, setUserImage };
}
