import { type NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";



export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public paths that do not require authentication
  const publicPaths = ["/search", "/auth", "/api/auth", "/_next", "/favicon.ico"];
  
  // Check if the current path is public
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  if (isPublic) {
    return auth0.middleware(request);
  }

  // Check for session
  const session = await auth0.getSession(request);

  if (!session) {
    // Redirect to search if not authenticated
    return NextResponse.redirect(new URL("/search", request.url));
  }

  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, scripts, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
