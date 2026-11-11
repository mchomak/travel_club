import { expect, test } from "@playwright/test";
import {
  assertBackendContainer,
  assertDatabaseIsolation,
  assertGatewayContainer,
  assertSameProjectGateway,
  assertNoOtherPostgresVolumeConsumers,
  assertTestContour,
  requirePlaywrightBaseURL,
  requireTestBackendContainer,
  sharedPostgresIPv4Addresses,
  type DockerPortBindings,
} from "./isolation-guard";

const gatewayPorts: DockerPortBindings = {
  "3000/tcp": [{ HostIp: "127.0.0.1", HostPort: "3300" }],
};

const isolatedDatabase = {
  projectLabel: "travel-architecture-check",
  backendProjectLabel: "travel-architecture-check",
  backendServiceLabel: "backend",
  postgresProjectLabel: "travel-architecture-check",
  postgresServiceLabel: "postgres",
  postgresRunning: true,
  backendNetworks: { "travel-architecture-check_default": { IPAddress: "192.0.2.10" } },
  postgresNetworks: { "travel-architecture-check_default": { IPAddress: "192.0.2.11" } },
  databaseMatchesPostgres: true,
  postgresMounts: [{ Type: "volume", Name: "travel-architecture-check_postgres_data", Destination: "/var/lib/postgresql" }],
  volumeName: "travel-architecture-check_postgres_data",
  volumeProjectLabel: "travel-architecture-check",
  volumeLogicalName: "postgres_data",
};

test("backend SQL connection and PostgreSQL volume are isolated in the same Compose project", () => {
  expect(() => assertDatabaseIsolation(isolatedDatabase)).not.toThrow();
});

test("the test PostgreSQL volume has one consumer across the complete container inventory", () => {
  const volumeName = "travel-architecture-check_postgres_data";
  const postgresMount = { Type: "volume", Name: volumeName, Destination: "/var/lib/postgresql" };
  const containers = [
    { containerId: "selected-postgres", mounts: [postgresMount] },
    { containerId: "unrelated-container", mounts: [] },
  ];

  expect(() => assertNoOtherPostgresVolumeConsumers({
    volumeName,
    postgresContainerId: "selected-postgres",
    containers,
  })).not.toThrow();

  expect(() => assertNoOtherPostgresVolumeConsumers({
    volumeName,
    postgresContainerId: "selected-postgres",
    containers: [...containers, {
      containerId: "stopped-container",
      mounts: [{ Type: "volume", Name: volumeName, Destination: "/backup/postgres" }],
    }],
  })).toThrow(/mounted by another Docker container/i);
});

