import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname.startsWith("/login") || pathname === "/" || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Protected routes
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/report-download/:path*",
    "/analytics/:path*",
    "/user-crud/:path*",
    "/factory/:path*",
    "/scan-points/:path*",
    "/security-activity/:path*",
    "/security-info/:path*",
  ],
};
