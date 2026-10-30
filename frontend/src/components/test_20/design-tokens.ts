import type { CSSProperties } from "react";
import { BASE_TOKENS } from "../design-system/tokens";

export const DESIGN_STORAGE_KEY = "travel-club-test-20-design-v1";
export const FONT_FAMILIES = ["TC Golos", "TC Lora", "Montserrat", "Red Hat Display", "Lato", "Nunito Sans"] as const;
export type DesignFont = typeof FONT_FAMILIES[number];
export const TYPE_LABELS = {
  display: "Display", h1: "H1", h2: "H2", h3: "H3", subheading: "Подзаголовки",
  body: "Основной текст", caption: "Подписи", metadata: "Metadata", cta: "CTA",
} as const;
export type DesignRole = keyof typeof TYPE_LABELS;
export const COLOR_LABELS = {
  paper: "Бумага", ink: "Основной текст", blue: "Фирменный синий", red: "Next Issue",
  china: "Китай", madagascar: "Мадагаскар", thailand: "Таиланд",
} as const;
export type DesignColor = keyof typeof COLOR_LABELS;
export const SECTION_LABELS = {
  nav: "Навигация", hero: "Hero", formats: "Наши форматы", next: "Next Issue", china: "China ’25",
  madagascar: "Madagascar ’25", thailand: "Thailand ’26", approach: "Наш подход",
  conversation: "Начнём с разговора", footer: "Footer",
} as const;
export type DesignSection = keyof typeof SECTION_LABELS;
export const SECTION_COLOR_LABELS = {
  bg: "Фон", heading: "Заголовки", text: "Текст", accent: "Акценты", line: "Линии", button: "Кнопки", link: "Ссылки",
} as const;
export type SectionColor = keyof typeof SECTION_COLOR_LABELS;
export type RoleSettings = { family: DesignFont; desktop: number; mobile: number };
export type DesignSettingsValue = {
  version: 1;
  colors: Record<DesignColor, string>;
  typography: Record<DesignRole, RoleSettings>;
  sections: Partial<Record<DesignSection, Partial<Record<SectionColor, string>>>>;
};

const type = (family: DesignFont, desktop: number, mobile: number): RoleSettings => ({ family, desktop, mobile });
export const DEFAULT_DESIGN: DesignSettingsValue = {
  version: 1,
  colors: {
    paper: "#F5F0DC", ink: BASE_TOKENS.colors.editorialInk.toUpperCase(), blue: BASE_TOKENS.colors.brandBlue.toUpperCase(),
    red: "#B93625", china: "#253746", madagascar: BASE_TOKENS.colors.madagascar, thailand: BASE_TOKENS.colors.thailand,
  },
  typography: {
    display: type("TC Golos", 140, 64), h1: type("TC Golos", 70, 40), h2: type("TC Golos", 58, 36),
    h3: type("TC Lora", 30, 25), subheading: type("TC Golos", 22, 19), body: type("TC Golos", 17, 16),
    caption: type("TC Golos", 14, 12), metadata: type("TC Golos", 12, 12), cta: type("TC Golos", 15, 15),
  },
  sections: {},
};

export const CHINA_PRESETS = [
  { name: "PANTONE 7546 C", color: "#253746", note: "Выбранный ориентир" },
  { name: "Текущий China", color: "#232831", note: "Фон из /test_19" },
  { name: "Синий из палитры", color: BASE_TOKENS.colors.china, note: "Токен направления" },
] as const;

export const PALETTE_PRESETS: { name: string; note: string; colors: DesignSettingsValue["colors"] }[] = [
  { name: "Тёплая редакция", note: "Бумага #F5F0DC · тёмный синий", colors: DEFAULT_DESIGN.colors },
  { name: "Редакция /test_19", note: "Прежняя бумага и оригинальный синий", colors: {
    ...DEFAULT_DESIGN.colors, paper: BASE_TOKENS.colors.editorialPaper, blue: "#214C78", china: "#232831",
  } },
  { name: "Палитра направлений", note: "Cloud и цвета из дизайн-системы", colors: {
    ...DEFAULT_DESIGN.colors, paper: BASE_TOKENS.colors.cloud, ink: BASE_TOKENS.colors.ink, china: BASE_TOKENS.colors.china,
  } },
];

export const normalizeHex = (value: string): string | null => /^#[\da-f]{6}$/i.test(value) ? value.toUpperCase() : null;

const fontStacks: Record<DesignFont, string> = {
  "TC Golos": '"TC Golos", "Segoe UI", sans-serif',
  "TC Lora": '"TC Lora", Georgia, serif',
  Montserrat: '"Montserrat", "TC Golos", "Segoe UI", sans-serif',
  "Red Hat Display": '"Red Hat Display", "TC Golos", "Segoe UI", sans-serif',
  Lato: '"Lato", "TC Golos", "Segoe UI", sans-serif',
  "Nunito Sans": '"Nunito Sans", "TC Golos", "Segoe UI", sans-serif',
};

