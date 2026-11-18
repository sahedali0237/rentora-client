import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic, cookie-presence-only gate (Next.js 16 uses proxy.ts; the old
 * middleware.ts name is deprecated). It only bounces *signed-out* visitors
 * away from protected areas to avoid a login round-trip for the common case.
 *
 * Real authorization still happens on the server: every dashboard layout
 * calls requireRole(), and route handlers re-validate the session.
 *
 * Note: this intentionally does NOT redirect signed-in users away from
 * /sign-in or /sign-up. A stale session cookie would cause an infinite
 * proxy <-> requireUser redirect loop; that check lives in the (auth)
 * layout with a real session lookup instead.
 */

const PROTECTED_PREFIXES = ["/renter", "/owner", "/admin", "/dashboard"];

/** Better Auth session cookie names (plain + __Secure- variant). */
const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => request.cookies.has(name));
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSessionCookie(request)) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/renter/:path*",
    "/owner/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
  ],
};
