"use client";

import * as React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  UsersRound,
  List,
  CreditCard,
  Star,
  Truck,
  ListPlus,
  Package,
  BarChart3,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { getDashboardPath, type Role } from "@/lib/roles";
import { toast } from "react-toastify";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
};

const ADMIN_NAV: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, roles: ["admin"] },
  { label: "All Users", href: "/admin/all-users", icon: UsersRound, roles: ["admin"] },
  { label: "All Equipment", href: "/admin/all-equipment", icon: List, roles: ["admin"] },
  { label: "All Rentals", href: "/admin/all-rentals", icon: Truck, roles: ["admin"] },
  { label: "My Profile", href: "/admin/profile", icon: User, roles: ["admin"] },
];

const OWNER_NAV: NavItem[] = [
  { label: "Overview", href: "/owner", icon: LayoutDashboard, roles: ["owner"] },
  {
    label: "Add Equipment",
    href: "/owner/add-equipment",
    icon: ListPlus,
    roles: ["owner"],
  },
  {
    label: "My Equipment",
    href: "/owner/my-equipment",
    icon: Package,
    roles: ["owner"],
  },
  {
    label: "My Rentals",
    href: "/owner/my-equipment-rental",
    icon: Truck,
    roles: ["owner"],
  },
  { label: "My Profile", href: "/owner/profile", icon: User, roles: ["owner"] },
];

const RENTER_NAV: NavItem[] = [
  { label: "Overview", href: "/renter", icon: LayoutDashboard, roles: ["renter"] },
  { label: "My Rentals", href: "/renter/my-rentals", icon: CreditCard, roles: ["renter"] },
  { label: "Favorites", href: "/renter/favorites", icon: Star, roles: ["renter"] },
  { label: "Profile", href: "/renter/profile", icon: User, roles: ["renter"] },
];

function navForRole(role: Role): NavItem[] {
  if (role === "admin") return ADMIN_NAV;
  if (role === "owner") return OWNER_NAV;
  return RENTER_NAV;
}

type DashboardLayoutProps = {
  children: React.ReactNode;
  role: Role;
  userName: string;
  userEmail: string;
};

export function DashboardLayout({
  children,
  role,
  userName,
  userEmail,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const items = navForRole(role);
  const activeItem = items.find((i) => pathname === i.href) || items[0];

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-zinc-800">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-amber-500">Rentora</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              aria-label="Close sidebar"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
            <div className="px-3 py-2 mb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Account
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {userName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {userEmail}
              </p>
              <p className="mt-1 text-xs text-amber-500 font-medium capitalize">
                {role} mode
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <LogOut className="h-5 w-5" aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile top bar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 lg:hidden z-40">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            aria-label="Open menu"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white hidden sm:block">
              {role} Dashboard
            </span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Mobile sidebar drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-xs bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-xl transform transition-transform duration-300 translate-x-full sm:translate-x-0">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              >
                <Xmark className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <LogOut className="h-5 w-5" aria-hidden />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Xmark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}