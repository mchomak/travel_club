import { beforeEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { AUTH_RETURN_TO_HEADER } from "./lib/return-target";

const { cookies, headers, redirect } = vi.hoisted(() => ({
  cookies: vi.fn(async () => ({ get: () => undefined as { value: string } | undefined })),
  headers: vi.fn(async () => new Headers()),
  redirect: vi.fn((destination: string): never => { throw new Error(`REDIRECT:${destination}`); }),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies, headers }));
vi.mock("next/navigation", () => ({ redirect }));

import { config, proxy } from "./proxy";
import { requireAdmin } from "./lib/server-auth";

beforeEach(() => {
  vi.clearAllMocks();
  cookies.mockResolvedValue({ get: () => undefined });
  headers.mockResolvedValue(new Headers());
});

test.each([
  { deployment: "standalone", origin: "http://127.0.0.1:3102" },
  { deployment: "gateway", origin: "https://travel-club.example" },
])("preserves a deep research URL and query through the unauthenticated redirect ($deployment)", async ({ origin }) => {
  const target = "/research/respondent-42?tab=answers&search=quiet%20places";
  const request = new NextRequest(new URL(target, origin), {
    headers: { [AUTH_RETURN_TO_HEADER]: "https://outside.example/forged" },
  });
  const response = proxy(request);
  const forwardedTarget = response.headers.get(`x-middleware-request-${AUTH_RETURN_TO_HEADER}`);

  expect(config.matcher).toContain("/research/:path*");
  expect(forwardedTarget).toBe(target);

  headers.mockResolvedValue(new Headers({ [AUTH_RETURN_TO_HEADER]: forwardedTarget ?? "" }));
  await expect(requireAdmin()).rejects.toThrow(
    `REDIRECT:/admin/login?next=${encodeURIComponent(target)}`,
  );
});
