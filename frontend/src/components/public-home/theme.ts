export const colorKeys = ["background", "text", "primary", "accent", "surface"] as const;
export type ColorKey = (typeof colorKeys)[number];
export type Theme = {
  colors: Record<ColorKey, string>;
  headingFont: string;
  bodyFont: string;
};

export const fontOptions = [
  { id: "modern", label: "Современный", stack: '"Segoe UI", Arial, sans-serif' },
  { id: "friendly", label: "Мягкий", stack: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { id: "editorial", label: "Редакционный", stack: 'Georgia, "Times New Roman", serif' },
  { id: "clear", label: "Чёткий", stack: 'Verdana, Geneva, sans-serif' },
] as const;

export const defaultTheme: Theme = {
  colors: {
    background: "#EAF1EE",
    text: "#183A3D",
    primary: "#285D5B",
    accent: "#E8A95D",
    surface: "#FFFCF5",
  },
  headingFont: "friendly",
  bodyFont: "modern",
};

export const colorLabels: Record<ColorKey, string> = {
  background: "Фон",
  text: "Текст",
  primary: "Главный",
  accent: "Акцент",
  surface: "Карточки",
};

export function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (!/^#?[0-9a-fA-F]{6}$/.test(trimmed)) return null;
  return `#${trimmed.replace("#", "").toUpperCase()}`;
}

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const value = normalizeHex(hex) ?? "#000000";
  const [r, g, b] = [1, 3, 5].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max === 0 ? 0 : delta / max, v: max };
}

export function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const sectors = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]];
  const [r, g, b] = sectors[Math.floor(((h % 360) + 360) % 360 / 60)];
  return `#${[r, g, b].map((n) => Math.round((n + m) * 255).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function foregroundFor(hex: string): string {
  const luminance = (value: string) => {
    const normalized = normalizeHex(value) ?? "#000000";
    const channels = [1, 3, 5].map((offset) => {
      const c = parseInt(normalized.slice(offset, offset + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const background = luminance(hex);
  const dark = luminance("#17312F");
  const darkContrast = (background + 0.05) / (dark + 0.05);
  const whiteContrast = 1.05 / (background + 0.05);
  return darkContrast > whiteContrast ? "#17312F" : "#FFFFFF";
}

export function wheelMarkerPositions(colors: Record<ColorKey, string>): Record<ColorKey, { x: number; y: number }> {
  const positions = {} as Record<ColorKey, { x: number; y: number }>;
  const placed: Array<{ x: number; y: number }> = [];
  for (const key of colorKeys) {
    const hsv = hexToHsv(colors[key]);
    const angle = hsv.h * Math.PI / 180;
    let x = 50 + Math.sin(angle) * hsv.s * 48.5;
    let y = 50 - Math.cos(angle) * hsv.s * 48.5;
    for (let attempt = 0; attempt < 8 && placed.some((other) => Math.hypot(x - other.x, y - other.y) < 7); attempt++) {
      const offset = (attempt + 1) * Math.PI / 4;
      x = Math.min(97, Math.max(3, x + Math.cos(offset) * 7));
      y = Math.min(97, Math.max(3, y + Math.sin(offset) * 7));
    }
    positions[key] = { x, y };
    placed.push({ x, y });
  }
  return positions;
}

export function restoreTheme(value: unknown): Theme {
  if (!value || typeof value !== "object") return defaultTheme;
  const candidate = value as Partial<Theme>;
  const colors = { ...defaultTheme.colors };
  for (const key of colorKeys) {
    const normalized = normalizeHex(candidate.colors?.[key] ?? "");
    if (normalized) colors[key] = normalized;
  }
  const fontIds: string[] = fontOptions.map((option) => option.id);
  return {
    colors,
    headingFont: fontIds.includes(candidate.headingFont ?? "") ? candidate.headingFont! : defaultTheme.headingFont,
    bodyFont: fontIds.includes(candidate.bodyFont ?? "") ? candidate.bodyFont! : defaultTheme.bodyFont,
  };
}
