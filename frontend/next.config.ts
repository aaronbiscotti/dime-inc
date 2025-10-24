import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/signin/brand-ambassador",
        destination: "/profile/setup?role=ambassador",
        permanent: true,
      },
      {
        source: "/signin/client",
        destination: "/profile/setup",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
