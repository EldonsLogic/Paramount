import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const user = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    return user ? NextResponse.redirect(new URL("/", req.url)) : NextResponse.next();
  }
  if (user) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL("/login", req.url);
  if (pathname !== "/") url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except login/logout APIs, Next internals and static files.
  matcher: ["/((?!api/login|api/logout|_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)"],
};
