import { isIPv4 } from "node:net";

export type DockerPortBindings = Record<string, Array<{ HostIp?: string; HostPort?: string }> | null>;
export type DockerNetworkFacts = Record<string, { IPAddress?: string }>;
export type DockerMountFact = { Type?: string; Name?: string; Destination?: string };
export type DockerContainerMountSnapshot = {
  containerId: string;
  mounts: DockerMountFact[] | null;
};

const TEST_PROJECT_MARKERS = new Set(["test", "e2e", "check"]);
const PRODUCTION_PROJECT_MARKERS = new Set(["prod", "production", "live"]);
const EXPLICIT_LOOPBACK_ORIGIN = /^http:\/\/127\.0\.0\.1:(\d+)\/?$/;
const POSTGRES_DATA_DIRECTORY = "/var/lib/postgresql";

function normalizeIPv4Address(value: string | undefined): string | undefined {
  const address = value?.trim();
  if (!address) return undefined;
  if (isIPv4(address)) return address;

  const ipv4Mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(address)?.[1];
  return ipv4Mapped && isIPv4(ipv4Mapped) ? ipv4Mapped : undefined;
}

export function sharedPostgresIPv4Addresses(
  backendNetworks: DockerNetworkFacts,
  postgresNetworks: DockerNetworkFacts,
): string[] {
  const addresses = new Set<string>();
  for (const [networkName, backendNetwork] of Object.entries(backendNetworks)) {
    const postgresNetwork = postgresNetworks[networkName];
    if (!postgresNetwork) continue;

    const backendAddress = normalizeIPv4Address(backendNetwork.IPAddress);
    const postgresAddress = normalizeIPv4Address(postgresNetwork.IPAddress);
    if (backendAddress && postgresAddress) addresses.add(postgresAddress);
  }
  return [...addresses];
}

export function assertDatabaseIsolation({
  projectLabel,
  backendProjectLabel,
  backendServiceLabel,
  postgresProjectLabel,
  postgresServiceLabel,
  postgresRunning,
  backendNetworks,
  postgresNetworks,
  databaseMatchesPostgres,
  postgresMounts,
  volumeName,
  volumeProjectLabel,
  volumeLogicalName,
}: {
  projectLabel: string | undefined;
  backendProjectLabel: string | undefined;
  backendServiceLabel: string | undefined;
  postgresProjectLabel: string | undefined;
  postgresServiceLabel: string | undefined;
  postgresRunning: boolean;
  backendNetworks: DockerNetworkFacts;
  postgresNetworks: DockerNetworkFacts;
  databaseMatchesPostgres: boolean | undefined;
  postgresMounts: DockerMountFact[];
  volumeName: string | undefined;
  volumeProjectLabel: string | undefined;
  volumeLogicalName: string | undefined;
}): void {
  assertTestProjectLabel(projectLabel);
  if (
    backendProjectLabel !== projectLabel
    || backendServiceLabel !== "backend"
    || postgresProjectLabel !== projectLabel
    || postgresServiceLabel !== "postgres"
  ) {
    throw new Error("The backend and PostgreSQL service must belong to the same Docker Compose test project.");
  }
  if (!postgresRunning) {
    throw new Error("Selected E2E PostgreSQL service is not running.");
  }
  const postgresAddresses = sharedPostgresIPv4Addresses(backendNetworks, postgresNetworks);
  if (postgresAddresses.length === 0) {
    throw new Error("The backend and PostgreSQL service must share a verifiable IPv4 Docker network.");
  }
  if (databaseMatchesPostgres !== true) {
    throw new Error("The backend database connection must resolve to the selected project PostgreSQL service.");
  }

  const dataMounts = postgresMounts.filter((mount) => mount.Destination === POSTGRES_DATA_DIRECTORY);
  const expectedVolumeName = `${projectLabel}_postgres_data`;
  if (
    dataMounts.length !== 1
    || dataMounts[0].Type !== "volume"
    || !dataMounts[0].Name
    || dataMounts[0].Name !== expectedVolumeName
    || volumeName !== expectedVolumeName
  ) {
    throw new Error("The PostgreSQL data directory must use one Compose-managed postgres_data volume.");
  }
  if (
    volumeProjectLabel !== projectLabel
    || volumeLogicalName !== "postgres_data"
  ) {
    throw new Error("The PostgreSQL volume must be owned by the selected Compose project.");
  }
}

