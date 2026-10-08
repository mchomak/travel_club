# Межмодульные границы

## Границы, решённые в спецификации

Внутри Playground одна граница: token/state layer owns base values, supported theme/viewport and serialization; shell owns React state, browser draft and control actions; scoped preview consumes the state as CSS Custom Properties.

Types:

```ts
type FontFamily = "TC Golos" | "TC Lora";
type TypeRole = "displayXL" | "displayL" | "h1" | "h2" | "h3" | "lead" | "body" | "bodySmall" | "metadata" | "caption" | "button";
type SpacingToken = "xs" | "s" | "m" | "l" | "xl" | "2xl";
type ColorToken = "cloud" | "ink" | "china" | "thailand" | "ocean" | "madagascar" | "tobacco" | "editorialPaper" | "editorialInk" | "brandBlue" | "muted" | "line";
type FrameRole = "hero" | "landscape" | "editorialLarge" | "editorialSmall" | "portrait" | "square";
type DestinationTheme = "tc" | "china" | "thailand" | "madagascar";
type ViewportPreset = "desktop" | "tablet" | "mobile";
type HexColor = `#${string}`; // accepted values must validate as #RRGGBB
type FrameToken = { aspectRatio: number; src: string; alt: string };
type LayoutTokens = {
  containerWidth: number; pagePadding: number; columns: number; columnGutter: number;
  sectionSpacing: number; blockSpacing: number; contentWidth: number;
  narrowTextWidth: number; editorialGutter: number;
};
type ResponsiveTypeScale = { desktopMin?: number; desktopVw?: number; mobileVw?: number; mobileReferenceWidth?: number };
type TypographyRole = {
  family: FontFamily; desktopSize: number; mobileSize: number; responsiveScale?: ResponsiveTypeScale; lineHeight: number;
  weight: number; letterSpacing: number;
};
type PlaygroundTokens = {
  colors: Record<ColorToken, HexColor>;
  typography: Record<TypeRole, TypographyRole>;
  spacing: Record<SpacingToken, number>;
  layout: LayoutTokens;
  frames: Record<FrameRole, FrameToken>;
};
type PlaygroundState = {
  tokens: PlaygroundTokens; theme: DestinationTheme;
  viewport: ViewportPreset; showGrid: boolean;
};
```

The immutable `BASE_TOKENS: PlaygroundTokens` is separate from the runtime copy in `PlaygroundState`. Shared functions:

```ts
createPreviewVariables(state: PlaygroundState): React.CSSProperties
createCssExport(state: PlaygroundState): string
createJsonExport(state: PlaygroundState): string
readDraft(): PlaygroundState | null
writeDraft(state: PlaygroundState): void
clearDraft(): void
```

Only the preview root receives `createPreviewVariables`; control panel CSS is independent. Draft storage is best effort; there is no filesystem or server write path. Test seam: route DOM/actions and pure token serialization/validation functions.

## Project rules for executors

- Project root: `C:\Users\McHomak\Projects\travel_club`; frontend is Next.js 16.3.6, React 19.3.0, TypeScript 6.0.3.
- Reuse existing dependencies only. Do not touch backend, admin, constructor, database, existing routes or their styles, global CSS, shared public navigation or unrelated assets. Do not add the Playground to public navigation.
- Route: `/design-system`. Add new route-local UI and its token CSS only. Keep live overrides scoped to preview, never to the global root.
- Do not implement API, server state, Save to Project, Write to CSS/File, Apply to Website, automatic CSS changes, or file writes from UI.
- Existing local families are TC Golos and TC Lora. No GFS Didot or Inter imports were found. Source composition is `/test_2`; verify `/test_4` remains unaffected.
- Use PowerShell-friendly Windows commands and `npm.cmd`.
- Frontend checks from `frontend/`: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test -- --run`, `npm.cmd run build`.
- Browser tests use Playwright 1.63.0 already installed; run only with the existing app/Chromium available. `npm.cmd run test:e2e -- <spec>` is available. Default base URL is `http://localhost:3000`; `PLAYWRIGHT_BASE_URL` overrides it.
- If a necessary package or tool is missing, return `BLOCKED` for that need rather than installing a dependency without request.
- Ticket 02 must build on ticket 01 exports above. Ticket 01 must hand off actual types/helper names if implementation needs a spec amendment; keep compatibility or document the change before ticket 02 starts.

## ?? ????? 01 ? token controls ? ????????

- ?????????? route-local `PlaygroundShell`; ?? ??????? draft UI state ? ???????? ?????? `PlaygroundState` ? `PlaygroundPreview({ state })`.
- `tokens.ts` ???????????? `BASE_TOKENS`, ???? token/state, `createPreviewVariables`, `createCssExport`, `createJsonExport`, `readDraft`, `writeDraft`, `clearDraft`. Task 02 ????????? ??????/???????????; ?? ??????? ?????? ???????????? ??? token state.
- ????? ????????? token helpers ? shell controls ????? ??????????? ????????? helpers/UI. Vitest ????? task 01: 16 ??????, 69 ??????.

## Discovered constraint D01 (R18)

Task 01 review showed that numeric desktopSize alone loses source `clamp()`/`vw` behavior. `responsiveScale` preserves the initial curve; editable numeric desktop/mobile values remain the user-facing targets. Task 02 must render the curve against the preview canvas width.

- D01 repair completed: `ResponsiveTypeScale` is carried on each affected role; `createPreviewVariables` preserves fluid source sizing at the selected preview width while controls keep editable numeric targets.

Task 02 extension: preserve the mobile source clamp boundaries for DISPLAY L and H1. Extend `ResponsiveTypeScale` with optional mobile minimum/maximum bounds (or an equivalent typed mobile clamp) so the numeric mobile target remains editable and the preview evaluates the resulting curve at its actual width. Required browser checks: 390px and 320px, including below-360 behavior.
