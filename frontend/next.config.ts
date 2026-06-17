import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Permanent redirect — /properties and /properties/:id → /assets and /assets/:id
      { source: '/properties',    destination: '/assets',    permanent: true },
      { source: '/properties/:id', destination: '/assets/:id', permanent: true },
    ];
  },
};

export default nextConfig;
