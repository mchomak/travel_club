# Travel Club design systems

Each application owns its visual language. CSS, fonts, theme variables, component styling, and responsive rules must stay inside the owning app; apps must not import visual code from one another or from a shared visual package.

## Website

The approved Website design system lives at [`apps/website/src/styles/travel-club-design-system.css`](../apps/website/src/styles/travel-club-design-system.css) and is imported by the Website root layout. It provides the approved Lato font faces, typography scale, palette, semantic aliases, spacing, container, divider, and frame values through `--tc-*` tokens. Font assets are local to `apps/website/public/`.

The existing type scale retains its desktop/mobile role sizes and 390–1440px interpolation:

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

The existing semantic palette includes `--tc-paper`, `--tc-ink`, `--tc-blue`, `--tc-red`, `--tc-china`, `--tc-madagascar`, `--tc-thailand`, and `--tc-next-decorative`, with section-specific aliases for text, headings, accents, dividers, links, buttons, and photo editor controls. Continue to read exact values from the token stylesheet; do not copy or redefine them in page CSS.

The root layout loads the Website design system for every Website route. At this revision, `(publication)` uses `SiteShell`, while `(public)` keeps its own layout and CSS in `apps/website/src/app/(public)/`; this describes current route composition and does not imply that the wrappers are visually identical.

## Trip Constructor

The Constructor has its own token source at [`apps/trip-constructor/src/design-system/tokens.css`](../apps/trip-constructor/src/design-system/tokens.css), imported by that app's `src/app/globals.css`. Its theme, component styles, and type choices belong to `apps/trip-constructor/`. Keep imports within the Constructor app. Do not copy Website colors, Lato declarations, or UI components into this app as a convenience.

## Interviews

Interviews styling is local to [`apps/interviews/src/styles/globals.css`](../apps/interviews/src/styles/globals.css) and its own component CSS. There is no separately extracted token file at this revision. If a token source is needed, define it within Interviews and document its ownership; do not import Website or Constructor themes.

## Shared technical code

There is no `shared-ui`, `shared-design-system`, `global-tokens`, or `shared-theme` package. Shared code is limited to neutral technical infrastructure such as the FastAPI API, backend data rules, gateway, and calculation vectors. A new common package must not contain CSS, fonts, logos, visual components, or responsive design rules.

## Adding or changing styles

1. Identify the owning app before editing styles.
2. Reuse that app's existing semantic tokens and component rules.
3. Keep global CSS app-local and avoid generic selectors that could affect another app through shared origins.
4. Do not add Website values to the Constructor or Interviews system, even when a value looks similar.
5. Keep composition and responsive rules in the owning page/component styles; add a semantic token only when more than a one-off decorative value needs it.
6. Recheck only the owning app's build and routes, then run the cross-app build if an import boundary changed.

The Website token system is also summarized in its source file and `apps/website/src/components/public-site/README.md`. The broader ownership and architecture rules are in [REPOSITORY_ARCHITECTURE.md](architecture/REPOSITORY_ARCHITECTURE.md).
