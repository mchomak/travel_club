import type { CSSProperties } from "react";

export type FontFamily = "TC Golos" | "TC Lora";
export type TypeRole = "displayXL" | "displayL" | "h1" | "h2" | "h3" | "lead" | "body" | "bodySmall" | "metadata" | "caption" | "button";
export type SpacingToken = "xs" | "s" | "m" | "l" | "xl" | "2xl";
export type ColorToken = "cloud" | "ink" | "china" | "thailand" | "ocean" | "madagascar" | "tobacco" | "editorialPaper" | "editorialInk" | "brandBlue" | "muted" | "line";
export type FrameRole = "hero" | "landscape" | "editorialLarge" | "editorialSmall" | "portrait" | "square";
export type DestinationTheme = "tc" | "china" | "thailand" | "madagascar";
export type ViewportPreset = "desktop" | "tablet" | "mobile";
export type HexColor = `#${string}`;
export type FrameToken = { aspectRatio: number; src: string; alt: string };
export type LayoutTokens = {
  containerWidth: number;
  pagePadding: number;
  columns: number;
  columnGutter: number;
  sectionSpacing: number;
  blockSpacing: number;
  contentWidth: number;
  narrowTextWidth: number;
  editorialGutter: number;
};
export type ResponsiveTypeScale = { desktopMin?: number; desktopVw?: number; mobileVw?: number; mobileReferenceWidth?: number };
export type TypographyRole = {
  family: FontFamily;
  desktopSize: number;
  mobileSize: number;
  responsiveScale?: ResponsiveTypeScale;
  lineHeight: number;
  weight: number;
  letterSpacing: number;
};
export type PlaygroundTokens = {
  colors: Record<ColorToken, HexColor>;
  typography: Record<TypeRole, TypographyRole>;
  spacing: Record<SpacingToken, number>;
  layout: LayoutTokens;
  frames: Record<FrameRole, FrameToken>;
};
export type PlaygroundState = {
  tokens: PlaygroundTokens;
  theme: DestinationTheme;
  viewport: ViewportPreset;
  showGrid: boolean;
};

const baseTokens = {
  colors: {
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
  },
  typography: {
    displayXL: { family: "TC Golos", desktopSize: 194, mobileSize: 48, responsiveScale: { desktopMin: 60, desktopVw: 12.7, mobileVw: 12.2, mobileReferenceWidth: 390 }, lineHeight: 1.02, weight: 700, letterSpacing: -0.04 },
    displayL: { family: "TC Golos", desktopSize: 154, mobileSize: 42, responsiveScale: { desktopMin: 72, desktopVw: 10.7, mobileVw: 10.8, mobileReferenceWidth: 390 }, lineHeight: 1, weight: 600, letterSpacing: -0.04 },
    h1: { family: "TC Golos", desktopSize: 70, mobileSize: 41, responsiveScale: { desktopMin: 44, desktopVw: 4.6, mobileVw: 10.4, mobileReferenceWidth: 390 }, lineHeight: 1.05, weight: 600, letterSpacing: -0.04 },
    h2: { family: "TC Golos", desktopSize: 36, mobileSize: 31, lineHeight: 1.15, weight: 500, letterSpacing: -0.035 },
    h3: { family: "TC Lora", desktopSize: 25, mobileSize: 26, lineHeight: 1.3, weight: 500, letterSpacing: 0 },
    lead: { family: "TC Golos", desktopSize: 18, mobileSize: 15, lineHeight: 1.5, weight: 400, letterSpacing: 0 },
    body: { family: "TC Golos", desktopSize: 17, mobileSize: 16, lineHeight: 1.55, weight: 400, letterSpacing: 0 },
    bodySmall: { family: "TC Golos", desktopSize: 17, mobileSize: 14, lineHeight: 1.5, weight: 400, letterSpacing: 0 },
    metadata: { family: "TC Golos", desktopSize: 10, mobileSize: 12, lineHeight: 1.5, weight: 500, letterSpacing: 0.08 },
    caption: { family: "TC Golos", desktopSize: 14, mobileSize: 12, lineHeight: 1.5, weight: 400, letterSpacing: 0 },
    button: { family: "TC Golos", desktopSize: 15, mobileSize: 15, lineHeight: 1, weight: 500, letterSpacing: 0 },
  },
  spacing: { xs: 4, s: 8, m: 16, l: 24, xl: 32, "2xl": 48 },
  layout: {
    containerWidth: 1440,
    pagePadding: 40,
    columns: 12,
    columnGutter: 24,
    sectionSpacing: 46,
    blockSpacing: 42,
    contentWidth: 1160,
    narrowTextWidth: 440,
    editorialGutter: 24,
  },
  frames: {
    hero: { aspectRatio: 2.1, src: "/test/hero-table.jpg", alt: "Друзья за общим столом в стамбульском ресторане" },
    landscape: { aspectRatio: 1.6, src: "/test_2/istanbul-tea-kubra.jpg", alt: "Турецкий чай на деревянном столе стамбульского кафе" },
    editorialLarge: { aspectRatio: 1.5, src: "/test_4/bangkok-night.jpg", alt: "Вечерняя улица Бангкока" },
    editorialSmall: { aspectRatio: 1.65, src: "/test_4/thailand-boat.jpg", alt: "Лодка у острова в Таиланде" },
    portrait: { aspectRatio: 0.82, src: "/test_4/beijing-hutong.jpg", alt: "Улица старого Пекина" },
    square: { aspectRatio: 1, src: "/test_4/madagascar-lemur.jpg", alt: "Лемур среди зелени на Мадагаскаре" },
  },
} satisfies PlaygroundTokens;

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach(freezeDeep);
  }
  return value;
}

