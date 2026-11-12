import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The whole game talks to a separate API, so there is nothing to cache on the Next side.
  // (create-next-app turns cacheComponents on; we keep it off to avoid surprises with client-only code.)
  reactStrictMode: true,
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
