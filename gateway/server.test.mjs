import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import http from "node:http";
import { afterEach, test } from "node:test";

import { createGateway } from "./server.mjs";

const upstreams = [];
const gateways = [];

test("env example explicitly allows the exact local gateway and app origins", async () => {
  const template = await readFile(new URL("../.env.example", import.meta.url), "utf8");
  const setting = template
    .split(/\r?\n/)
    .find(line => line.startsWith("ADDITIONAL_ALLOWED_ORIGINS="));

  assert.ok(setting, "ADDITIONAL_ALLOWED_ORIGINS is present in .env.example");
  assert.deepEqual(setting.slice(setting.indexOf("=") + 1).split(","), [
    "http://localhost:3300",
    "http://127.0.0.1:3300",
    "http://localhost:3101",
    "http://127.0.0.1:3101",
    "http://localhost:3102",
    "http://127.0.0.1:3102",
  ]);
});

afterEach(async () => {
  await Promise.all([...gateways, ...upstreams].map(closeServer));
  gateways.length = 0;
  upstreams.length = 0;
});

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

function closeServer(server) {
  if (!server.listening) return Promise.resolve();
  return new Promise((resolve, reject) => {
    server.close(error => (error ? reject(error) : resolve()));
  });
}

async function fixture() {
  const received = [];
  const upstreamUrls = {};

  for (const name of ["website", "constructor", "interviews", "backend"]) {
    const server = http.createServer((req, res) => {
      const chunks = [];
      req.on("data", chunk => chunks.push(chunk));
      req.on("end", () => {
        const entry = {
          app: name,
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: Buffer.concat(chunks).toString(),
        };
        received.push(entry);
        if (name === "backend" && req.url?.startsWith("/api/auth/login")) {
          res.writeHead(303, {
            "Content-Type": "text/plain",
            Location: "/research/respondents?from=login",
            "Set-Cookie": [
              "travel_session=opaque; Path=/; HttpOnly; SameSite=Lax",
              "consent=accepted; Path=/; SameSite=Lax",
            ],
          });
          res.end("login redirect");
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ app: name, url: req.url }));
      });
    });
    upstreams.push(server);
    upstreamUrls[name] = await listen(server);
  }

  const gateway = createGateway({ upstreams: upstreamUrls });
  gateways.push(gateway);
  const gatewayUrl = await listen(gateway);
  return { gatewayUrl, received };
}

function request(origin, path, options = {}) {
  const target = new URL(path, origin);
  return new Promise((resolve, reject) => {
    const req = http.request(target, options, res => {
      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks).toString(),
      }));
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

test("creates the gateway with default local upstreams", () => {
  assert.ok(createGateway());
});

test("routes research URLs, including their query string, to Interviews", async () => {
  const { gatewayUrl, received } = await fixture();

  const response = await request(gatewayUrl, "/research/respondents?q=tokyo%20trip&page=2");

  assert.equal(response.statusCode, 200);
  assert.deepEqual(received.map(({ app, url }) => ({ app, url })), [
    { app: "interviews", url: "/research/respondents?q=tokyo%20trip&page=2" },
  ]);
});

test("routes product pages, API, and namespaced Next assets to their owners", async () => {
  const { gatewayUrl, received } = await fixture();
  const cases = [
    ["/admin/login?next=%2Fresearch", "constructor"],
    ["/home", "constructor"],
    ["/api/trips?limit=10", "backend"],
    ["/_app/website/_next/image?url=%2Fhero.jpg&w=1920&q=75", "website"],
    ["/_app/website/_next/static/chunks/app.js", "website"],
    ["/_app/constructor/_next/static/chunks/app.js", "constructor"],
    ["/_app/interviews/_next/static/chunks/app.js", "interviews"],
    ["/researching", "website"],
    ["/administrator", "website"],
    ["/apian", "website"],
    ["/formats?source=constructor", "website"],
  ];

  for (const [path, app] of cases) {
    const response = await request(gatewayUrl, path);
    assert.equal(response.statusCode, 200, path);
    assert.equal(JSON.parse(response.body).app, app, path);
  }

  assert.deepEqual(received.map(({ app }) => app), cases.map(([, app]) => app));
  assert.equal(received[3].url, cases[3][0]);
});

test("preserves API method, request metadata, body, redirects, and host-only cookies", async () => {
  const { gatewayUrl, received } = await fixture();
  const response = await request(gatewayUrl, "/api/auth/login?continue=%2Fresearch", {
    method: "POST",
    headers: {
      host: "travel.example.test:8443",
      origin: "https://travel.example.test:8443",
      cookie: "travel_session=old-token; preference=compact",
      "x-requested-with": "TravelClub",
      "content-type": "application/json",
    },
    body: '{"login":"fixture","password":"opaque"}',
  });

  assert.equal(response.statusCode, 303);
  assert.equal(response.headers.location, "/research/respondents?from=login");
  assert.deepEqual(response.headers["set-cookie"], [
    "travel_session=opaque; Path=/; HttpOnly; SameSite=Lax",
    "consent=accepted; Path=/; SameSite=Lax",
  ]);
  assert.equal(response.body, "login redirect");
  assert.equal(received[0].app, "backend");
  assert.equal(received[0].method, "POST");
  assert.equal(received[0].url, "/api/auth/login?continue=%2Fresearch");
  assert.equal(received[0].headers.host, "travel.example.test:8443");
  assert.equal(received[0].headers.origin, "https://travel.example.test:8443");
  assert.equal(received[0].headers.cookie, "travel_session=old-token; preference=compact");
  assert.equal(received[0].headers["x-requested-with"], "TravelClub");
  assert.equal(received[0].body, '{"login":"fixture","password":"opaque"}');
});
