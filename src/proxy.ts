import { type NextRequest, NextResponse } from "next/server";
import { AccessTokenError } from "@auth0/nextjs-auth0/errors";
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

/**
 * Renew an expired access token here, where the new session cookie can be written.
 *
 * A server component cannot set cookies. When one asks the SDK for a token that has expired,
 * the SDK refreshes it, fails to save the new token set ("Failed to persist the updated token
 * set") and the next request refreshes again with the same refresh token. With refresh-token
 * rotation the second use is refused and the user is signed out. Here the response can carry
 * the cookie, and Next hands it to the page being rendered in the same request.
 *
 * A session whose token cannot be renewed (revoked or lost refresh token) is no longer a
 * session. On a protected page that is a redirect to login, never a normal render
 * (`"reauthenticate"`). Any other failure is thrown, so the caller fails closed (503). On a
 * public page nothing is lost by carrying on: the page asks for the token itself.
 */
async function refreshExpiredToken(
  request: NextRequest,
  response: NextResponse,
  protectedPath: boolean,
): Promise<"ok" | "reauthenticate"> {
  try {
    await auth0.getAccessToken(request, response);
    return "ok";
  } catch (error) {
    if (!protectedPath) return "ok";
    if (error instanceof AccessTokenError) return "reauthenticate";
    throw error;
  }
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/auth/")) {
    // The SDK's own routes: errors here are the SDK's to answer.
    return auth0.middleware(request);
  }

  const protectedPath = isProtectedPath(pathname);
  try {
    const authResponse = await auth0.middleware(request);
    if (!protectedPath) {
      await refreshExpiredToken(request, authResponse, false);
      return authResponse;
    }

    const toLogin = () => {
      const login = new URL("/auth/login", request.nextUrl.origin);
      login.searchParams.set("returnTo", `${pathname}${search}`);
      return NextResponse.redirect(login);
    };
    const session = await auth0.getSession(request);
    if (!session) return toLogin();
    if ((await refreshExpiredToken(request, authResponse, true)) === "reauthenticate") {
      return toLogin();
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
     * Every path except Next's static files and image optimizer, the
     * metadata files, and the public fonts (Auth0 fetches them cross-origin).
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|fonts/).*)",
  ],
};
