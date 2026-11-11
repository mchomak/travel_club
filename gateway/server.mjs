import http from "node:http";
import https from "node:https";
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

export function createGateway({ upstreams = {} } = {}) {
  const configuredUpstreams = {};
  const definitions = [
    ["website", "WEBSITE_UPSTREAM", "http://127.0.0.1:3100"],
    ["constructor", "CONSTRUCTOR_UPSTREAM", "http://127.0.0.1:3101"],
    ["interviews", "INTERVIEWS_UPSTREAM", "http://127.0.0.1:3102"],
    ["backend", "BACKEND_UPSTREAM", "http://127.0.0.1:8000"],
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

    const target = targets[appForPath(new URL(path, "http://gateway.invalid").pathname)];
    const transport = target.protocol === "https:" ? https : http;
    const proxyRequest = transport.request(
      {
        hostname: target.hostname,
        port: target.port || undefined,
        method: request.method,
        path,
        headers: requestHeaders(request.headers),
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

const entrypoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (entrypoint) {
  const gateway = createGateway();
  const port = Number(process.env.PORT?.trim() || process.env.GATEWAY_PORT?.trim() || 3300);
  const hostname = process.env.HOSTNAME?.trim() || "127.0.0.1";

  gateway.listen(port, hostname, () => {
    process.stdout.write(`Travel Club gateway listening on http://${hostname}:${port}\n`);
  });
}
