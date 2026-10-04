import { type NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { isProtectedPath } from "@/lib/auth/routePolicy";

/**
 * Runs before every page (Next 16 `proxy`, formerly `middleware`).
 *
 * - The Auth0 SDK mounts `/auth/*` and rolls the session cookie.
 * - A protected page without a session redirects to login, then back here.
 * - **Fails closed** (tracker 2.11): if the session cannot be checked, a
 *   protected page answers 503 instead of being served. Public pages still
 *   render (they need no session), and the error is logged either way.
 */
/** en / ru / am, one per line. */
const UNAVAILABLE_MESSAGE = [
  "Sign-in is temporarily unavailable. Please try again.",
  "Вход временно недоступен. Попробуйте ещё раз.",
  "Մուտքը ժամանակավորապես անհասանելի է։ Խնդրում ենք կրկին փորձել։",
].join("\n");

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/auth/")) {
    // The SDK's own routes: errors here are the SDK's to answer.
    return auth0.middleware(request);
  }

  const protectedPath = isProtectedPath(pathname);
  try {
    const authResponse = await auth0.middleware(request);
    if (!protectedPath) return authResponse;

    const session = await auth0.getSession(request);
    if (!session) {
      const login = new URL("/auth/login", request.nextUrl.origin);
      login.searchParams.set("returnTo", `${pathname}${search}`);
      return NextResponse.redirect(login);
    }
    return authResponse;
  } catch (error) {
    console.error("proxy: session check failed", {
      path: pathname,
      error: error instanceof Error ? error.name : typeof error,
    });
    if (!protectedPath) return NextResponse.next();
    // The proxy cannot see the chosen language (it lives in the browser), so
    // the message comes in all three.
    return new NextResponse(UNAVAILABLE_MESSAGE, {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "retry-after": "30" },
    });
  }
}

export const config = {
  matcher: [
    /*
     * Every path except Next's static files and image optimizer, and the
     * metadata files.
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
