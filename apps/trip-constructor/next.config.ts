import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import path from "node:path";

const workspaceRoot = path.resolve(import.meta.dirname, "../..");
const sharedRoot = existsSync(path.join(workspaceRoot, "apps", "trip-constructor"))
  ? workspaceRoot : import.meta.dirname;

const config: NextConfig = {
  output: "standalone",
  turbopack: { root: sharedRoot },
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
