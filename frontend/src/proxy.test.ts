import { expect, test } from "vitest";
import { NextRequest } from "next/server";
import { config, proxy } from "./proxy";

test("forwards the protected pathname and query as a request header", () => {
  const request = new NextRequest("http://localhost/research/new?from=%2Fhome&term=quiet%20places");
  request.headers.set("x-travel-club-return-to", "https://outside.example/forged");

  const response = proxy(request);

  expect(response.headers.get("x-middleware-request-x-travel-club-return-to"))
    .toBe("/research/new?from=%2Fhome&term=quiet%20places");
  expect(response.headers.get("x-middleware-override-headers"))
    .toContain("x-travel-club-return-to");
});

test("includes a trip detail id and query string in the protected return target", () => {
  const request = new NextRequest("http://localhost/admin/trips/trip-123?tab=itinerary&day=3");
  const response = proxy(request);

  expect(config.matcher).toContain("/admin/trips/:path*");
  expect(response.headers.get("x-middleware-request-x-travel-club-return-to"))
    .toBe("/admin/trips/trip-123?tab=itinerary&day=3");
});
