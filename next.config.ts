import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      // Profile photos hosted on ImgBB (uploaded via /api/upload-image).
      { protocol: "https", hostname: "i.ibb.co" },
      // OAuth profile photos (Google).
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Unsplash equipment images.
      { protocol: "https", hostname: "images.unsplash.com" },
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