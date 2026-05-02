import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const isAuthRoute = pathname === "/login" || pathname === "/register"
  const isProtected =
    pathname.startsWith("/overview") ||
    pathname.startsWith("/goals") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/today")

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/today", req.url))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
