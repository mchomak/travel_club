import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  assetPrefix: process.env.NEXT_ASSET_PREFIX || "/_app/interviews",
  async rewrites() {
    return {
      beforeFiles: [{ source: "/_app/interviews/_next/:path*", destination: "/_next/:path*" }],
      afterFiles: [{ source: "/api/:path*", destination: `${process.env.BACKEND_URL ?? "http://127.0.0.1:8000"}/api/:path*` }],
    };
  },
};
export default config;
