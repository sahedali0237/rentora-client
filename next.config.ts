import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // When the image host blocks Vercel's optimizer (e.g. bhphotovideo.com),
    // the browser receives a 502. Set `unoptimized: true` to skip the
    // optimizer for all remote images. This is the safest option when
    // third-party hosts are involved and their robots.txt or rate limits
    // block the Vercel CDN.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;