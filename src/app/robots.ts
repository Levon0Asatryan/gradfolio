import type { MetadataRoute } from "next";

/**
 * A hint, not the guarantee: private and protected pages are kept out of an index by the
 * login redirect and by `noindex` in each page's metadata. This only saves crawlers the trip.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/auth/",
        "/api/",
        "/account",
        "/teams",
        "/integrations",
        "/settings",
        "/projects/new",
        "/profile/edit",
      ],
    },
  };
}
