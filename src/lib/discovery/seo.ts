import type { Metadata } from "next";

/**
 * Open Graph for a discovery page. A page's own `openGraph` replaces the layout's whole
 * object, and with it the root `opengraph-image.png`: a shared link would have no picture.
 * So the image is named here again.
 */
export function pageOpenGraph(values: {
  title: string;
  description: string;
  url: string;
}): NonNullable<Metadata["openGraph"]> {
  return {
    ...values,
    type: "website",
    siteName: "Gradfolio",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
  };
}
