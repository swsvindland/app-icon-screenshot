import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fine-turtle-643.convex.cloud",
      },
    ],
  },
};

export default nextConfig;
