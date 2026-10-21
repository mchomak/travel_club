# TEST_13 final motion QA — 21 October 2026

PASS for geometry, content, motion lifecycle, behavior and isolation. Independent pre-motion copy evidence is in [copy-baseline.md](copy-baseline.md); final blind acceptance is in [blind-acceptance.md](blind-acceptance.md). This report supersedes the inherited TEST_12-era README verification.

## Production capture

Fresh isolated production origin: `http://localhost:3114`, after the final CTA underline correction. From the worktree root:

```powershell
$env:TEST13_ORIGIN='http://localhost:3114'
node docs/qa/test-13/motion-capture.mjs
node docs/qa/test-13/natural-hero.cjs
```

Both exited 0. [results.json](motion-final/results.json) records 28/28 exact geometry/text/URL/image/type/final-opacity/transform/clip matches against TEST_12: all seven chapters at 1100×700, 1280×768, 1440×900 and 1920×1080. Capture recorded no console errors, page errors or HTTP error responses. The 1440×900 set includes deterministic early (0 ms), middle (420 ms) and complete frames for every chapter, plus control frames and per-pair geometry reports.

[Contact sheet](motion-final/contact-sheet.jpg) was visually inspected across all seven early/middle/final rows. Reveal and cascade appear progressively; final multiline headings, Cyrillic, service rows, prices, captions, disclaimers and CTA remain complete. Final heading clip resets to none; all recorded clipping ancestors and bounds match the control. Service-row geometry is unchanged. The separate production motion suite checks timing only after handoff, bounded text sequences, revisit replay, no resize/hover replay, static/reduced visibility and preserved photo ancestors.

## Pixel comparison and limits

[pixel-comparison.json](motion-final/pixel-comparison.json) records decoded RGB differences rather than claiming full-page identity. Most pairs differ by four navigation-edge pixels from the new measured underline. A few photo/text compositing edges differ by 27–58 additional pixels. The hero page differs more: 1,196 / 21,209 / 1,694 pixels at the first three viewport sizes, with identical recorded geometry and unchanged photo source/CSS. A natural-animation-completion follow-up (no pause/cancel) also shows this hero raster variance: [natural-hero-pixel.json](motion-final/natural-hero-pixel.json), and [side-by-side crop](motion-final/hero-raster-review.png). The crop is visually equivalent; this is not zero-pixel final parity. The exact compositor/raster cause was not established and is an explicit evidence limitation, not attributed solely to the capture harness. Source preservation plus geometry, final visual inspection and independent natural-reading acceptance support unchanged composition.

Local Chromium and emulated touch were tested; physical devices and other browser engines were not certified. Original founder placeholders, image-filled THAILAND, NEXT ISSUE and hero-slogan effects remain intentional unchanged constraints.

## Effects and completion

The [component README](../../../frontend/src/components/test_13/README.md) maps all seven chapters to six primitives: native REVEAL (480/620 ms), semantic CASCADE (340 ms, 8 px, 90 ms steps, maximum 1.06 s), DRAW (250/380 ms), ICON entry (300 ms), HOVER/focus (190 ms), and one measured navigation underline. Original hero/Thai/China/archive/Next photo effects, delays and masks remain source-identical.

`ReadingTurn.onComplete` calls the existing `finish`, and `introComplete` handles opening completion; only then does the current live spread receive enter. There is one index/turn/ready/reveal lifecycle. Visible base/static CSS and finite backwards fill make new text fail open without animationend locks. Reduced preference resets new effects and interrupts turn; the original compact fallback and no-JavaScript link remain.

The CTA regression first failed with horizontal line scale 0 at rest. Grouped :is specificity overrode the local full-line rule. The corrected low-specificity :where baseline preserves the original 1 px line; hover/focus moves it up 2 px with unchanged link bounds, and reduced motion keeps a static full line. The focused dev regression passed after correction; final production suite and independent six-CTA follow-up passed.

## Engineering evidence

Coordinator commands from `frontend/`: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test -- --run --testTimeout=15000`: passed; Vitest **113 passed / 26 files**. Actual isolated production build from the root: `docker build -t travel-club-test13-preview:local ./frontend` passed. The `npm.cmd run build` command in the component README is the standard standalone reproduction; the verified final build used Docker.

Final production browser command from `frontend/`:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://localhost:3114'
npm.cmd exec playwright test e2e/test-13-motion.spec.ts e2e/test-12-magazine.spec.ts e2e/test-12-review-comments.spec.ts e2e/test-11-reveal.spec.ts e2e/test-10-magazine.spec.ts -- --workers=2
```

**36 passed (1.1 minutes)** after the final specificity fix. Coordinator logs: `.autopilot/2026-10-21-test-13-motion/production-playwright-final.log`, `production-build-final.log`, `handoff-vitest.log`. Scoped source review and independent blind browser review passed; these are separate from the capture probe.

## Isolation

[protected-final.json](motion-final/protected-final.json): all **424** baseline working-byte SHA256 values match, zero mismatches. The coordinator independently confirmed zero protected old frontend changes and clean main/control worktrees. TEST_12/11/10, all other existing routes, shared code, configs, packages, assets, backend and environment files remain unchanged. Local capture/intro/turn engines and data.ts are byte-identical to TEST_12, and the motion suite verifies exact photo rules. No new dependencies, deployment or publication.

## Follow-up — 21 October 2026

Latest motion timings, pending-visibility flash fix, open-button placement and navigation hover: [refinement](refinement.md). Updated production browser run: **39 passed**; the 36-pass run above is the earlier baseline.