export function assertNoOtherPostgresVolumeConsumers({
  volumeName,
  postgresContainerId,
  containers,
}: {
  volumeName: string;
  postgresContainerId: string;
  containers: readonly DockerContainerMountSnapshot[];
}): void {
  if (!volumeName.trim() || !postgresContainerId.trim() || containers.length === 0) {
    throw new Error("Could not verify all Docker containers using the PostgreSQL test volume.");
  }

  const seenContainerIds = new Set<string>();
  let postgresContainerFound = false;
  for (const container of containers) {
    if (!container.containerId.trim() || seenContainerIds.has(container.containerId) || !Array.isArray(container.mounts)) {
      throw new Error("Docker returned incomplete container mount metadata while validating the PostgreSQL test volume.");
    }
    seenContainerIds.add(container.containerId);
    if (container.containerId === postgresContainerId) postgresContainerFound = true;

    for (const mount of container.mounts) {
      if (!mount || typeof mount !== "object") {
        throw new Error("Docker returned incomplete container mount metadata while validating the PostgreSQL test volume.");
      }
      if (mount.Type === "volume" && mount.Name === volumeName && container.containerId !== postgresContainerId) {
        throw new Error("The PostgreSQL test volume is mounted by another Docker container; isolated E2E database testing is blocked.");
      }
    }
  }

  if (!postgresContainerFound) {
    throw new Error("The selected PostgreSQL container was missing from Docker's complete container inventory.");
  }
}

export function requireTestBackendContainer(value: string | undefined): string {
  const container = value?.trim();
  if (!container || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(container)) {
    throw new Error("Set PLAYWRIGHT_BACKEND_CONTAINER to an explicit Docker container name.");
  }
  return container;
}

export function requirePlaywrightBaseURL(value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error("PLAYWRIGHT_BASE_URL is required; E2E tests never choose a target implicitly.");
  }
  return value;
}

export function assertBackendContainer({
  serviceLabel,
  running,
}: {
  serviceLabel: string | undefined;
  running: boolean;
}): void {
  if (serviceLabel !== "backend") {
    throw new Error("PLAYWRIGHT_BACKEND_CONTAINER must select a Docker Compose backend service.");
  }
  if (!running) {
    throw new Error("Selected E2E backend container is not running.");
  }
}

export function assertGatewayContainer({
  serviceLabel,
  running,
}: {
  serviceLabel: string | undefined;
  running: boolean;
}): void {
  if (serviceLabel !== "gateway") {
    throw new Error("The selected Compose gateway container must provide the gateway service.");
  }
  if (!running) {
    throw new Error("Selected E2E gateway container is not running.");
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

  if (
    target.protocol !== "http:"
    || target.hostname !== "127.0.0.1"
    || !EXPLICIT_LOOPBACK_ORIGIN.test(baseURL.trim())
  ) {
    throw new Error("PLAYWRIGHT_BASE_URL must use HTTP at the explicit IPv4 loopback address 127.0.0.1 with a port.");
  }
  if (target.username || target.password || target.pathname !== "/" || target.search || target.hash) {
    throw new Error("PLAYWRIGHT_BASE_URL must identify the selected gateway origin only.");
  }

  const basePort = target.port || "80";
  const hasMatchingLoopbackBinding = Object.values(gatewayPorts).some((bindings) =>
    bindings?.some((binding) =>
      binding.HostIp === "127.0.0.1" && binding.HostPort === basePort,
    ),
  );
  if (!hasMatchingLoopbackBinding) {
    throw new Error("PLAYWRIGHT_BASE_URL must match a published 127.0.0.1 loopback gateway port in the selected Compose project.");
  }
}
