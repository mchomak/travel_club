export type DockerPortBindings = Record<string, Array<{ HostIp?: string; HostPort?: string }> | null>;

const TEST_PROJECT_MARKERS = new Set(["test", "e2e", "check"]);
const PRODUCTION_PROJECT_MARKERS = new Set(["prod", "production", "live"]);
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function requireTestBackendContainer(value: string | undefined): string {
  const container = value?.trim();
  if (!container || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(container)) {
    throw new Error("Set PLAYWRIGHT_TEST_BACKEND_CONTAINER to an explicit Docker container name.");
  }
  return container;
}

export function assertBackendContainer({
  serviceLabel,
  running,
}: {
  serviceLabel: string | undefined;
  running: boolean;
}): void {
  if (serviceLabel !== "backend") {
    throw new Error("PLAYWRIGHT_TEST_BACKEND_CONTAINER must select a Docker Compose backend service.");
  }
  if (!running) {
    throw new Error("Selected E2E backend container is not running.");
  }
}

export function assertSameProjectGateway({
  backendProjectLabel,
  gatewayProjectLabel,
  gatewayServiceLabel,
}: {
  backendProjectLabel: string | undefined;
  gatewayProjectLabel: string | undefined;
  gatewayServiceLabel: string | undefined;
}): void {
  if (
    !backendProjectLabel
    || gatewayProjectLabel !== backendProjectLabel
    || gatewayServiceLabel !== "gateway"
  ) {
    throw new Error("Selected E2E backend and gateway must belong to the same Docker Compose project.");
  }
}

export function assertTestProjectLabel(projectLabel: string | undefined): asserts projectLabel is string {
  const projectTokens = (projectLabel ?? "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (
    !projectTokens.some((token) => TEST_PROJECT_MARKERS.has(token))
    || projectTokens.some((token) => PRODUCTION_PROJECT_MARKERS.has(token))
  ) {
    throw new Error("Selected Docker Compose project label must contain a test, e2e, or check marker.");
  }
}

export function assertTestContour({
  projectLabel,
  baseURL,
  gatewayPorts,
}: {
  projectLabel: string | undefined;
  baseURL: string;
  gatewayPorts: DockerPortBindings;
}): void {
  assertTestProjectLabel(projectLabel);

  let target: URL;
  try {
    target = new URL(baseURL);
  } catch {
    throw new Error("PLAYWRIGHT_BASE_URL must be a valid absolute URL.");
  }

  if (target.protocol !== "http:" || !LOOPBACK_HOSTS.has(target.hostname.toLowerCase())) {
    throw new Error("PLAYWRIGHT_BASE_URL must use HTTP on a loopback host.");
  }
  if (target.username || target.password || target.pathname !== "/" || target.search || target.hash) {
    throw new Error("PLAYWRIGHT_BASE_URL must identify the selected gateway origin only.");
  }

  const basePort = target.port || "80";
  const hasMatchingLoopbackBinding = Object.values(gatewayPorts).some((bindings) =>
    bindings?.some((binding) =>
      LOOPBACK_HOSTS.has((binding.HostIp ?? "").toLowerCase()) && binding.HostPort === basePort,
    ),
  );
  if (!hasMatchingLoopbackBinding) {
    throw new Error("PLAYWRIGHT_BASE_URL must match a published loopback gateway port in the selected Compose project.");
  }
}
