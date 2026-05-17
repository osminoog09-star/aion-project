import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/apk-manifest.preview.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
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
