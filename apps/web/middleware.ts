import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/subscriptions",
  "/reminders",
  "/calendar",
  "/settings",
];

const API_PROTECTED = [
  "/api/subscriptions",
  "/api/analytics",
  "/api/settings",
  "/api/export",
  "/api/import",
];

/**
 * Determine which rate limit tier applies for a given API path + method.
 */
function getRateLimitTier(pathname: string, method: string) {
  // Auth endpoints — strictest
  if (pathname.startsWith("/api/auth")) return RATE_LIMITS.AUTH;
  // Cron endpoint
  if (pathname.startsWith("/api/cron")) return RATE_LIMITS.CRON;
  // Export endpoints
  if (pathname.startsWith("/api/export")) return RATE_LIMITS.EXPORT;
  // Write operations
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) return RATE_LIMITS.WRITE;
  // Everything else (GET reads)
  return RATE_LIMITS.READ;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // --- Rate limiting for ALL API routes ---
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const tier = getRateLimitTier(pathname, method);
    // Create a key scoped to IP + route prefix for granular limiting
    const routePrefix = pathname.split("/").slice(0, 3).join("/"); // e.g., /api/auth
    const rateLimitKey = `${ip}:${routePrefix}`;
    const { allowed, remaining, resetAt } = rateLimit(rateLimitKey, tier.limit, tier.windowMs);

    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(tier.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
          },
        }
      );
    }
  }

  // --- Auth protection ---
  const isProtectedPage = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedApi = API_PROTECTED.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get("ss_token")?.value;

  // For API routes, also check Authorization header (mobile app uses Bearer tokens)
  let authToken = token;
  if (!authToken && isProtectedApi) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      authToken = authHeader.slice(7);
    }
  }

  if (!authToken) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isProtectedPage) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
    return NextResponse.next();
  }

  // Token exists, check if they are visiting a guest-only page
  const isGuestPage = pathname === "/" || pathname === "/auth";

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    await jwtVerify(authToken, secret);
    
    if (isGuestPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  } catch {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/auth", request.url));
    response.cookies.delete("ss_token");
    return response;
  }
}

export const config = {
  matcher: [
    "/",
    "/auth",
    "/dashboard/:path*",
    "/subscriptions/:path*",
    "/reminders/:path*",
    "/calendar/:path*",
    "/settings/:path*",
    "/api/:path*",
  ],
};
