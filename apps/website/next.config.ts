import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import path from "node:path";

const workspaceRoot = path.resolve(import.meta.dirname, "../..");
const isMonorepo = existsSync(path.join(workspaceRoot, "apps"))
  && existsSync(path.join(workspaceRoot, "shared", "website-products.json"));
const sharedAtAppRoot = path.resolve(import.meta.dirname, "shared");
const outputFileTracingRoot = isMonorepo
  ? workspaceRoot
  : existsSync(sharedAtAppRoot)
    ? import.meta.dirname
    : undefined;

const config: NextConfig = {
  output: "standalone",
  ...(outputFileTracingRoot ? { outputFileTracingRoot } : {}),
  assetPrefix: "/_app/website",
  images: { path: "/_app/website/_next/image" },
  poweredByHeader: false,
  async rewrites() {
    return {
      beforeFiles: [{ source: "/_app/website/_next/:path*", destination: "/_next/:path*" }],
      afterFiles: [
        {
          source: "/api/leads",
          destination: `${process.env.WEBSITE_LEADS_API_URL ?? "http://127.0.0.1:8001"}/api/leads`,
        },
        {
          source: "/api/leads/:path*",
          destination: `${process.env.WEBSITE_LEADS_API_URL ?? "http://127.0.0.1:8001"}/api/leads/:path*`,
        },
        {
          source: "/api/:path*",
          destination: `${process.env.BACKEND_URL ?? "http://127.0.0.1:8000"}/api/:path*`,
        },
      ],
    };
  },
};

export default config;
