import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/login/brand-ambassador',
        destination: '/profile/setup?role=ambassador',
        permanent: true,
      },
      {
        source: '/login/client',
        destination: '/profile/setup',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
