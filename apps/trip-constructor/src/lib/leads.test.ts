import { afterEach, expect, test, vi } from "vitest";
const { requireAdmin } = vi.hoisted(() => ({ requireAdmin: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/server-auth", () => ({ requireAdmin }));
import { leadsRequest } from "./leads";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.clearAllMocks(); });
test("every read and update checks the admin session before contacting Website", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch); vi.stubEnv("WEBSITE_ADMIN_SECRET", "s".repeat(48));
  requireAdmin.mockRejectedValue(new Error("not authenticated"));
  await expect(leadsRequest("")).rejects.toThrow("not authenticated");
  await expect(leadsRequest("/some-id", { method: "PATCH" })).rejects.toThrow("not authenticated");
  expect(requireAdmin).toHaveBeenCalledTimes(2); expect(fetch).not.toHaveBeenCalled();
});
test("an authenticated request refuses a missing or short service secret", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch); vi.stubEnv("WEBSITE_ADMIN_SECRET", "short");
  requireAdmin.mockResolvedValue({});
  await expect(leadsRequest("")).rejects.toThrow(); expect(fetch).not.toHaveBeenCalled();
});
