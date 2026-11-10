import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  assetPrefix: "/_app/constructor",
  poweredByHeader: false,
  async rewrites() {
    return { beforeFiles: [
      { source: "/_app/constructor/_next/static/:path*", destination: "/_next/static/:path*" },
      { source: "/api/:path*", destination: `${process.env.BACKEND_URL ?? "http://127.0.0.1:8000"}/api/:path*` },
    ] };
  },
};
export default config;
