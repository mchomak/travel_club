import { NextRequest, NextResponse } from "next/server";
import { AUTH_RETURN_TO_HEADER } from "./lib/return-target";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(AUTH_RETURN_TO_HEADER, `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/home/:path*", "/admin/trips/:path*", "/admin/account/:path*", "/research/:path*"],
};
