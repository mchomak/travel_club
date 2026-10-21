import type { CSSProperties } from "react";
import { BASE_TOKENS, type PlaygroundTokens, type TypeRole, type TypographyRole } from "../design-system/tokens";

const roles: Record<TypeRole, string> = {
  displayXL: "display-xl", displayL: "display-l", h1: "h1", h2: "h2", h3: "h3",
  lead: "lead", body: "body", bodySmall: "small", metadata: "meta", caption: "caption", button: "button",
};
const cssKey = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const rem = (value: number) => `${value / 16}rem`;

/** Interpolate token sizes between the 390px reading width and 1440px publication. */
function fluidSize(token: TypographyRole): string {
  const slope = (token.desktopSize - token.mobileSize) / (1440 - 390);
  const intercept = (token.mobileSize - slope * 390) / 16;
  return `clamp(${rem(Math.min(token.mobileSize, token.desktopSize))}, calc(${intercept}rem + ${slope * 100}vw), ${rem(Math.max(token.mobileSize, token.desktopSize))})`;
}

export function createSiteVariables(tokens: PlaygroundTokens = BASE_TOKENS): CSSProperties {
  const vars: Record<string, string | number> = {
    "--pub-font-sans": '"TC Golos", "Segoe UI", sans-serif',
    "--pub-font-serif": '"TC Lora", Georgia, serif',
    "--pub-font-editorial": tokens.typography.h3.family === "TC Lora" ? "var(--pub-font-serif)" : "var(--pub-font-sans)",
  };
  Object.entries(tokens.colors).forEach(([name, value]) => { vars[`--pub-color-${cssKey(name)}`] = value; });
  Object.entries(tokens.spacing).forEach(([name, value]) => { vars[`--pub-space-${name}`] = rem(value); });
  Object.entries(tokens.layout).forEach(([name, value]) => {
    vars[`--pub-layout-${cssKey(name)}`] = name === "columns" ? value : rem(value);
  });
  Object.entries(tokens.frames).forEach(([name, frame]) => { vars[`--pub-frame-${cssKey(name)}-ratio`] = frame.aspectRatio; });
  (Object.keys(roles) as TypeRole[]).forEach((role) => {
    const token = tokens.typography[role];
    const prefix = `--pub-type-${roles[role]}`;
    vars[`${prefix}-fluid`] = fluidSize(token);
    vars[`${prefix}-mobile`] = rem(token.mobileSize);
    vars[`${prefix}-family`] = ["h1", "h2", "h3"].includes(role)
      ? "var(--pub-font-editorial)"
      : token.family === "TC Lora" ? "var(--pub-font-serif)" : "var(--pub-font-sans)";
    vars[`${prefix}-line-height`] = token.lineHeight;
    vars[`${prefix}-weight`] = token.weight;
    vars[`${prefix}-tracking`] = `${token.letterSpacing}em`;
  });
  return vars as CSSProperties;
}
