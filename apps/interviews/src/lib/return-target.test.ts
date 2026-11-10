import { describe, expect, it } from "vitest";
import { safeAuthReturnTarget } from "./return-target";

describe("Interview Platform authentication return path", () => {
  it("returns to research when no safe destination is supplied", () => {
    expect(safeAuthReturnTarget(undefined, "/research")).toBe("/research");
  });

  it("keeps a valid research destination and query", () => {
    expect(safeAuthReturnTarget("/research/123?tab=answers", "/research"))
      .toBe("/research/123?tab=answers");
  });

  it("rejects an external redirect and falls back to research", () => {
    expect(safeAuthReturnTarget("//example.org/path", "/research")).toBe("/research");
  });
});
