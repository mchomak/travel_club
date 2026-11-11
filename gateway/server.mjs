import http from "node:http";
import https from "node:https";
import { BlockList, isIP } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_PREFIXES = new Map([
  ["/_app/website/_next", "website"],
  ["/_app/constructor/_next", "constructor"],
  ["/_app/interviews/_next", "interviews"],
]);

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "proxy-connection",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function matchesPath(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function appForPath(pathname) {
  for (const [prefix, app] of APP_PREFIXES) {
    if (matchesPath(pathname, prefix)) return app;
  }

  if (matchesPath(pathname, "/api/leads")) return "website-leads-api";
  if (matchesPath(pathname, "/api")) return "backend";
  if (matchesPath(pathname, "/research")) return "interviews";
  if (matchesPath(pathname, "/admin") || matchesPath(pathname, "/home")) return "constructor";
  return "website";
}

function pathWithoutFragment(rawUrl) {
  const parsed = new URL(rawUrl, "http://gateway.invalid");
  return `${parsed.pathname}${parsed.search}`;
}

function resolveUpstream(value, name) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError(`Invalid ${name} upstream URL`);
  }

  if (!new Set(["http:", "https:"]).has(url.protocol) || url.username || url.password) {
    throw new TypeError(`Invalid ${name} upstream URL`);
  }

  return url;
}

function configuredUpstream(explicit, environmentName, fallback) {
  const value = explicit ?? process.env[environmentName];
  return value?.trim() || fallback;
}

function normalizeIpAddress(value) {
  if (typeof value !== "string") return null;
  let address = value.trim();
  if (address.startsWith("[") && address.endsWith("]")) {
    address = address.slice(1, -1);
  }
  const mappedIpv4 = address.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mappedIpv4) address = mappedIpv4[1];
  return isIP(address) ? address : null;
}

function trustedProxyList(value = "") {
  const list = new BlockList();
  const entries = value.split(",").map(entry => entry.trim()).filter(Boolean);

  for (const entry of entries) {
    const separator = entry.lastIndexOf("/");
    if (separator < 1) throw new TypeError("GATEWAY_TRUSTED_PROXY_CIDRS entries must be CIDRs");
    const address = normalizeIpAddress(entry.slice(0, separator));
    const family = isIP(address ?? "");
    const prefix = Number(entry.slice(separator + 1));
    const maxPrefix = family === 4 ? 32 : family === 6 ? 128 : -1;
    if (maxPrefix < 0 || !Number.isInteger(prefix) || prefix < 0 || prefix > maxPrefix) {
      throw new TypeError("Invalid GATEWAY_TRUSTED_PROXY_CIDRS entry");
    }
    list.addSubnet(address, prefix, family === 4 ? "ipv4" : "ipv6");
  }

  return list;
}

function isTrustedProxy(blockList, address) {
  const normalized = normalizeIpAddress(address);
  if (!normalized) return false;
  return blockList.check(normalized, isIP(normalized) === 4 ? "ipv4" : "ipv6");
}

function clientAddressForLeads(request, trustedProxies) {
  const peerAddress = normalizeIpAddress(request.socket.remoteAddress);
  if (!peerAddress || !isTrustedProxy(trustedProxies, peerAddress)) return peerAddress;

  const forwardedHeader = request.headers["x-forwarded-for"];
  const forwardedChain = (Array.isArray(forwardedHeader) ? forwardedHeader.join(",") : forwardedHeader ?? "")
    .split(",")
    .map(normalizeIpAddress);
  if (!forwardedChain.length || forwardedChain.some(address => !address)) return peerAddress;

  for (let index = forwardedChain.length - 1; index >= 0; index -= 1) {
    const address = forwardedChain[index];
    if (!isTrustedProxy(trustedProxies, address)) return address;
  }
  return peerAddress;
}

