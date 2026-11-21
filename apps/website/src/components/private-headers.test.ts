import { describe, expect, it } from "vitest";
import config from "../../next.config";

describe("private page response headers", () => {
  it("prevents private page URLs from becoming referrers", async () => {
    const headers = await config.headers!();
    for (const source of ["/start", "/thanks", "/trip/:path*"]) {
      expect(headers.find(rule => rule.source === source)?.headers).toContainEqual({ key: "Referrer-Policy", value: "no-referrer" });
    }
  });

  it("prevents indexing and caching capability URLs, including invalid paths", async () => {
    const rule = (await config.headers!()).find(rule => rule.source === "/trip/:path*");
    expect(rule?.headers).toEqual(expect.arrayContaining([
      { key: "Cache-Control", value: "private, no-store" },
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
    ]));
  });
});