/** Every section inherits the shared palette until its own override is chosen. */
const sectionPalette: Record<DesignSection, { bg: DesignColor; heading: DesignColor; text: DesignColor; accent: DesignColor; button: DesignColor }> = {
  nav: { bg: "blue", heading: "paper", text: "paper", accent: "paper", button: "paper" },
  hero: { bg: "blue", heading: "paper", text: "paper", accent: "paper", button: "paper" },
  formats: { bg: "paper", heading: "blue", text: "ink", accent: "blue", button: "blue" },
  next: { bg: "red", heading: "paper", text: "paper", accent: "paper", button: "paper" },
  china: { bg: "china", heading: "paper", text: "paper", accent: "paper", button: "paper" },
  madagascar: { bg: "paper", heading: "madagascar", text: "ink", accent: "madagascar", button: "madagascar" },
  thailand: { bg: "thailand", heading: "paper", text: "paper", accent: "paper", button: "paper" },
  approach: { bg: "paper", heading: "blue", text: "ink", accent: "blue", button: "blue" },
  conversation: { bg: "blue", heading: "paper", text: "paper", accent: "paper", button: "paper" },
  footer: { bg: "paper", heading: "blue", text: "blue", accent: "blue", button: "blue" },
};
const inheritedColor = (section: DesignSection, field: SectionColor): DesignColor => {
  const palette = sectionPalette[section];
  return field === "line" || field === "link" ? palette.accent : palette[field];
};
// Cream remains the display color; white meets small-text contrast on the approved Next Issue red.
const sectionContrastDefaults: Partial<Record<DesignSection, Partial<Record<SectionColor, string>>>> = {
  next: { text: "#FFFFFF", accent: "#FFFFFF", line: "#FFFFFF", button: "#FFFFFF", link: "#FFFFFF" },
};
export const sectionColorValue = (settings: DesignSettingsValue, section: DesignSection, field: SectionColor): string =>
  settings.sections[section]?.[field] ?? sectionContrastDefaults[section]?.[field] ?? settings.colors[inheritedColor(section, field)];

function responsiveSize(desktop: number, mobile: number): string {
  if (desktop === mobile) return `${desktop / 16}rem`;
  const slope = (desktop - mobile) / 1050;
  return `clamp(${Math.min(desktop, mobile) / 16}rem, calc(${(mobile - slope * 390) / 16}rem + ${slope * 100}vw), ${Math.max(desktop, mobile) / 16}rem)`;
}

export function createDesignVariables(settings: DesignSettingsValue = DEFAULT_DESIGN): CSSProperties {
  const vars: Record<string, string> = {};
  for (const color of Object.keys(COLOR_LABELS) as DesignColor[]) vars[`--tc-${color}`] = settings.colors[color];
  for (const role of Object.keys(TYPE_LABELS) as DesignRole[]) {
    const token = settings.typography[role];
    vars[`--tc-font-${role}`] = fontStacks[token.family];
    vars[`--tc-size-${role}`] = responsiveSize(token.desktop, token.mobile);
  }
  for (const section of Object.keys(SECTION_LABELS) as DesignSection[]) {
    for (const field of Object.keys(SECTION_COLOR_LABELS) as SectionColor[]) {
      vars[`--tc-${section}-${field}`] = settings.sections[section]?.[field] ?? sectionContrastDefaults[section]?.[field] ?? `var(--tc-${inheritedColor(section, field)})`;
    }
  }
  return vars as CSSProperties;
}

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

/** Reject the whole draft on invalid fields; never send storage strings straight into CSS. */
export function parseDesignDraft(value: string | null): DesignSettingsValue | null {
  if (!value || value.length > 20000) return null;
  try {
    const raw: unknown = JSON.parse(value);
    if (!object(raw) || raw.version !== 1 || !object(raw.colors) || !object(raw.typography) || !object(raw.sections)) return null;
    const colors = {} as DesignSettingsValue["colors"];
    for (const key of Object.keys(COLOR_LABELS) as DesignColor[]) {
      const candidate = raw.colors[key];
      if (typeof candidate !== "string" || !normalizeHex(candidate)) return null;
      colors[key] = normalizeHex(candidate)!;
    }
    const typography = {} as DesignSettingsValue["typography"];
    for (const key of Object.keys(TYPE_LABELS) as DesignRole[]) {
      const candidate = raw.typography[key];
      if (!object(candidate) || !FONT_FAMILIES.includes(candidate.family as DesignFont)) return null;
      const { desktop, mobile } = candidate;
      if (typeof desktop !== "number" || !Number.isFinite(desktop) || desktop < 10 || desktop > 200
        || typeof mobile !== "number" || !Number.isFinite(mobile) || mobile < 10 || mobile > 120) return null;
      typography[key] = { family: candidate.family as DesignFont, desktop, mobile };
    }
    const sections: DesignSettingsValue["sections"] = {};
    for (const section of Object.keys(SECTION_LABELS) as DesignSection[]) {
      const candidate = raw.sections[section];
      if (candidate === undefined) continue;
      if (!object(candidate)) return null;
      const overrides: Partial<Record<SectionColor, string>> = {};
      for (const field of Object.keys(SECTION_COLOR_LABELS) as SectionColor[]) {
        const color = candidate[field];
        if (color === undefined) continue;
        if (typeof color !== "string" || !normalizeHex(color)) return null;
        overrides[field] = normalizeHex(color)!;
      }
      sections[section] = overrides;
    }
    return { version: 1, colors, typography, sections };
  } catch { return null; }
}

export function readDesignDraft(): DesignSettingsValue {
  try {
    return typeof window === "undefined" ? DEFAULT_DESIGN : parseDesignDraft(window.localStorage.getItem(DESIGN_STORAGE_KEY)) ?? DEFAULT_DESIGN;
  } catch { return DEFAULT_DESIGN; }
}

export function saveDesignDraft(settings: DesignSettingsValue): boolean {
  try { window.localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(settings)); return true; }
  catch { return false; }
}
