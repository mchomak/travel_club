import { pathToFileURL } from "node:url";

process.env.PORT ??= "3000";
process.env.HOSTNAME = "0.0.0.0";

await import(pathToFileURL(`${process.cwd()}/server.js`).href);
