import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  if (!token) {
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
    await jwtVerify(token, secret);
    
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
    "/api/subscriptions/:path*",
    "/api/analytics/:path*",
    "/api/settings/:path*",
    "/api/export/:path*",
    "/api/import/:path*",
  ],
};
