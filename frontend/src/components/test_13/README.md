# /test_13 — Между строк

Independent noindex copy of `/test_12`, supported from **1100 × 700 px**. Seven spreads and fourteen reading pages preserve the original content, photography, typography, geometry and links. All old versions, shared code, assets and backend remain read-only.

## Files and contracts

- `../../app/test_13/page.tsx`: noindex metadata; server parser for `spread=1`–`7`. Invalid/repeated values normalize to 1 and preserve unrelated query parameters.
- `data.ts`: unchanged TEST_12 content, prices, image slots and chapter labels.
- `magazine-experience.tsx`: the existing single index, turn lock, keyboard/history/focus lifecycle; derives the displayed chapter for one measured navigation underline.
- `spreads.tsx`: `MagazineCover()` and `MagazineSpread({ index, side?, animate?, reveal? })`; `RevealPhase = static | pending | enter`. Static is the complete printed capture state.
- `spreads.module.css`: local text reveal/cascade, rules, symbols and interaction effects; original photo/intro declarations remain unchanged.
- `editorial-symbol.tsx`: `EditorialSymbol({ name, className? })`; seven decorative, currentColor SVG geometries on one 24-unit grid.
- `magazine-intro.tsx`, `intro-scene.ts`, `capture-page.ts`, `reading-turn.tsx`, `reading-turn-engine.ts`: byte-identical to TEST_12. No idle engine canvas or animation loop.

## Editorial motion

Native headings reveal left to right in 1000 ms (1200 ms for multiline titles), with a safe final clip reset. Semantic text groups cascade in 650 ms with 8 px translation and 160 ms steps; the longest sequence completes in 1.93 s. Complete service rows keep name, description and price together. Existing rules draw over 450/650 ms using pseudo-elements and transparent borders that preserve layout. Authored editorial symbols enter once in the existing 550 ms icon reveal. Links, arrows and focus respond in 190 ms; the original CTA underline remains visible at rest and moves up 2 px. One measured navigation underline follows the displayed chapter without a second navigation state.

| Chapter | Reveal and text groups | Rules and response |
| --- | --- | --- |
| Services | С нами в путь; introduction, three complete formats, terms, CTA | Header/rows/folio; route, ready, companions; whole-row links |
| About | Shared headlines and founder names; roles, descriptions, origin | Header/origin/folio; original portrait placeholders |
| Next Issue | Следующая история — вместе; lead, concept, preparation, CTA | Planning/folio; direction/companions; original iris and NEXT ISSUE |
| Thailand | Right story headline, route, prose, marginalia, captions, CTA | Printed rules; waypoint; original image-filled THAILAND and photos |
| China | CHINA and Дальше — вместе; labels, body, figures, caption, CTA | Header/folio and vertical divider; original photo effects |
| Archive | ARCHIVE and То, что остаётся; introduction, complete entries, caveat, CTA | Entry/folio rules; original contact prints |
| Start | Не только куда and Начнём с разговора; principles, process, CTA, prototype note | Principle/process/folio rules; link arrows and underline |

The existing `ReadingTurn.onComplete` → `finish` and `introComplete` set `reveal=enter` after leaf/decode handoff. Static capture remains fully printed; pending hides incoming editorial text/icons/drawn rules before the captured leaf and live handoff while retaining fixed labels. Finite backwards-fill animations return to visible base CSS without animationend callbacks. Resize, hover and indicator measurements do not replay them; revisiting a chapter does. Reduced motion disables the new animations/transitions, resets clip/opacity/transforms, and interrupts an active turn. Indicator measurements use ResizeObserver, font readiness and scroll events with cleanup; there is no idle animation loop.

## Content and constraints

Intro, capture and physical page-turn engines plus `data.ts` are byte-identical to TEST_12; photo masks/keyframes/delays/data-beat remain unchanged. The hero slogan, image-filled THAILAND and large NEXT ISSUE retain their original reveal because they interact with photographs. Founder portrait placeholders remain original content: change `FOUNDER_PHOTOS.vasilisa.src` / `FOUNDER_PHOTOS.ramil.src`, accurate alt and object-position only when real supplied portraits exist. Existing travel photos and logos remain read-only assets. No dependency or environment variable was added.

This remains a desktop experiment from 1100 × 700 px. Smaller windows retain the existing explanatory fallback and `/test_8` link. Field Notes remain friends' private trips, photos illustrative, Next Issue in preparation and public request forms prototypes.

## Verified 21 October 2026

Development: `http://localhost:3113/test_13`; isolated production: `http://localhost:3114/test_13`. The pre-motion copy gate passed all seven spreads at 1440×900 and 1100×700 with fourteen exact decoded pixel matches: [copy report](../../../../docs/qa/test-13/copy-baseline.md).

From this worktree's `frontend/` (PowerShell):

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test -- --run --testTimeout=15000
npm.cmd run build
$env:PLAYWRIGHT_BASE_URL='http://localhost:3114'
npm.cmd exec playwright test e2e/test-13-refinement.spec.ts e2e/test-13-motion.spec.ts e2e/test-12-magazine.spec.ts e2e/test-12-review-comments.spec.ts e2e/test-11-reveal.spec.ts e2e/test-10-magazine.spec.ts -- --workers=2
```

Coordinator results: lint/typecheck passed, Vitest 113 passed in 26 files, isolated Docker production build passed. Final production Playwright suite after the underline correction: 36 passed (1.1 minutes). The CTA regression failed on the missing rest underline before the CSS specificity correction, then passed with a visible 1 px rest line, 2 px hover movement, unchanged bounds and reduced-motion static line. Independent browser acceptance and scoped source review passed. Final commands/logs, frame comparisons and limitations: [QA evidence](../../../../docs/qa/test-13/README.md).

## Refinement — 21 October 2026

Pending content is hidden until enter, eliminating the visible-hidden-visible flash. The open button sits directly below the cover. Chapter buttons rise from 44 to 50 px inside a fixed navigation slot, keeping the book and indicator steady. Full cause, regression and current verification: [refinement](../../../../docs/qa/test-13/refinement.md).

## Graphic details - 21 October 2026

Seven local symbols share fine route lines, open corners and nodal points: route, ready, companions, direction, waypoint, note and onward. They replace the former library icons in Services, Next Issue and Thailand; note and waypoint appear once beside the Archive and Start headings. All are aria-hidden, non-focusable and inherit the existing palette. No repeated folio decoration was added.

The three format actions use inherited navy, a transparent surface, a permanent 1 px underline and the onward arrow. The entire row remains the original /formats link. Hover/focus moves the rule 2 px over 190 ms without changing bounds; reduced motion keeps it static. Existing pending/enter/static parents own the symbols and the two new marginal marks.

At widths up to 1200 px or heights up to 790 px, the Services page uses tighter internal spacing and line-height to correct an existing overlap whenever either viewport axis limits the book. The body stays 13 px. All format actions use .12em vertical padding, also removing a smaller original overlap at 1440x900. Only service-row internal spacing changes; text, links, photography, page geometry and the main composition remain intact. Browser evidence, scripts and actual verification are in [graphic-details QA](../../../../docs/qa/test-13/graphic-details/README.md).
