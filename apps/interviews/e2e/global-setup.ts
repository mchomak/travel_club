import { execFileSync } from "node:child_process";
import {
  assertBackendContainer,
  assertSameProjectGateway,
  assertTestProjectLabel,
  assertTestContour,
  requireTestBackendContainer,
  type DockerPortBindings,
} from "./isolation-guard";

function dockerOutput(args: string[]): string {
  try {
    return execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    throw new Error("Could not verify the selected Docker Compose E2E test contour; ensure Docker and the test containers are available.");
  }
}

function inspectJson<T>(container: string, template: string): T {
  const output = dockerOutput(["inspect", "--format", template, container]);
  try {
    return JSON.parse(output) as T;
  } catch {
    throw new Error("Docker returned invalid metadata while validating the E2E test contour.");
  }
}

export default async function globalSetup(): Promise<void> {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL;
  if (!baseURL) throw new Error("PLAYWRIGHT_BASE_URL is required; E2E tests never choose a target implicitly.");

  const backendContainer = requireTestBackendContainer(process.env.PLAYWRIGHT_TEST_BACKEND_CONTAINER);
  const backendLabels = inspectJson<Record<string, string>>(
    backendContainer,
    "{{json .Config.Labels}}",
  );
  const projectLabel = backendLabels["com.docker.compose.project"];
  assertTestProjectLabel(projectLabel);
  assertBackendContainer({
    serviceLabel: backendLabels["com.docker.compose.service"],
    running: dockerOutput(["inspect", "--format", "{{.State.Running}}", backendContainer]) === "true",
  });

  const gatewayIds = dockerOutput([
    "ps",
    "--filter", `label=com.docker.compose.project=${projectLabel}`,
    "--filter", "label=com.docker.compose.service=gateway",
    "--format", "{{.ID}}",
  ]).split(/\r?\n/).filter(Boolean);
  if (gatewayIds.length !== 1) {
    throw new Error("The selected E2E Compose project must have exactly one running gateway.");
  }

  const gatewayLabels = inspectJson<Record<string, string>>(gatewayIds[0], "{{json .Config.Labels}}");
  assertSameProjectGateway({
    backendProjectLabel: projectLabel,
    gatewayProjectLabel: gatewayLabels["com.docker.compose.project"],
    gatewayServiceLabel: gatewayLabels["com.docker.compose.service"],
  });
  const gatewayPorts = inspectJson<DockerPortBindings>(gatewayIds[0], "{{json .NetworkSettings.Ports}}");

  assertTestContour({ projectLabel, baseURL, gatewayPorts });
}
