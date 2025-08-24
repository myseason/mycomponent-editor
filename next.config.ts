import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zecpybnrexatyvqqsghb.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_CMS_API_URL}/:path*`,
      },
      {
        source: "/bundle/api/:path*",
        destination: `/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
