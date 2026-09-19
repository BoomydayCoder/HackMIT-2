import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/match", destination: "/deck", permanent: true }];
  },
};

export default nextConfig;
