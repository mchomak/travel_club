# Travel Club design system

The extracted tokens live in [`frontend/src/styles/travel-club-design-system.css`](../frontend/src/styles/travel-club-design-system.css). `/test_21` imports that file through its page stylesheet; its colors, type scale, font weights, line heights, tracking, section themes, container rules and shared frame values come from those tokens. The declarations are scoped to the document only while the `/test_21` root is mounted, so `/test_20` keeps its own settings and runtime behavior.

## Source and typography

The palette and type sizes were read from `/test_20`'s `DEFAULT_DESIGN` in `frontend/src/components/test_20/design-tokens.ts` and its standard page CSS. The brief explicitly requires Lato for every text role, so `/test_21` uses Lato while retaining `/test_20`'s default role sizes, hierarchy, weights, line heights and tracking. This means its typeface differs from `/test_20`'s actual standard defaults (TC Golos for most roles and TC Lora for H3); that difference follows the explicit Lato requirement.

Text sizes preserve the default desktop/mobile pairs and the original 390–1440px interpolation:

| Role | Desktop | Mobile |
|---|---:|---:|
| Display | 140px | 64px |
| H1 | 70px | 40px |
| H2 | 58px | 36px |
| H3 | 30px | 25px |
| Subheading | 22px | 19px |
| Body | 17px | 16px |
| Caption | 14px | 12px |
| Metadata | 12px | 12px |
| CTA | 15px | 15px |

Latin Lato files and their original OFL license are in `frontend/public/design-system/fonts/`. The `/test_20` Lato files cover Latin only, so OFL-licensed Cyrillic Lato regular, medium, semibold and bold files are included there as well. A private CSS family name (`Travel Club Lato`) isolates those added faces from `/test_20`'s selectable Lato setting.

## Palette

| Token | Value | Use |
|---|---|---|
| `--tc-paper` | `#F5F0DC` | Warm page background |
| `--tc-ink` | `#20211F` | Editorial body text |
| `--tc-blue` | `#172F50` | Brand blue, formats and approach |
| `--tc-red` | `#B93625` | Next Issue section |
| `--tc-china` | `#253746` | China story |
| `--tc-madagascar` | `#7D3027` | Madagascar story accents |
| `--tc-thailand` | `#27493B` | Thailand story |
| `--tc-next-decorative` | `#F5E2A0` | Next Issue display and marks |

Section aliases (`--tc-nav-*`, `--tc-hero-*`, `--tc-formats-*`, `--tc-next-*`, `--tc-china-*`, `--tc-madagascar-*`, `--tc-thailand-*`, `--tc-approach-*`, `--tc-conversation-*`, and `--tc-footer-*`) preserve the default heading, text, accent, divider, button and link colors. Field Notes uses its own paper/blue/ink theme. White contrast on Next Issue and colors for the photo-editing controls are tokenized too. The editor color aliases are `--tc-editor-*`.

## Layout and use

Shared frame tokens include the 1400px maximum content width, page gutters (96px total on wide screens, 64px at 1100px and 36px at 600px), 72px navigation height, square corners and 1px dividers. The 4–64px spacing scale is available as `--tc-space-*`. Section composition and responsive breakpoints remain in `frontend/src/components/test_21/concept.module.css`: native CSS media conditions cannot read custom properties, so their 1600px, 1100px, 820px, 600px and 360px breakpoints, plus a 721–780px layout adjustment are kept in the media rules themselves. Structural color, font, type scale, border, container and main responsive-gutter values reference the central tokens. Photo editor surfaces, typography and colors in `image-editor.module.css` use the same system.

The retained logo variants are the existing navy `/test_20/travel-club-navy.svg` and cream `/test_9/TC_Logo_Editorial_Signature_Cream.svg`. They are referenced as-is by `brand-logo.tsx`.

When changing the overall system, edit this token stylesheet and update this document. Keep page-specific layout rules in the section stylesheet; do not add duplicate palette, family or role-size values there.
