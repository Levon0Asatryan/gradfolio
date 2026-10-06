import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gradfolio",
    short_name: "Gradfolio",
    description: "Student portfolios, backed by evidence.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F8FC",
    theme_color: "#1D4ED8",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/brand/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
