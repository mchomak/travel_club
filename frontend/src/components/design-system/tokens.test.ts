import { describe, expect, it } from "vitest";
import { BASE_TOKENS, createPreviewVariables } from "./tokens";

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
    });
    expect(BASE_TOKENS.typography.h1.responsiveScale).toEqual({
      desktopMin: 44,
      desktopVw: 4.6,
      mobileVw: 10.4,
      mobileReferenceWidth: 390,
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
    expect(previewVariables["--tc-type-h1-mobile-resolved-size"]).toBe("10.4cqw");
  });
});
