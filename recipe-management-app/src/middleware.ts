// export { auth as middleware } from "@/app/api/auth/[...nextauth]/auth";

import { NextResponse } from "next/server";
import { auth } from "./app/api/auth/[...nextauth]/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const protectedPaths = ["/settings", "/dashboard", "/groceries", "/menu"];

  const publicPaths = ["/privacy", "/recipes"];

  // Check public paths first
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // If it's a public path, allow access immediately
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Then check protected paths
  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // Only redirect to login if it's a protected path and user isn't logged in
  if (isProtectedPath && !isLoggedIn) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

// Optionally, you can set a matcher to only run the middleware on specific paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
