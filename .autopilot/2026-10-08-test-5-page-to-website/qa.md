# QA evidence

## Source-first baseline (ticket 01, before camera work)
- Commit `bba4c5d` stores the isolated clone.
- Source and target cover, spread and #start frames matched pixel-for-pixel at 1440x900. Entire homepage matched on the same development server.
- Baseline images: `frontend/test-results/baseline-test-5/` (ignored local artifacts).
- SHA256 audit: 187 source route/component, public asset and package files unchanged.

## Camera/refinement (ticket 02)
- Phase screenshots at 1920, 1440, 1280, 768, 390 and 667 landscape: `frontend/test-results/test-5-camera/`.
- Checked opening timing, spread dwell, rightward focus, left-page/spine departure, shadow removal, shared masthead/rule continuity and return to normal scrolling.
- Refinements corrected local skip overlap and mobile image leakage. Keyboard skip was reproduced red and repaired; focus now follows inert removal, and next Tab enters homepage navigation.
- Final hero screenshot equality with source; source text, photography, forms and editorial CSS retained.
- Root manual production Chrome at 2560x1266: cover -> spread -> directed focus -> hero -> reverse focus; no blank state, duplicate hero or visible scene cut. Fresh #start reload: scrollY=0, header top=0. Console error/warning entries: zero.
- Public routes `/`, `/test`, `/test_2`, `/test_3`, `/test_4`, `/test_5`: HTTP 200.

## Independent acceptance discoveries
- No-JavaScript load-event navigation timed out on an inherited image optimizer resource on both source and target. The harness now waits for DOMContentLoaded while retaining real skip/hash/header assertions.
- Independent screenshot inspection then exposed scoped CSS ID selectors: emitted :has(#scoped-start:target) did not match the plain DOM id. A scoped repair replaces these selectors and strengthens the test to assert the magazine is hidden before hydration. Final production proof is recorded after the repair.

## Checks already executed
- `npm.cmd run lint`: passed.
- `npm.cmd run typecheck`: passed.
- `npm.cmd test -- --run`: 67 passed, 14 files (fresh after keyboard repair).
- `npm.cmd run build`: passed; /test_5 prerendered.
- `docker compose up -d --no-deps --build --wait frontend`: passed, frontend healthy on localhost:3000. Backend and database were not changed.
- Production Playwright before the CSS repair: 30 passed; the independent visual finding remained open despite those tests.

## Final rebuilt acceptance
- Independent G4 verdict: product accepted; brief sections 1-31 implemented. Section 32 is the root's ten-point final report.
- Production Playwright: 30 passed in 20.3 seconds, exit 0. Command (from frontend): `npm.cmd exec playwright test e2e/test-5-camera.spec.ts e2e/test-5-photo-editor.spec.ts e2e/test-4-editorial.spec.ts e2e/test-4-photo-editor.spec.ts e2e/living-issue.spec.ts -- --workers=3 --output=test-results/test-5-acceptance`, with `PLAYWRIGHT_BASE_URL=http://localhost:3000`.
- Independent no-JavaScript direct and click screenshots: clean hero, journey display none, scrollY=0, header top=0. Root inspected final-nojs-direct.png too.
- Final source build, lint and typecheck passed; Docker frontend rebuilt and healthy after the CSS repair.
- Independent Chrome journey includes normal/reverse scroll, keyboard navigation and opening the form; console error/warn arrays empty. Public route smoke plus /admin/login: HTTP 200 and no page/console errors.
- Both G4 discoveries closed; scoped craft reviews clean. SHA256 audit repeated after final repairs: 187 unchanged source files.
- Inherited source limitation at 1280x720: cover photography extends beyond its paper frame. Source and target match; this cover behavior was deliberately preserved.
- AGENTS.md outside-marker prefix and suffix hashes unchanged; memory describes actual code and verified commands.
