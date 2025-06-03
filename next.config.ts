import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: this allows production builds to complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Removed experimental.dynamicIO as it's only available in canary versions
  // Removed generateStaticParams as it's not a valid config option
  
  // Add other configuration options here if needed
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
