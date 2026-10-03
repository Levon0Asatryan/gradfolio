import Link from "next/link";

/**
 * The element a navigation item renders as.
 *
 * `/auth/*` routes are handled by the Auth0 SDK and redirect to Auth0's own
 * domain. A Next `<Link>` fetches its target client-side (`?_rsc=`), and the
 * browser then follows that redirect as a cross-origin fetch, which Auth0
 * rejects (CORS). Those routes must be full page navigations: a plain `<a>`.
 */
export function navLinkComponent(href: string): typeof Link | "a" {
  return href.startsWith("/auth/") ? "a" : Link;
}