export const BASE_TOKENS: PlaygroundTokens = freezeDeep(baseTokens);

const colorNames = Object.keys(BASE_TOKENS.colors) as ColorToken[];
const typeRoles = Object.keys(BASE_TOKENS.typography) as TypeRole[];
const spacingNames = Object.keys(BASE_TOKENS.spacing) as SpacingToken[];
const frameRoles = Object.keys(BASE_TOKENS.frames) as FrameRole[];
const DRAFT_STORAGE_KEY = "travel-club.design-system.draft.v2";
const DRAFT_VERSION = 2;
const destinationColor: Record<DestinationTheme, ColorToken> = {
  tc: "brandBlue",
  china: "china",
  thailand: "thailand",
  madagascar: "madagascar",
};

function cssKey(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function typographySizeExpression(token: TypographyRole, mode: "desktop" | "mobile"): string {
  const responsiveScale = token.responsiveScale;
  if (mode === "desktop" && responsiveScale?.desktopVw !== undefined) {
    return `clamp(${responsiveScale.desktopMin ?? 0}px, ${responsiveScale.desktopVw}cqw, ${token.desktopSize}px)`;
  }
  if (mode === "mobile" && responsiveScale?.mobileVw !== undefined) {
    return `${responsiveScale.mobileVw}cqw`;
  }
  return `${mode === "mobile" ? token.mobileSize : token.desktopSize}px`;
}

export function createPreviewVariables(state: PlaygroundState): CSSProperties {
  const variables: Record<string, string | number> = {};

  colorNames.forEach((name) => {
    variables[`--tc-color-${cssKey(name)}`] = state.tokens.colors[name];
  });
  typeRoles.forEach((role) => {
    const token = state.tokens.typography[role];
    const prefix = `--tc-type-${cssKey(role)}`;
    variables[`${prefix}-family`] = token.family === "TC Golos" ? '"TC Golos Preview"' : '"TC Lora Preview"';
    variables[`${prefix}-desktop-size`] = token.desktopSize;
    variables[`${prefix}-mobile-size`] = token.mobileSize;
    variables[`${prefix}-desktop-resolved-size`] = typographySizeExpression(token, "desktop");
    variables[`${prefix}-mobile-resolved-size`] = typographySizeExpression(token, "mobile");
    variables[`${prefix}-line-height`] = token.lineHeight;
    variables[`${prefix}-weight`] = token.weight;
    variables[`${prefix}-letter-spacing`] = `${token.letterSpacing}em`;
  });
  spacingNames.forEach((name) => {
    variables[`--tc-space-${name}`] = `${state.tokens.spacing[name]}px`;
  });
  Object.entries(state.tokens.layout).forEach(([name, value]) => {
    variables[`--tc-layout-${cssKey(name)}`] = `${value}px`;
  });
  frameRoles.forEach((role) => {
    variables[`--tc-frame-${cssKey(role)}-ratio`] = state.tokens.frames[role].aspectRatio;
  });
  variables["--tc-theme-accent"] = state.tokens.colors[destinationColor[state.theme]];
  variables["--tc-show-grid"] = state.showGrid ? 1 : 0;
  return variables as CSSProperties;
}

export function createCssExport(state: PlaygroundState): string {
  const variables = createPreviewVariables(state) as Record<string, string | number | undefined>;
  const declarations = Object.entries(variables)
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
    .map(([name, value]) => `  ${name}: ${value};`);
  return `:root {\n${declarations.join("\n")}\n}`;
}

export function createJsonExport(state: PlaygroundState): string {
  return JSON.stringify(state, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function isBoundedNumber(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function isResponsiveTypeScale(value: unknown): value is ResponsiveTypeScale {
  if (!isRecord(value) || Object.keys(value).length === 0
    || !Object.keys(value).every((key) => ["desktopMin", "desktopVw", "mobileVw", "mobileReferenceWidth"].includes(key))) return false;
  if (value.desktopMin !== undefined && !isBoundedNumber(value.desktopMin, 0, 500)) return false;
  if (value.desktopVw !== undefined && !isBoundedNumber(value.desktopVw, 0.1, 100)) return false;
  if (value.mobileVw !== undefined && !isBoundedNumber(value.mobileVw, 0.1, 100)) return false;
  if (value.mobileReferenceWidth !== undefined && !isBoundedNumber(value.mobileReferenceWidth, 1, 2000)) return false;
  return true;
}

function isPlaygroundTokens(value: unknown): value is PlaygroundTokens {
  if (!isRecord(value)) return false;
  const colors = value.colors;
  const typography = value.typography;
  const spacing = value.spacing;
  const layout = value.layout;
  const frames = value.frames;
  if (!isRecord(colors) || !isRecord(typography) || !isRecord(spacing) || !isRecord(layout) || !isRecord(frames)) return false;
  if (!hasExactKeys(colors, colorNames) || !hasExactKeys(typography, typeRoles) || !hasExactKeys(spacing, spacingNames) || !hasExactKeys(frames, frameRoles) || !hasExactKeys(layout, Object.keys(BASE_TOKENS.layout))) return false;
  if (!colorNames.every((name) => typeof colors[name] === "string" && /^#[\da-f]{6}$/i.test(colors[name] as string))) return false;
  if (!spacingNames.every((name) => isBoundedNumber(spacing[name], 0, 1000))) return false;
  if (!typeRoles.every((role) => {
    const token = typography[role];
    return isRecord(token)
      && (token.family === "TC Golos" || token.family === "TC Lora")
      && isBoundedNumber(token.desktopSize, 1, 500)
      && isBoundedNumber(token.mobileSize, 1, 500)
      && isBoundedNumber(token.lineHeight, 0.5, 4)
      && isBoundedNumber(token.weight, 100, 900)
      && isBoundedNumber(token.letterSpacing, -1, 1)
      && (token.responsiveScale === undefined || isResponsiveTypeScale(token.responsiveScale));
  })) return false;
  if (!Object.values(layout).every((item) => isBoundedNumber(item, 1, 5000))) return false;
  return frameRoles.every((role) => {
    const frame = frames[role];
    return isRecord(frame)
      && isBoundedNumber(frame.aspectRatio, 0.1, 10)
      && typeof frame.src === "string"
      && frame.src.startsWith("/")
      && typeof frame.alt === "string";
  });
}

function isPlaygroundState(value: unknown): value is PlaygroundState {
  return isRecord(value)
    && hasExactKeys(value, ["tokens", "theme", "viewport", "showGrid"])
    && isPlaygroundTokens(value.tokens)
    && (value.theme === "tc" || value.theme === "china" || value.theme === "thailand" || value.theme === "madagascar")
    && (value.viewport === "desktop" || value.viewport === "tablet" || value.viewport === "mobile")
    && typeof value.showGrid === "boolean";
}

export function readDraft(): PlaygroundState | null {
  if (typeof window === "undefined") return null;
  try {
    const serialized = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!serialized) return null;
    const envelope: unknown = JSON.parse(serialized);
    if (!isRecord(envelope) || envelope.version !== DRAFT_VERSION || !isPlaygroundState(envelope.state)) return null;
    return envelope.state;
  } catch {
    return null;
  }
}

export function writeDraft(state: PlaygroundState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ version: DRAFT_VERSION, state }));
  } catch {
    // The current React state stays usable when this browser cannot store drafts.
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Clearing local storage is best effort; no project files are involved.
  }
}
