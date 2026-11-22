import { headers } from "next/headers";
import { cache } from "react";

/**
 * Resolve a same-origin path (e.g. "/api/bookings") to an absolute URL.
 * Server-side `fetch` requires an absolute URL, so the current request's
 * host/protocol headers are used as the base.
 */
function toAbsoluteUrl(input: string, requestHeaders: Headers): string {
  if (!input.startsWith("/")) return input;

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) {
    const fallbackBase =
      process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL;
    if (!fallbackBase) {
      throw new Error(
        `Cannot resolve relative URL "${input}" without a request host. Set NEXT_PUBLIC_APP_URL.`,
      );
    }
    return new URL(input, fallbackBase).toString();
  }

  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  return new URL(input, `${proto}://${host}`).toString();
}

/**
 * Fetch from a same-origin Next.js API route, forwarding the incoming
 * request's cookies so server-side auth checks (BetterAuth sessions)
 * work correctly.
 *
 * The result is cached with React's `cache()`, so within one request each
 * unique URL is fetched at most once. Note that a 404 response is a valid,
 * cacheable value: if two server components fetch the same 404 URL in one
 * request, the second call receives the cached 404 instead of a fresh
 * error — so callers must handle `!res.ok` without throwing.
 */
export const apiFetch = cache(async (
  input: string,
  init?: RequestInit,
): Promise<Response> => {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie") ?? undefined;

  return fetch(toAbsoluteUrl(input, requestHeaders), {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    cache: "no-store",
  });
});
