import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "admin_session";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
