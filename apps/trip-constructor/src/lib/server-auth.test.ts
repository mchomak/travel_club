import { afterEach, beforeEach, expect, test, vi } from "vitest";

const { cookies, headers, redirect } = vi.hoisted(() => ({
  cookies: vi.fn(async () => ({ get: () => undefined as { value: string } | undefined })),
  headers: vi.fn(async () => new Headers()),
  redirect: vi.fn((destination: string): never => { throw new Error(`REDIRECT:${destination}`); }),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies, headers }));
vi.mock("next/navigation", () => ({ redirect }));

import { requireAdmin } from "./server-auth";

beforeEach(() => {
  vi.clearAllMocks();
  cookies.mockResolvedValue({ get: () => undefined });
  headers.mockResolvedValue(new Headers({ "x-travel-club-return-to": "/research/new?source=home" }));
});
afterEach(() => vi.unstubAllGlobals());

test("missing session sends the requested route and query to login", async () => {
  await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login?next=%2Fresearch%2Fnew%3Fsource%3Dhome");
});

test("expired session sends the requested route and query to login", async () => {
  cookies.mockResolvedValue({ get: () => ({ value: "expired-session" }) });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 401, ok: false }));

  await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login?next=%2Fresearch%2Fnew%3Fsource%3Dhome");
});
