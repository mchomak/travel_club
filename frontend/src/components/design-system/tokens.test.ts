import { describe, expect, it } from "vitest";
import { BASE_TOKENS, clearDraft, createPreviewVariables, readDraft, writeDraft } from "./tokens";

const DRAFT_V2_KEY = "travel-club.design-system.draft.v2";
const DRAFT_V3_KEY = "travel-club.design-system.draft.v3";

describe("Playground base tokens", () => {
  it("starts with all editorial roles and source colors", () => {
    expect(Object.keys(BASE_TOKENS.typography)).toEqual([
      "displayXL", "displayL", "h1", "h2", "h3", "lead", "body", "bodySmall", "metadata", "caption", "button",
    ]);
    expect(BASE_TOKENS.colors).toMatchObject({
      cloud: "#F2F0EA",
      ink: "#171717",
      china: "#163A5F",
      thailand: "#27493B",
      ocean: "#627F92",
      madagascar: "#7D3027",
      tobacco: "#7C5A3B",
      editorialPaper: "#f3f2ee",
      editorialInk: "#20211f",
      brandBlue: "#172f50",
      muted: "#595b57",
      line: "#c2c4bd",
    });
    expect(BASE_TOKENS.typography.body).toMatchObject({ family: "TC Golos", desktopSize: 17, mobileSize: 16, lineHeight: 1.55 });
    expect(BASE_TOKENS.typography.metadata).toMatchObject({ desktopSize: 10, mobileSize: 12, weight: 500, letterSpacing: 0.08 });
  });

  it("preserves responsive type scale metadata at the public token and preview boundary", () => {
    expect(BASE_TOKENS.typography.displayXL.responsiveScale).toEqual({
      desktopMin: 60,
      desktopVw: 12.7,
      mobileVw: 12.2,
      mobileReferenceWidth: 390,
    });
    expect(BASE_TOKENS.typography.displayL.responsiveScale).toEqual({
      desktopMin: 72,
      desktopVw: 10.7,
      mobileVw: 10.8,
      mobileReferenceWidth: 390,
      mobileMin: 38,
      mobileMax: 76,
      mobileBelow360Vw: 10.4,
    });
    expect(BASE_TOKENS.typography.h1.responsiveScale).toEqual({
      desktopMin: 44,
      desktopVw: 4.6,
      mobileVw: 10.4,
      mobileReferenceWidth: 390,
      mobileMin: 35,
      mobileMax: 58,
    });

    const previewVariables = createPreviewVariables({
      tokens: BASE_TOKENS,
      theme: "tc",
      viewport: "desktop",
      showGrid: false,
    }) as Record<string, string | number | undefined>;
    expect(previewVariables["--tc-type-display-xl-desktop-resolved-size"]).toBe("clamp(60px, 12.7cqw, 194px)");
    expect(previewVariables["--tc-type-display-xl-mobile-resolved-size"]).toBe("12.2cqw");
    expect(previewVariables["--tc-type-h1-desktop-resolved-size"]).toBe("clamp(44px, 4.6cqw, 70px)");
    expect(previewVariables["--tc-type-h1-mobile-resolved-size"]).toBe("clamp(35px, 10.4cqw, 58px)");
  });

  it("keeps source mobile clamp bounds and the below-360 DISPLAY L rule in scoped preview variables", () => {
    expect(BASE_TOKENS.typography.displayL.responsiveScale).toMatchObject({
      mobileVw: 10.8,
      mobileReferenceWidth: 390,
      mobileMin: 38,
      mobileMax: 76,
      mobileBelow360Vw: 10.4,
    });
    expect(BASE_TOKENS.typography.h1.responsiveScale).toMatchObject({ mobileMin: 35, mobileMax: 58 });

    const variables = createPreviewVariables({
      tokens: BASE_TOKENS,
      theme: "tc",
      viewport: "mobile",
      showGrid: false,
    }) as Record<string, string | number | undefined>;
    expect(variables["--tc-type-display-l-mobile-resolved-size"]).toBe("clamp(38px, 10.8cqw, 76px)");
    expect(variables["--tc-type-display-l-mobile-below-360-resolved-size"]).toBe("10.4cqw");
    expect(variables["--tc-type-h1-mobile-resolved-size"]).toBe("clamp(35px, 10.4cqw, 58px)");
  });

  it("migrates v2 browser drafts while preserving user edits and restoring missing responsive defaults", () => {
    window.localStorage.clear();
    const tokens = structuredClone(BASE_TOKENS);
    tokens.colors.cloud = "#aabbcc";
    tokens.spacing.s = 19;
    tokens.layout.containerWidth = 1280;
    tokens.frames.hero.aspectRatio = 1.8;
    tokens.typography.displayL.desktopSize = 126;
    tokens.typography.displayL.mobileSize = 51;
    tokens.typography.displayL.responsiveScale = {
      desktopMin: 72,
      desktopVw: 10.7,
      mobileVw: 11.2,
      mobileReferenceWidth: 390,
    };
    tokens.typography.h1.desktopSize = 82;
    tokens.typography.h1.mobileSize = 47;
    tokens.typography.h1.responsiveScale = {
      desktopMin: 46,
      desktopVw: 4.8,
      mobileVw: 9.9,
      mobileReferenceWidth: 390,
    };

    const legacyState = { tokens, theme: "china", viewport: "mobile", showGrid: true };
    window.localStorage.setItem(DRAFT_V2_KEY, JSON.stringify({ version: 2, state: legacyState }));

    const migrated = readDraft();

    expect(migrated).not.toBeNull();
    expect(migrated).toMatchObject({
      theme: "china",
      viewport: "mobile",
      showGrid: true,
      tokens: {
        colors: { cloud: "#aabbcc" },
        spacing: { s: 19 },
        layout: { containerWidth: 1280 },
        frames: { hero: { aspectRatio: 1.8 } },
        typography: {
          displayL: {
            desktopSize: 126,
            mobileSize: 51,
            responsiveScale: {
              desktopMin: 72,
              desktopVw: 10.7,
              mobileVw: 11.2,
              mobileReferenceWidth: 390,
              mobileMin: 38,
              mobileMax: 76,
              mobileBelow360Vw: 10.4,
            },
          },
          h1: {
            desktopSize: 82,
            mobileSize: 47,
            responsiveScale: {
              desktopMin: 46,
              desktopVw: 4.8,
              mobileVw: 9.9,
              mobileReferenceWidth: 390,
              mobileMin: 35,
              mobileMax: 58,
            },
          },
        },
      },
    });

    const upgradedEnvelope = JSON.parse(window.localStorage.getItem(DRAFT_V3_KEY) ?? "null") as { version: number; state: unknown } | null;
    expect(upgradedEnvelope?.version).toBe(3);
    expect(upgradedEnvelope?.state).toEqual(migrated);
    expect(window.localStorage.getItem(DRAFT_V2_KEY)).toBeNull();
  });

  it("writes current v3 drafts and clears both current and legacy keys", () => {
    window.localStorage.clear();
    const state = { tokens: structuredClone(BASE_TOKENS), theme: "tc", viewport: "desktop", showGrid: false } as const;
    window.localStorage.setItem(DRAFT_V2_KEY, JSON.stringify({ version: 2, state }));

    writeDraft(state);
    expect(JSON.parse(window.localStorage.getItem(DRAFT_V3_KEY) ?? "null").version).toBe(3);
    expect(window.localStorage.getItem(DRAFT_V2_KEY)).toBeNull();

    window.localStorage.setItem(DRAFT_V2_KEY, JSON.stringify({ version: 2, state }));
    clearDraft();
    expect(window.localStorage.getItem(DRAFT_V3_KEY)).toBeNull();
    expect(window.localStorage.getItem(DRAFT_V2_KEY)).toBeNull();
  });
});
