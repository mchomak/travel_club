import { describe, expect, it } from "vitest";
import { colorKeys, defaultTheme, foregroundFor, hexToHsv, hsvToHex, normalizeHex, restoreTheme, wheelMarkerPositions } from "./theme";

describe("theme colors", () => {
  it("maps color wheel coordinates to a predictable hex value", () => {
    expect(hexToHsv("#FF0000")).toEqual({ h: 0, s: 1, v: 1 });
    expect(hsvToHex(180, 1, 1)).toBe("#00FFFF");
    expect(hsvToHex(0, 0, 0.5)).toBe("#808080");
  });

  it("accepts hex edits and ignores malformed saved values", () => {
    expect(normalizeHex("e8a95d")).toBe("#E8A95D");
    expect(normalizeHex("#12")).toBeNull();
    expect(restoreTheme({ colors: { primary: "#AB12CD", text: "oops" }, headingFont: "unknown" })).toEqual({
      ...defaultTheme,
      colors: { ...defaultTheme.colors, primary: "#AB12CD" },
    });
  });

  it("keeps button text legible on light and dark colors", () => {
    expect(foregroundFor("#FFFFFF")).toBe("#17312F");
    expect(foregroundFor("#123456")).toBe("#FFFFFF");
    expect(foregroundFor("#999999")).toBe("#17312F");
  });

  it("shows distinct dots for near-white palette colors", () => {
    const points = wheelMarkerPositions(defaultTheme.colors);
    for (const a of colorKeys) {
      for (const b of colorKeys) {
        if (a === b) continue;
        expect(Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y)).toBeGreaterThanOrEqual(6.9);
      }
    }
  });
});
