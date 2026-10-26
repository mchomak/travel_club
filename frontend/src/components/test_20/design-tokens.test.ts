import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_DESIGN, DESIGN_STORAGE_KEY, PALETTE_PRESETS, createDesignVariables, normalizeHex, parseDesignDraft, readDesignDraft,
  saveDesignDraft, sectionColorValue,
} from "./design-tokens";

afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

describe("test_20 design configuration boundary", () => {
  it("keeps the approved Next Issue red in every overall palette", () => {
    expect(PALETTE_PRESETS).toHaveLength(3);
    for (const preset of PALETTE_PRESETS) {
      expect(preset.colors.red).toBe("#B93625");
      expect(parseDesignDraft(JSON.stringify({ ...DEFAULT_DESIGN, colors: preset.colors }))).not.toBeNull();
    }
  });

  it("uses readable white for small Next Issue text while keeping cream display titles", () => {
    const variables = createDesignVariables() as Record<string, string>;
    expect(variables["--tc-next-heading"]).toBe("var(--tc-paper)");
    for (const field of ["text", "accent", "line", "button", "link"] as const) {
      expect(variables[`--tc-next-${field}`]).toBe("#FFFFFF");
      expect(sectionColorValue(DEFAULT_DESIGN, "next", field)).toBe("#FFFFFF");
    }
    const custom = structuredClone(DEFAULT_DESIGN);
    custom.sections.next = { text: "#123456" };
    expect((createDesignVariables(custom) as Record<string, string>)["--tc-next-text"]).toBe("#123456");
  });
  it("round-trips a customized palette, role and section override", () => {
    const custom = structuredClone(DEFAULT_DESIGN);
    custom.typography.body = { family: "TC Lora", desktop: 21, mobile: 18 };
    custom.colors.paper = "#f5f0dc";
    custom.sections.formats = { heading: "#123456" };
    expect(saveDesignDraft(custom)).toBe(true);
    const loaded = readDesignDraft();
    expect(loaded.typography.body).toEqual(custom.typography.body);
    expect(loaded.colors.paper).toBe("#F5F0DC");
    expect(loaded.sections.formats).toEqual({ heading: "#123456" });
    expect(localStorage.getItem(DESIGN_STORAGE_KEY)).not.toBeNull();
  });

  it("rejects malformed, version-incompatible, injected, and out-of-range drafts", () => {
    expect(parseDesignDraft("not JSON")).toBeNull();
    expect(parseDesignDraft(JSON.stringify({ ...DEFAULT_DESIGN, version: 2 }))).toBeNull();
    expect(parseDesignDraft(JSON.stringify({ ...DEFAULT_DESIGN, colors: { ...DEFAULT_DESIGN.colors, paper: "red;position:fixed" } }))).toBeNull();
    expect(parseDesignDraft(JSON.stringify({ ...DEFAULT_DESIGN, sections: { hero: { bg: "url(https://example.com)" } } }))).toBeNull();
    const draft = structuredClone(DEFAULT_DESIGN);
    draft.typography.body.desktop = 500;
    expect(parseDesignDraft(JSON.stringify(draft))).toBeNull();
    draft.typography.body.desktop = 16;
    draft.typography.body.mobile = 0;
    expect(parseDesignDraft(JSON.stringify(draft))).toBeNull();
    expect(parseDesignDraft(JSON.stringify({ ...DEFAULT_DESIGN, typography: { ...DEFAULT_DESIGN.typography, body: { family: "injected-font", desktop: 16, mobile: 16 } } }))).toBeNull();
    expect(normalizeHex("#12" )).toBeNull();
  });

  it("falls back safely when storage is malformed or denied", () => {
    localStorage.setItem(DESIGN_STORAGE_KEY, '{"version":1}');
    expect(readDesignDraft()).toBe(DEFAULT_DESIGN);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(readDesignDraft()).toBe(DEFAULT_DESIGN);
    expect(saveDesignDraft(DEFAULT_DESIGN)).toBe(false);
  });

  it("keeps inherited section colors linked to globals, honoring explicit overrides", () => {
    const custom = structuredClone(DEFAULT_DESIGN);
    custom.colors.paper = "#FFFEEE";
    custom.sections.formats = { heading: "#123456" };
    const variables = createDesignVariables(custom) as Record<string, string>;
    expect(variables["--tc-formats-bg"]).toBe("var(--tc-paper)");
    expect(variables["--tc-paper"]).toBe("#FFFEEE");
    expect(variables["--tc-formats-heading"]).toBe("#123456");
    expect(sectionColorValue(custom, "formats", "bg")).toBe("#FFFEEE");
    expect(variables["--tc-next-bg"]).toBe("var(--tc-red)");
    expect(variables["--tc-font-body"]).toContain('"TC Golos"');
    custom.typography.body = { family: "TC Lora", desktop: 20, mobile: 20 };
    expect((createDesignVariables(custom) as Record<string, string>)["--tc-size-body"]).toBe("1.25rem");
  });
});
