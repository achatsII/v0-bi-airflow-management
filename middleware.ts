import { NextResponse, NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Allow access to API routes, login, and callback pages
  if (pathname.startsWith("/api") || pathname.startsWith("/login") || pathname.startsWith("/callback")) {
    return NextResponse.next();
  }
  
  // Check for access token
  const access = req.cookies.get("access_token");
  if (!access) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
