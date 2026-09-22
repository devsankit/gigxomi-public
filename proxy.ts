import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { verifySessionToken } from "@/lib/auth/token";

const protectedPageRules: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/super-admin", roles: ["SUPER_ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN", "SUPER_ADMIN"] },
  { prefix: "/manager", roles: ["MANAGER", "SUPER_ADMIN"] },
  { prefix: "/sales", roles: ["SALES_AGENT"] },
  { prefix: "/freelancer", roles: ["FREELANCER", "SUPER_ADMIN"] },
  { prefix: "/codedocs", roles: ["SUPER_ADMIN"] },
];

function getMatchingRule(pathname: string) {
  return protectedPageRules.find((rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) ?? null;
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/super-admin/login" || request.nextUrl.pathname === "/sales/login" || request.nextUrl.pathname === "/sales/signup") {
    return NextResponse.next();
  }

  const rule = getMatchingRule(request.nextUrl.pathname);
  if (!rule) {
    return NextResponse.next();
  }

  const session = await verifySessionToken(request.cookies.get("gx_session")?.value ?? null);
  if (!session) {
    const loginUrl = new URL(request.nextUrl.pathname.startsWith("/sales") ? "/sales/login" : "/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!rule.roles.includes(session.role)) {
    const unauthorizedUrl = new URL("/unauthorized", request.url);
    unauthorizedUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(unauthorizedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/super-admin/:path*", "/admin/:path*", "/manager/:path*", "/sales/:path*", "/freelancer/:path*", "/codedocs"],
};
