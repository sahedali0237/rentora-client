"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Store,
  ShoppingBag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { getDashboardPath } from "@/lib/roles";

type RoleSwitcherUser = {
  name: string;
  email: string;
  image?: string | null;
  roles: string[];
  activeRole: string;
};

type SwitcherApiResult = {
  success?: boolean;
  error?: string;
  dashboardPath?: string;
};

function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

/**
 * Avatar dropdown in the navbar: shows the current mode as a badge and
 * lets a user switch between Renter and Owner modes (Fiverr-style).
 * Admin accounts get no switch options at all.
 */
export default function RoleSwitcher({ user }: { user: RoleSwitcherUser }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const isAdmin = user.roles.includes("admin");
  const isOwner = user.roles.includes("owner");
  const isRenter = user.roles.includes("renter");
  const activeRole = isAdmin ? "admin" : user.activeRole === "owner" && isOwner ? "owner" : "renter";
  const isAdminActive = activeRole === "admin";
  // Owner-only users keep the owner dashboard without a renter option.
  const canChooseOwner = !isAdminActive && (!isOwner || activeRole !== "owner");
  const canSwitchToRenter =
    !isAdminActive && isRenter && activeRole !== "renter";

  const badge = isAdminActive
    ? "Admin mode"
    : activeRole === "owner"
      ? "Owner mode"
      : "Renter mode";

  async function refreshSession() {
    // Bypass the session cookie cache so the fresh activeRole shows up
    // immediately without re-login.
    await authClient.getSession({ query: { disableCookieCache: true } });
  }

  async function request(
    url: string,
    body?: Record<string, string>,
  ): Promise<SwitcherApiResult> {
    const response = await fetch(url, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    let data: SwitcherApiResult = {};
    try {
      data = (await response.json()) as SwitcherApiResult;
    } catch {
      // Fall through to the generic error below.
    }
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Something went wrong. Please try again.");
    }
    return data;
  }

  async function becomeOwner() {
    setPending(true);
    try {
      await request("/api/roles/become-owner");
      await refreshSession();
      toast.success("You are now an Owner. Welcome aboard!");
      router.push(getDashboardPath("owner"));
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to become an Owner.",
      );
    } finally {
      setPending(false);
    }
  }

  async function switchRole(target: "owner" | "renter") {
    setPending(true);
    try {
      await request("/api/roles/switch", { role: target });
      await refreshSession();
      toast.success(
        target === "owner" ? "Switched to Owner mode." : "Switched to Renter mode.",
      );
      router.push(getDashboardPath(target));
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to switch role.",
      );
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    setPending(true);
    try {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-sm font-semibold text-gray-900 shadow-sm outline-none transition-transform hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        {initials(user.name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="normal-case">
          <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
            {user.name}
          </span>
          <span className="block truncate text-xs font-normal text-zinc-500 dark:text-zinc-400">
            {user.email}
          </span>
        </DropdownMenuLabel>

        <div className="px-1.5 pb-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            {badge}
          </span>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={pending}
          onClick={() => router.push(getDashboardPath(activeRole))}
        >
          <LayoutDashboard aria-hidden />
          Dashboard
        </DropdownMenuItem>

        {canChooseOwner && (
          <DropdownMenuItem
            disabled={pending}
            onClick={() => (isOwner ? switchRole("owner") : becomeOwner())}
          >
            <Store aria-hidden />
            {isOwner ? "Switch to Owner" : "Become an Owner"}
          </DropdownMenuItem>
        )}

        {canSwitchToRenter && (
          <DropdownMenuItem
            disabled={pending}
            onClick={() => switchRole("renter")}
          >
            <ShoppingBag aria-hidden />
            Switch to Renter
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={pending}
          onClick={signOut}
        >
          <LogOut aria-hidden />
          {pending ? "Signing out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