test("incomplete Docker volume-consumer metadata fails closed", () => {
  expect(() => assertNoOtherPostgresVolumeConsumers({
    volumeName: "travel-architecture-check_postgres_data",
    postgresContainerId: "selected-postgres",
    containers: [{ containerId: "selected-postgres", mounts: null }],
  })).toThrow(/incomplete container mount metadata/i);
  expect(() => assertNoOtherPostgresVolumeConsumers({
    volumeName: "travel-architecture-check_postgres_data",
    postgresContainerId: "selected-postgres",
    containers: [{ containerId: "different-postgres", mounts: [] }],
  })).toThrow(/missing from Docker's complete container inventory/i);
});

test("runtime database candidates come only from a shared IPv4 network and normalize mapped addresses", () => {
  expect(sharedPostgresIPv4Addresses(
    { "travel-architecture-check_default": { IPAddress: "::ffff:192.0.2.10" } },
    { "travel-architecture-check_default": { IPAddress: "::ffff:192.0.2.11" } },
  )).toEqual(["192.0.2.11"]);
  expect(sharedPostgresIPv4Addresses(
    { "travel-architecture-check_default": { IPAddress: "192.0.2.10" } },
    { "other-project_default": { IPAddress: "192.0.2.11" } },
  )).toEqual([]);
  expect(sharedPostgresIPv4Addresses(
    { "travel-architecture-check_default": {} },
    { "travel-architecture-check_default": { IPAddress: "192.0.2.11" } },
  )).toEqual([]);
});

test("the runtime database connection must match the selected project PostgreSQL service", () => {
  expect(() => assertDatabaseIsolation({ ...isolatedDatabase, databaseMatchesPostgres: false }))
    .toThrow(/backend database connection must resolve to the selected project PostgreSQL service/i);
  expect(() => assertDatabaseIsolation({ ...isolatedDatabase, databaseMatchesPostgres: undefined }))
    .toThrow(/backend database connection must resolve to the selected project PostgreSQL service/i);
});

test("the database service and a shared IPv4 network must belong to the backend project", () => {
  expect(() => assertDatabaseIsolation({ ...isolatedDatabase, postgresProjectLabel: "other-test" }))
    .toThrow(/same Docker Compose test project/i);
  expect(() => assertDatabaseIsolation({ ...isolatedDatabase, postgresServiceLabel: "backend" }))
    .toThrow(/same Docker Compose test project/i);
  expect(() => assertDatabaseIsolation({ ...isolatedDatabase, postgresRunning: false }))
    .toThrow(/PostgreSQL service is not running/i);
  expect(() => assertDatabaseIsolation({ ...isolatedDatabase, postgresNetworks: {} }))
    .toThrow(/share a verifiable IPv4 Docker network/i);
});

test("external, foreign, anonymous, or unexpected database volumes are rejected", () => {
  expect(() => assertDatabaseIsolation({ ...isolatedDatabase, volumeProjectLabel: "other-test" }))
    .toThrow(/PostgreSQL volume must be owned by the selected Compose project/i);
  expect(() => assertDatabaseIsolation({ ...isolatedDatabase, volumeLogicalName: undefined }))
    .toThrow(/PostgreSQL volume must be owned by the selected Compose project/i);
  expect(() => assertDatabaseIsolation({ ...isolatedDatabase, volumeName: "external-postgres-data" }))
    .toThrow(/one Compose-managed postgres_data volume/i);
  expect(() => assertDatabaseIsolation({
    ...isolatedDatabase,
    volumeName: "external-postgres-data",
    postgresMounts: [{ Type: "volume", Name: "external-postgres-data", Destination: "/var/lib/postgresql" }],
  })).toThrow(/one Compose-managed postgres_data volume/i);
  expect(() => assertDatabaseIsolation({ ...isolatedDatabase, postgresMounts: [] }))
    .toThrow(/one Compose-managed postgres_data volume/i);
  expect(() => assertDatabaseIsolation({
    ...isolatedDatabase,
    postgresMounts: [{ Type: "bind", Name: "", Destination: "/var/lib/postgresql" }],
  })).toThrow(/one Compose-managed postgres_data volume/i);
});

test("E2E requests require an explicitly selected backend container", () => {
  expect(() => requireTestBackendContainer(undefined)).toThrow(/explicit Docker container name/i);
  expect(() => requireTestBackendContainer("-unexpected-flag")).toThrow(/explicit Docker container name/i);
  expect(requireTestBackendContainer("travel-architecture-check-backend-1")).toBe("travel-architecture-check-backend-1");
  expect(() => requirePlaywrightBaseURL(undefined)).toThrow(/PLAYWRIGHT_BASE_URL is required/i);
});

test("the selected container must be a running Compose backend", () => {
  expect(() => assertBackendContainer({ serviceLabel: "gateway", running: true }))
    .toThrow(/select a Docker Compose backend service/i);
  expect(() => assertBackendContainer({ serviceLabel: "backend", running: false }))
    .toThrow(/backend container is not running/i);
  expect(() => assertBackendContainer({ serviceLabel: "backend", running: true })).not.toThrow();
});

test("the selected gateway must be running and provide the gateway service", () => {
  expect(() => assertGatewayContainer({ serviceLabel: "frontend", running: true }))
    .toThrow(/provide the gateway service/i);
  expect(() => assertGatewayContainer({ serviceLabel: "gateway", running: false }))
    .toThrow(/gateway container is not running/i);
  expect(() => assertGatewayContainer({ serviceLabel: "gateway", running: true })).not.toThrow();
});

test("the discovered gateway must be a member of the selected backend project", () => {
  expect(() => assertSameProjectGateway({
    backendProjectLabel: "travel-architecture-check",
    gatewayProjectLabel: "other-e2e-project",
    gatewayServiceLabel: "gateway",
  })).toThrow(/same Docker Compose project/i);

  expect(() => assertSameProjectGateway({
    backendProjectLabel: "travel-architecture-check",
    gatewayProjectLabel: "travel-architecture-check",
    gatewayServiceLabel: "frontend",
  })).toThrow(/same Docker Compose project/i);

  expect(() => assertSameProjectGateway({
    backendProjectLabel: "travel-architecture-check",
    gatewayProjectLabel: "travel-architecture-check",
    gatewayServiceLabel: "gateway",
  })).not.toThrow();
});

test("E2E requests require a test-marked Compose project", () => {
  expect(() => assertTestContour({
    projectLabel: "travel-club-production",
    baseURL: "http://localhost:3300",
    gatewayPorts,
  })).toThrow(/test|e2e|check/i);

  expect(() => assertTestContour({
    projectLabel: "travel-production-check",
    baseURL: "http://localhost:3300",
    gatewayPorts,
  })).toThrow(/test|e2e|check/i);
});

test("E2E URL and published binding must use the same canonical IPv4 loopback address", () => {
  for (const baseURL of [
    "http://localhost:3301",
    "http://localhost:3300",
    "http://[::1]:3300",
    "http://0.0.0.0:3300",
    "http://127.0.0.2:3300",
    "http://example.com:3300",
    "https://127.0.0.1:3300",
    "http://127.0.0.1:3300/admin",
  ]) {
    expect(() => assertTestContour({
      projectLabel: "travel-architecture-check",
      baseURL,
      gatewayPorts,
    })).toThrow();
  }

  for (const HostIp of ["localhost", "::1", "[::1]", "0.0.0.0", "::", "127.0.0.2"]) {
    expect(() => assertTestContour({
      projectLabel: "travel-architecture-check",
      baseURL: "http://127.0.0.1:3300",
      gatewayPorts: { "3000/tcp": [{ HostIp, HostPort: "3300" }] },
    })).toThrow();
  }

  expect(() => assertTestContour({
    projectLabel: "travel-architecture-check",
    baseURL: "http://127.0.0.1:3300",
    gatewayPorts,
  })).not.toThrow();
});
