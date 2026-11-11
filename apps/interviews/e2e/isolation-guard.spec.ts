import { expect, test } from "@playwright/test";
import {
  assertBackendContainer,
  assertSameProjectGateway,
  assertTestContour,
  requireTestBackendContainer,
  type DockerPortBindings,
} from "./isolation-guard";

const gatewayPorts: DockerPortBindings = {
  "3000/tcp": [{ HostIp: "127.0.0.1", HostPort: "3300" }],
};

test("E2E requests require an explicitly selected backend container", () => {
  expect(() => requireTestBackendContainer(undefined)).toThrow(/explicit Docker container name/i);
  expect(() => requireTestBackendContainer("-unexpected-flag")).toThrow(/explicit Docker container name/i);
  expect(requireTestBackendContainer("travel-architecture-check-backend-1")).toBe("travel-architecture-check-backend-1");
});

test("the selected container must be a running Compose backend", () => {
  expect(() => assertBackendContainer({ serviceLabel: "gateway", running: true }))
    .toThrow(/select a Docker Compose backend service/i);
  expect(() => assertBackendContainer({ serviceLabel: "backend", running: false }))
    .toThrow(/backend container is not running/i);
  expect(() => assertBackendContainer({ serviceLabel: "backend", running: true })).not.toThrow();
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

test("E2E base URL must match this project's published loopback gateway port", () => {
  expect(() => assertTestContour({
    projectLabel: "travel-architecture-check",
    baseURL: "http://localhost:3301",
    gatewayPorts,
  })).toThrow(/published loopback gateway port/i);

  expect(() => assertTestContour({
    projectLabel: "travel-architecture-check",
    baseURL: "http://example.com:3300",
    gatewayPorts,
  })).toThrow(/loopback/i);

  expect(() => assertTestContour({
    projectLabel: "travel-architecture-check",
    baseURL: "http://localhost:3300",
    gatewayPorts,
  })).not.toThrow();
});
