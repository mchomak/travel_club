import { describe, expect, it } from "vitest";
import config from "../../next.config";

describe("private page response headers", () => {
  it("prevents private page URLs from becoming referrers", async () => {
    const headers = await config.headers!();
    for (const source of ["/start", "/thanks"]) {
      expect(headers.find(rule => rule.source === source)?.headers).toContainEqual({ key: "Referrer-Policy", value: "no-referrer" });
    }
  });
});
