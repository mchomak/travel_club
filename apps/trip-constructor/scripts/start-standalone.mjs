import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";

const standalone = ".next/standalone";
const staticAssets = ".next/static";
if (existsSync(staticAssets)) {
  mkdirSync(`${standalone}/.next`, { recursive: true });
  cpSync(staticAssets, `${standalone}/.next/static`, { recursive: true });
}
if (existsSync("public")) {
  cpSync("public", `${standalone}/public`, { recursive: true });
}

const child = spawn(process.execPath, [`${standalone}/server.js`], {
  stdio: "inherit",
  env: {
    ...process.env,
    HOSTNAME: process.env.HOSTNAME || "0.0.0.0",
    PORT: process.env.PORT || "3101",
  },
});

child.on("error", error => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
