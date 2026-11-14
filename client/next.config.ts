import type { NextConfig } from "next";

const apiBase = process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "");

// Crop images are served by the website API as absolute URLs. Keep the image
// allow-list derived from the same env var, but never fail the build when the
// variable is missing (for example during a local typecheck).
const remotePatterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [];
if (apiBase) {
  try {
    const url = new URL(apiBase);
    remotePatterns.push({
      protocol: url.protocol === "https:" ? "https" : "http",
      hostname: url.hostname,
      port: url.port || undefined,
      pathname: "/static/**",
    });
  } catch {
    // An invalid value is reported at runtime by the API helper; do not break the build.
  }
}

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
  ...(remotePatterns.length > 0 ? { images: { remotePatterns } } : {}),
};

export default nextConfig;
