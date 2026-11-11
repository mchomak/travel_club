import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  assetPrefix: "/_app/website",
  images: { path: "/_app/website/_next/image" },
  poweredByHeader: false,
  async rewrites() {
    return {
      beforeFiles: [{ source: "/_app/website/_next/:path*", destination: "/_next/:path*" }],
      afterFiles: [{ source: "/api/:path*", destination: `${process.env.BACKEND_URL ?? "http://127.0.0.1:8000"}/api/:path*` }],
    };
  },
};

export default config;
