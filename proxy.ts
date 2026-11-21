import { NextResponse, type NextRequest } from "next/server";



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
