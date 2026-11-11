import { execFileSync } from "node:child_process";
import {
  assertBackendContainer,
  assertDatabaseIsolation,
  assertGatewayContainer,
  assertSameProjectGateway,
  assertNoOtherPostgresVolumeConsumers,
  assertTestContour,
  assertTestProjectLabel,
  requirePlaywrightBaseURL,
  requireTestBackendContainer,
  sharedPostgresIPv4Addresses,
  type DockerContainerMountSnapshot,
  type DockerMountFact,
  type DockerNetworkFacts,
  type DockerPortBindings,
} from "./isolation-guard";

const COMPOSE_IDENTITY_TEMPLATE = '{{index .Config.Labels "com.docker.compose.project"}}|{{index .Config.Labels "com.docker.compose.service"}}';
const NETWORKS_TEMPLATE = '{{range $name, $network := .NetworkSettings.Networks}}{{$name}}={{$network.IPAddress}};{{end}}';
const VOLUME_IDENTITY_TEMPLATE = '{{.Name}}|{{index .Labels "com.docker.compose.project"}}|{{index .Labels "com.docker.compose.volume"}}';
const DATABASE_PROBE_SCRIPT = [
  "import ipaddress, json, sys",
  "from app.db import engine",
  "def normalized(value):",
  "    address = ipaddress.ip_interface(str(value)).ip",
  "    mapped = address.ipv4_mapped if isinstance(address, ipaddress.IPv6Address) else None",
  "    return mapped or address",
  "try:",
  "    with engine.connect() as connection:",
  "        server_address = connection.exec_driver_sql('SELECT inet_server_addr()').scalar_one_or_none()",
  "    postgres_addresses = {normalized(value) for value in json.loads(sys.argv[1])}",
  "    matches = server_address is not None and normalized(server_address) in postgres_addresses",
  "    print('DB_MATCH=' + str(matches).lower())",
  "except Exception:",
  "    print('DB_MATCH=false')",
].join("\n");

