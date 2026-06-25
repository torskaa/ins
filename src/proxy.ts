import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/login", "/register", "/api/auth"]

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname === "/") {
    return NextResponse.next()
  }

  // In development, allow all paths but still check for static assets
  if (process.env.NODE_ENV === "development" && pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  const hasSession = req.cookies.has("next-auth.session-token")
    || req.cookies.has("__Secure-next-auth.session-token")
    || req.cookies.has("authjs.session-token")
    || req.cookies.has("__Secure-authjs.session-token")

  if (!hasSession) {
    const url = new URL("/login", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
