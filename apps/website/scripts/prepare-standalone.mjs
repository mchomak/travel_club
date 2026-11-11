import { cp, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const standalone = resolve(root, ".next/standalone");
const publicSource = resolve(root, "public");
const staticSource = resolve(root, ".next/static");
const publicDestination = resolve(standalone, "public");
const staticDestination = resolve(standalone, ".next/static");

await rm(publicDestination, { recursive: true, force: true });
await rm(staticDestination, { recursive: true, force: true });
await cp(publicSource, publicDestination, { recursive: true });
await cp(staticSource, staticDestination, { recursive: true });
