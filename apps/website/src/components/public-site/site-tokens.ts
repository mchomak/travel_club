import type { CSSProperties } from "react";

type TypeRole = "displayXL" | "displayL" | "h1" | "h2" | "h3" | "lead" | "body" | "bodySmall" | "metadata" | "caption" | "button";

type ApprovedTypeRole = {
  family: string;
  size: string;
  lineHeight: string;
  weight: string;
  tracking: string;
};

const colors = {
  cloud: "paper",
  ink: "ink",
  china: "china",
  thailand: "thailand",
  ocean: "blue",
  madagascar: "madagascar",
  tobacco: "madagascar",
  editorialPaper: "paper",
  editorialInk: "ink",
  brandBlue: "blue",
  muted: "editor-muted",
  line: "editor-border",
} as const;

const roles: Record<TypeRole, ApprovedTypeRole> = {
  displayXL: { family: "display", size: "display", lineHeight: "display", weight: "bold", tracking: "display" },
  displayL: { family: "display", size: "display", lineHeight: "display", weight: "semibold", tracking: "display" },
  h1: { family: "h1", size: "h1", lineHeight: "heading-one", weight: "semibold", tracking: "heading" },
  h2: { family: "h2", size: "h2", lineHeight: "heading-two", weight: "medium", tracking: "heading" },
  h3: { family: "h3", size: "h3", lineHeight: "heading-three", weight: "medium", tracking: "0em" },
  lead: { family: "subheading", size: "subheading", lineHeight: "standard", weight: "regular", tracking: "0em" },
  body: { family: "body", size: "body", lineHeight: "body", weight: "regular", tracking: "0em" },
  bodySmall: { family: "body", size: "body", lineHeight: "standard", weight: "regular", tracking: "0em" },
  metadata: { family: "metadata", size: "metadata", lineHeight: "standard", weight: "medium", tracking: "label" },
  caption: { family: "caption", size: "caption", lineHeight: "standard", weight: "regular", tracking: "0em" },
  button: { family: "cta", size: "cta", lineHeight: "cta", weight: "cta", tracking: "0em" },
};

const spacing = { xs: "1", s: "2", m: "4", l: "6", xl: "8", "2xl": "12" } as const;

const layout: Record<string, string | number> = {
  containerWidth: "var(--tc-container-max)",
  pagePadding: "var(--tc-container-gutter-mobile)",
  // Grid count and prose measure are composition values; the approved system has no matching tokens.
  columns: 12,
  columnGutter: "var(--tc-space-6)",
  sectionSpacing: "var(--tc-space-12)",
  blockSpacing: "var(--tc-space-10)",
  contentWidth: "var(--tc-container-max)",
  narrowTextWidth: "46ch",
  editorialGutter: "var(--tc-space-6)",
};

const frames = {
  hero: 2.1,
  landscape: 1.6,
  editorialLarge: 1.5,
  editorialSmall: 1.65,
  portrait: 0.82,
  square: 1,
} as const;

const cssKey = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** Bridge existing publication styles to the approved Website design tokens. */
export function createSiteVariables(): CSSProperties {
  const vars: Record<string, string | number> = {
    "--pub-font-sans": "var(--tc-font-sans)",
    "--pub-font-serif": "var(--tc-font-sans)",
    "--pub-font-editorial": "var(--tc-font-sans)",
  };

  Object.entries(colors).forEach(([name, role]) => {
    vars[`--pub-color-${cssKey(name)}`] = `var(--tc-${role})`;
  });
  Object.entries(spacing).forEach(([name, token]) => {
    vars[`--pub-space-${name}`] = `var(--tc-space-${token})`;
  });
  Object.entries(layout).forEach(([name, value]) => {
    vars[`--pub-layout-${cssKey(name)}`] = value;
  });
  Object.entries(frames).forEach(([name, ratio]) => {
    // Frame ratios preserve existing page composition; --tc-* has no image-ratio roles.
    vars[`--pub-frame-${cssKey(name)}-ratio`] = ratio;
  });

  (Object.keys(roles) as TypeRole[]).forEach((role) => {
    const token = roles[role];
    const prefix = `--pub-type-${role === "bodySmall" ? "small" : role === "metadata" ? "meta" : cssKey(role)}`;
    const size = `var(--tc-size-${token.size})`;
    vars[`${prefix}-fluid`] = size;
    vars[`${prefix}-size`] = size;
    vars[`${prefix}-mobile`] = size;
    vars[`${prefix}-family`] = `var(--tc-font-${token.family})`;
    vars[`${prefix}-line-height`] = token.lineHeight === "0em"
      ? token.lineHeight
      : `var(--tc-leading-${token.lineHeight})`;
    vars[`${prefix}-weight`] = token.weight === "cta" ? "var(--tc-weight-cta)" : `var(--tc-weight-${token.weight})`;
    vars[`${prefix}-tracking`] = token.tracking.startsWith("0")
      ? token.tracking
      : `var(--tc-tracking-${token.tracking})`;
  });

  return vars as CSSProperties;
}
