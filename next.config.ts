import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: this allows production builds to complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Add other configuration options here if needed
};

export default nextConfig;
