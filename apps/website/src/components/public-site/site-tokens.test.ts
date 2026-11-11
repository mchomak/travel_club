import { describe, expect, it } from "vitest";
import { createSiteVariables } from "./site-tokens";

describe("Website token adapter", () => {
  const variables = createSiteVariables() as Record<string, string>;

  it("aliases publication colors to the approved Website palette", () => {
    expect(variables["--pub-color-cloud"]).toBe("var(--tc-paper)");
    expect(variables["--pub-color-ink"]).toBe("var(--tc-ink)");
    expect(variables["--pub-color-brand-blue"]).toBe("var(--tc-blue)");
    expect(variables["--pub-color-madagascar"]).toBe("var(--tc-madagascar)");
  });

  it("aliases type and spacing roles to approved responsive Website tokens", () => {
    expect(variables["--pub-font-sans"]).toBe("var(--tc-font-sans)");
    expect(variables["--pub-type-h1-size"]).toBe("var(--tc-size-h1)");
    expect(variables["--pub-type-h1-fluid"]).toBe("var(--tc-size-h1)");
    expect(variables["--pub-type-body-family"]).toBe("var(--tc-font-body)");
    expect(variables["--pub-type-meta-size"]).toBe("var(--tc-size-metadata)");
    expect(variables["--pub-space-xl"]).toBe("var(--tc-space-8)");
    expect(variables["--pub-layout-column-gutter"]).toBe("var(--tc-space-6)");
  });
});
