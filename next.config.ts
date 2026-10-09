import type { NextConfig } from "next";

/** Auth0 Universal Login loads the font cross-origin; the file name is part of its config. */
const fontHeaders = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
  { key: "Access-Control-Allow-Origin", value: "*" },
];

const nextConfig: NextConfig = {
  images: {
    // Uploaded files live in the private bucket and are read through signed URLs on this host
    // (API plan Q6 = S). User media is rendered `unoptimized` (any https image is allowed), so
    // this entry only matters if an optimized image is ever added.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gradfolio-files-1058577031182.storage.googleapis.com",
      },
    ],
  },
  async headers() {
    return [{ source: "/fonts/:path*", headers: fontHeaders }];
  },
};

export default nextConfig;