function dockerOutput(args: string[]): string {
  try {
    return execFileSync("docker", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
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

function inspectComposeIdentity(container: string): { projectLabel: string; serviceLabel: string } {
  const parts = dockerOutput(["inspect", "--format", COMPOSE_IDENTITY_TEMPLATE, container]).split("|");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error("Docker Compose project or service labels are unavailable for the selected E2E container.");
  }
  return { projectLabel: parts[0], serviceLabel: parts[1] };
}

function inspectNetworks(container: string): DockerNetworkFacts {
  const output = dockerOutput(["inspect", "--format", NETWORKS_TEMPLATE, container]);
  const networks: DockerNetworkFacts = {};
  for (const line of output.split(";").filter(Boolean)) {
    const separator = line.indexOf("=");
    if (separator < 1 || separator === line.length - 1) {
      throw new Error("Docker returned invalid network metadata while validating the E2E test contour.");
    }
    const networkName = line.slice(0, separator);
    if (Object.hasOwn(networks, networkName)) {
      throw new Error("Docker returned duplicate network metadata while validating the E2E test contour.");
    }
    networks[networkName] = { IPAddress: line.slice(separator + 1) };
  }
  return networks;
}

function inspectVolumeIdentity(volumeName: string): {
  name: string | undefined;
  projectLabel: string | undefined;
  logicalName: string | undefined;
} {
  const parts = dockerOutput(["volume", "inspect", "--format", VOLUME_IDENTITY_TEMPLATE, volumeName]).split("|");
  if (parts.length !== 3) {
    throw new Error("Docker returned invalid PostgreSQL volume metadata while validating the E2E test contour.");
  }
  return {
    name: parts[0] || undefined,
    projectLabel: parts[1] || undefined,
    logicalName: parts[2] || undefined,
  };
}

function inspectAllContainerMounts(): DockerContainerMountSnapshot[] {
  const containerIds = dockerOutput([
    "ps",
    "--all",
    "--no-trunc",
    "--format",
    "{{.ID}}",
  ]).split(/\r?\n/).filter(Boolean);
  if (containerIds.length === 0) {
    throw new Error("Docker returned no container inventory while validating the PostgreSQL test volume.");
  }

  return containerIds.map((containerId) => {
    const output = dockerOutput([
      "inspect",
      "--format",
      "{{.Id}}|{{json .Mounts}}",
      containerId,
    ]);
    const separator = output.indexOf("|");
    if (separator < 1) {
      throw new Error("Docker returned invalid container mount metadata while validating the PostgreSQL test volume.");
    }
    try {
      const mounts = JSON.parse(output.slice(separator + 1)) as DockerContainerMountSnapshot["mounts"];
      return { containerId: output.slice(0, separator), mounts };
    } catch {
      throw new Error("Docker returned invalid container mount metadata while validating the PostgreSQL test volume.");
    }
  });
}

function probeBackendDatabase(backendContainer: string, postgresAddresses: string[]): boolean {
  const result = dockerOutput([
    "exec",
    backendContainer,
    "python",
    "-c",
    DATABASE_PROBE_SCRIPT,
    JSON.stringify(postgresAddresses),
  ]);
  return result === "DB_MATCH=true";
}

export default async function globalSetup(): Promise<void> {
  const baseURL = requirePlaywrightBaseURL(process.env.PLAYWRIGHT_BASE_URL);
  const backendContainer = requireTestBackendContainer(process.env.PLAYWRIGHT_TEST_BACKEND_CONTAINER);
  const backendIdentity = inspectComposeIdentity(backendContainer);
  const projectLabel = backendIdentity.projectLabel;
  assertTestProjectLabel(projectLabel);
  assertBackendContainer({
    serviceLabel: backendIdentity.serviceLabel,
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

  const gatewayIdentity = inspectComposeIdentity(gatewayIds[0]);
  assertGatewayContainer({
    serviceLabel: gatewayIdentity.serviceLabel,
    running: dockerOutput(["inspect", "--format", "{{.State.Running}}", gatewayIds[0]]) === "true",
  });
  assertSameProjectGateway({
    backendProjectLabel: projectLabel,
    gatewayProjectLabel: gatewayIdentity.projectLabel,
    gatewayServiceLabel: gatewayIdentity.serviceLabel,
  });
  const gatewayPorts = inspectJson<DockerPortBindings>(gatewayIds[0], "{{json .NetworkSettings.Ports}}");
  assertTestContour({ projectLabel, baseURL, gatewayPorts });

  const postgresIds = dockerOutput([
    "ps",
    "--all",
    "--no-trunc",
    "--filter", `label=com.docker.compose.project=${projectLabel}`,
    "--filter", "label=com.docker.compose.service=postgres",
    "--format", "{{.ID}}",
  ]).split(/\r?\n/).filter(Boolean);
  if (postgresIds.length !== 1) {
    throw new Error("The selected E2E Compose project must have exactly one PostgreSQL service container.");
  }

  const postgresIdentity = inspectComposeIdentity(postgresIds[0]);
  const backendNetworks = inspectNetworks(backendContainer);
  const postgresNetworks = inspectNetworks(postgresIds[0]);
  const postgresAddresses = sharedPostgresIPv4Addresses(backendNetworks, postgresNetworks);
  const postgresMounts = inspectJson<DockerMountFact[] | null>(postgresIds[0], "{{json .Mounts}}");
  if (!Array.isArray(postgresMounts)) {
    throw new Error("Docker returned invalid PostgreSQL mount metadata while validating the E2E test contour.");
  }

  const dataMounts = postgresMounts.filter((mount) => mount.Destination === "/var/lib/postgresql");
  if (dataMounts.length !== 1 || dataMounts[0].Type !== "volume" || !dataMounts[0].Name) {
    throw new Error("The PostgreSQL data directory must use one Compose-managed postgres_data volume.");
  }
  const volumeIdentity = inspectVolumeIdentity(dataMounts[0].Name);
  if (!volumeIdentity.name) {
    throw new Error("Docker returned incomplete PostgreSQL volume metadata while validating the E2E test contour.");
  }
  assertNoOtherPostgresVolumeConsumers({
    volumeName: volumeIdentity.name,
    postgresContainerId: postgresIds[0],
    containers: inspectAllContainerMounts(),
  });
  const databaseMatchesPostgres = postgresAddresses.length > 0
    ? probeBackendDatabase(backendContainer, postgresAddresses)
    : false;

  assertDatabaseIsolation({
    projectLabel,
    backendProjectLabel: backendIdentity.projectLabel,
    backendServiceLabel: backendIdentity.serviceLabel,
    postgresProjectLabel: postgresIdentity.projectLabel,
    postgresServiceLabel: postgresIdentity.serviceLabel,
    postgresRunning: dockerOutput(["inspect", "--format", "{{.State.Running}}", postgresIds[0]]) === "true",
    backendNetworks,
    postgresNetworks,
    databaseMatchesPostgres,
    postgresMounts,
    volumeName: volumeIdentity.name,
    volumeProjectLabel: volumeIdentity.projectLabel,
    volumeLogicalName: volumeIdentity.logicalName,
  });
}
