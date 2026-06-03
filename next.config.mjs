/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Serve modern formats from the built-in optimizer; it falls back to the
    // original for browsers that don't accept AVIF/WebP.
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Tree-shake the heavy icon barrels so only the icons we import land in the
    // client bundle instead of the whole set.
    optimizePackageImports: ["hugeicons-react", "lucide-react"],
  },
  compiler: {
    // Strip console.* in production builds, but keep console.error.
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
};

export default nextConfig;
