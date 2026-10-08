import type { NextConfig } from "next";

/** Auth0 Universal Login loads the font cross-origin; the file name is part of its config. */
const fontHeaders = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
  { key: "Access-Control-Allow-Origin", value: "*" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [{ source: "/fonts/:path*", headers: fontHeaders }];
  },
};

export default nextConfig;
