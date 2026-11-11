import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

process.env.PORT ??= "3100";
process.env.HOSTNAME ??= "0.0.0.0";

const standalone = resolve(process.cwd(), ".next/standalone");
const flatServer = resolve(standalone, "server.js");
const monorepoServer = resolve(standalone, "apps/website/server.js");
const server = existsSync(flatServer) ? flatServer : monorepoServer;

if (!existsSync(server)) {
  throw new Error(`Next standalone server.js was not found under ${standalone}`);
}

process.chdir(resolve(server, ".."));
await import(pathToFileURL(server).href);
