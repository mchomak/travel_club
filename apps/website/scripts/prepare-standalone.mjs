import { existsSync } from "node:fs";
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const standalone = resolve(root, ".next/standalone");
const flatAppRoot = standalone;
const monorepoAppRoot = resolve(standalone, "apps/website");
const appRoot = existsSync(resolve(flatAppRoot, "server.js"))
  ? flatAppRoot
  : existsSync(resolve(monorepoAppRoot, "server.js"))
    ? monorepoAppRoot
    : null;

if (!appRoot) {
  throw new Error(`Next standalone server.js was not found under ${standalone}`);
}

const publicSource = resolve(root, "public");
const staticSource = resolve(root, ".next/static");
const publicDestination = resolve(appRoot, "public");
const staticDestination = resolve(appRoot, ".next/static");

await rm(publicDestination, { recursive: true, force: true });
await rm(staticDestination, { recursive: true, force: true });
await mkdir(dirname(publicDestination), { recursive: true });
await mkdir(dirname(staticDestination), { recursive: true });
await cp(publicSource, publicDestination, { recursive: true });
await cp(staticSource, staticDestination, { recursive: true });