function requestHeaders(headers) {
  const excluded = new Set(HOP_BY_HOP_HEADERS);
  const connectionTokens = headers.connection?.split(",") ?? [];
  for (const token of connectionTokens) excluded.add(token.trim().toLowerCase());

  return Object.fromEntries(
    Object.entries(headers).filter(([name]) => !excluded.has(name.toLowerCase())),
  );
}

function responseHeaders(headers) {
  const excluded = new Set(HOP_BY_HOP_HEADERS);
  const connection = headers.connection;
  const connectionTokens = Array.isArray(connection) ? connection : connection ? [connection] : [];
  for (const value of connectionTokens) {
    for (const token of value.split(",")) excluded.add(token.trim().toLowerCase());
  }

  return Object.fromEntries(
    Object.entries(headers).filter(([name]) => !excluded.has(name.toLowerCase())),
  );
}

function sendBadRequest(response) {
  response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ code: "INVALID_REQUEST" }));
}

function sendUpstreamError(response) {
  if (response.headersSent) {
    response.destroy();
    return;
  }

  response.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ code: "UPSTREAM_UNAVAILABLE" }));
}

export function createGateway({ upstreams = {}, trustedProxyCidrs = process.env.GATEWAY_TRUSTED_PROXY_CIDRS ?? "" } = {}) {
  const trustedProxies = trustedProxyList(trustedProxyCidrs);
  const configuredUpstreams = {};
  const definitions = [
    ["website", "WEBSITE_UPSTREAM", "http://127.0.0.1:3100"],
    ["constructor", "CONSTRUCTOR_UPSTREAM", "http://127.0.0.1:3101"],
    ["interviews", "INTERVIEWS_UPSTREAM", "http://127.0.0.1:3102"],
    ["backend", "BACKEND_UPSTREAM", "http://127.0.0.1:8000"],
    ["website-leads-api", "WEBSITE_LEADS_UPSTREAM", "http://127.0.0.1:8001"],
  ];

  for (const [name, environmentName, fallback] of definitions) {
    const explicit = Object.hasOwn(upstreams, name) ? upstreams[name] : undefined;
    configuredUpstreams[name] = configuredUpstream(explicit, environmentName, fallback);
  }

  const targets = Object.fromEntries(
    Object.entries(configuredUpstreams).map(([name, value]) => [name, resolveUpstream(value, name)]),
  );

  return http.createServer((request, response) => {
    let path;
    try {
      path = pathWithoutFragment(request.url ?? "/");
    } catch {
      sendBadRequest(response);
      return;
    }

    const app = appForPath(new URL(path, "http://gateway.invalid").pathname);
    const target = targets[app];
    const transport = target.protocol === "https:" ? https : http;
    const headers = requestHeaders(request.headers);
    if (app === "website-leads-api") {
      const clientAddress = clientAddressForLeads(request, trustedProxies);
      if (clientAddress) headers["x-forwarded-for"] = clientAddress;
      else delete headers["x-forwarded-for"];
      delete headers["x-real-ip"];
    }
    const proxyRequest = transport.request(
      {
        hostname: target.hostname,
        port: target.port || undefined,
        method: request.method,
        path,
        headers,
      },
      upstreamResponse => {
        response.writeHead(
          upstreamResponse.statusCode ?? 502,
          responseHeaders(upstreamResponse.headers),
        );
        upstreamResponse.pipe(response);
      },
    );

    proxyRequest.on("error", () => sendUpstreamError(response));
    request.on("aborted", () => proxyRequest.destroy());
    response.on("close", () => {
      if (!response.writableEnded) proxyRequest.destroy();
    });
    request.pipe(proxyRequest);
  });
}

export function gatewayPort(environment = process.env) {
  return Number(environment.PORT?.trim() || environment.GATEWAY_PORT?.trim() || 3000);
}

const entrypoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (entrypoint) {
  const gateway = createGateway();
  const port = gatewayPort();
  const hostname = process.env.HOSTNAME?.trim() || "127.0.0.1";

  gateway.listen(port, hostname, () => {
    process.stdout.write(`Travel Club gateway listening on http://${hostname}:${port}\n`);
  });
}
