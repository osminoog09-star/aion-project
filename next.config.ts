import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/driver",
        destination: "/aionproject",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
