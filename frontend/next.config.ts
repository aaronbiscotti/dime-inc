import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'play-lh.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
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
