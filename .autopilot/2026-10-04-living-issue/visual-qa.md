# Living Issue acceptance and visual QA

## Isolation

The copy was opened and compared before adding the opening. Original and copied content DOM matched at 1440x900, 1024px wide and 390x844. The final versions preserve the same editorial content, layout and interactions after the intro. Experiment-only differences are anchor targets and keyboard focus handling.

All 35 baseline SHA-256 checks match baseline-hashes.json: original route/components/data/styles, local photographs/fonts, root layout/global CSS and package files. No original runtime file was edited. Independent acceptance also compared content and element geometry at all three requested widths. Screenshot rasterization can differ with font settling and fractional anchor scrolling; bitwise image equality is not claimed.

## Art direction and refinement

The cover uses existing ferry passengers, a large TC masthead, edition/date, quiet serif copy and subtle paper edge. The internal spread pairs Istanbul/people/story copy with the same shared-table photograph used in the original hero. Native scrolling reveals the spread, enlarges it and removes perspective before the original page. The journey occupies 140svh, with a 100svh sticky viewport. No wheel/touch interception, animation dependency or WebGL.

A separate refinement pass reduced distracting chrome during opening, sharpened resting typography, improved scale and spacing, removed mobile overlap and strengthened the visual relationship with the hero. Independent craft review found two small-viewport problems (a collapsed landscape cover image and clipped portrait text); both were fixed and rechecked. Independent acceptance found the inherited absolute skip link could return focus to the intro; scoped positioning and keyboard tests resolved it.

## Browser checks

Requested 1440x900, 1024px and 390x844 views were opened side by side with the control and photographed through cover/open/spread/enter/transition/hero states. Extra 320x568 and 667x375 checks verify readable text, nonzero photo size and no horizontal overflow. Mobile uses a vertical spread; short landscape uses a horizontal composition without 3D.

Direct `/test_2#start`, keyboard skip and subsequent Tab navigation, backwards native scrolling, reduced motion, resize, JavaScript disabled, unique IDs, unchanged content and form behavior are covered by nine new Playwright scenarios. Reduced motion uses a static 100svh cover and ordinary scrolling. The bounded header is the anchor focus target. A wheel/hash test race was corrected by awaiting the applied wheel scroll; 27 repeated experiment scenarios passed before the final full run.

A foreground Chromium rAF sample recorded 35 frames with p95 around 11ms and no long tasks. This is desktop browser emulation, not a real-device frame-rate guarantee.

## Final verification

| Command | Result |
|---|---|
| `npm.cmd test` (frontend) | 65 passed |
| `npm.cmd run lint` | Passed |
| `npm.cmd run typecheck` | Passed |
| `docker compose build frontend` | Passed; Next production build includes static /test_2 |
| `docker compose up -d --no-deps frontend` | Passed; production available on localhost:3000 |
| `PLAYWRIGHT_BASE_URL=http://localhost:3000 npm.cmd run test:e2e -- --reporter=line` | 40 passed, including existing routes and nine new experiment scenarios |
| `git diff --check` | Passed |
| Baseline SHA-256 comparison | 35/35 unchanged |

Backend and database were not changed; frontend-only verification was sufficient for this scope. No required check remains outstanding.

## Local screenshots

Screenshots live in the existing, untracked `.playwright-mcp/` output directory. Existing user files there were preserved.

| View | Cover | Spread | Original hero after intro | Control |
|---|---|---|---|---|
| Desktop | [1440](../../.playwright-mcp/living-final-cover-1440.png) | [1440](../../.playwright-mcp/living-final-spread-1440.png) | [1440](../../.playwright-mcp/living-final-hero-1440.png) | [1440](../../.playwright-mcp/living-production-baseline-1440.png) |
| Tablet | [1024](../../.playwright-mcp/living-final-cover-1024.png) | [1024](../../.playwright-mcp/living-final-spread-1024.png) | [1024](../../.playwright-mcp/living-final-hero-1024.png) | [1024](../../.playwright-mcp/living-production-baseline-1024.png) |
| Mobile | [390](../../.playwright-mcp/living-final-cover-390.png) | [390](../../.playwright-mcp/living-final-spread-390.png) | [390](../../.playwright-mcp/living-final-hero-390.png) | [390](../../.playwright-mcp/living-production-baseline-390.png) |

## Tools and decisions

Applied autopilot full, frontend-design and impeccable (including motion guidance), plus verification/debugging guidance. Used Playwright/Chromium for automation and screenshots, and Pillow for image comparisons. No additional skill packs or npm dependencies were installed.

Reused local assets for visual consistency and kept animation in CSS/rAF for this single short scene. The original /test form anchor was already #start; only the experiment moves that form to #story so the requested deep link can land at the hero. Both decisions are documented in the component README.

No brief requirement was deferred. After viewing, the useful aesthetic discussion is whether the quiet ferry photograph and the current cover size/pacing express the desired publication character.
