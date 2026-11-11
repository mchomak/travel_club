import { execFileSync } from "node:child_process";
import { requireTestBackendContainer } from "./isolation-guard";

const backendContainer = requireTestBackendContainer(process.env.PLAYWRIGHT_BACKEND_CONTAINER);

export function database(code: string, input: object): string {
  try {
    return execFileSync("docker", ["exec", "-i", backendContainer, "python", "-c", code], {
      input: JSON.stringify(input),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
  } catch {
    throw new Error("The selected isolated E2E backend rejected a fixture operation.");
  }
}
