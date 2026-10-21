# /test_13 graphic details — 21 October 2026

## Art direction

A small vocabulary of fine routes, open corners and nodal points gives the journal its own travel notation. Seven authored SVGs replace the library icons selectively; two larger marginal marks sit in the quiet Archive and Start headings. The three format actions read as underlined editorial links with the same whole-row hit area.

## Preserved surface

- Only local test_13 components/CSS/documentation and this QA folder changed in this implementation. No data, assets, shared code, previous versions, dependencies or engines changed.
- `before/` contains the coordinator's seven original 1440×900 screenshots and content/link/image/page bounds.
- `after/1440x900/` and `after/1100x700/` contain all seven final chapter screenshots, contact sheets and `capture.json` (text, URLs, image src/alt/bounds, page bounds, h1/h2/h3 bounds and direct block bounds).
- `after/report.json` compares the initial graphic pass with the supplied 1440 baseline: zero differences across all seven chapters for text, links, images including bounds, page bounds and labels. The later D01 spacing correction below intentionally changes only service-row internals. The baseline has no per-heading bounds.
- At 1100×700, an original service-table overflow was found: the third row ran into the terms/footer area. Before the compact correction, restoring the old CTA surface produced unchanged content geometry (`legacyCtaGeometryUnchanged=true`); `after/1100x700/legacy-cta-comparison.png` records that original overflow with the old dark surface. It is a diagnostic screenshot, not the final design.
- The scoped width ≤1200px **or** height ≤790px CSS correction tightens only service-page internal spacing, title size and line-height whenever either axis limits the book. Body remains 13px. Third-row bottom is 524.375px and terms begin at 529.266px at 1100×700. Page geometry, photography and all other chapters retain their layout.

## Browser checks

Both seven-spread contact sheets were inspected. Final 1100 service spread was re-inspected after the compact correction: no overlap or cut-off. New marginal marks clear headings/body at both sizes. Next/Thailand icons remain in their allocated slots.

`capture.mjs` and `interactions.mjs` are local Playwright QA scripts, not application dependencies or mirrored unit tests. `after/interactions.json` records:

- transparent format action surface, inherited navy, permanent 1px rule;
- hover/focus with unchanged bounds, 190ms transition and a 2px rule movement;
- keyboard Enter on the whole service row navigates to /formats;
- all symbols are decorative/non-focusable;
- static symbols are visible, pending symbols are effectively hidden through existing reveal parents, settled-enter symbols are visible on chapters 1/3/4/6/7;
- reduced-motion screenshot state keeps the whole layout readable and controls focusable.

## Verification

Development URL: http://localhost:3113/test_13. Lint and typecheck passed after the SVG/CTA change. Final checks after the compact correction are recorded below. Existing tests were reused; no new implementation-mirroring tests were added.

Initial dev run (2 workers, default 30s timeout): 23 passed, 1 timeout in the seven-chapter motion test. Concurrent build/browser activity may have contributed; this is a hypothesis, not an established cause. A serial rerun uses 60000ms timeout without changing test code or engines.

Final development verification: lint passed; typecheck passed; the same 24 existing Playwright tests passed with one worker and 60000ms timeout (2.1 minutes). This includes all seven chapter reveals, forward/backward turns, keyboard navigation, capture/engine identity, reduced motion, fallback and the established CTA regression. No test files changed.

## Final coordinator verification

Commands run from `frontend/` unless indicated otherwise:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test -- --run --testTimeout=15000
npm.cmd test -- --run --testTimeout=15000 --maxWorkers=2
npm.cmd run build
```

- Lint and typecheck: exit 0.
- Default unit run: 112 passed, one timeout in the unrelated playground-shell test during parallel QA. Sequential rerun with two workers and the same 15000ms timeout: 113 passed in 26 files, 28.62 seconds.
- Final production build: exit 0. The first rebuild returned EBUSY while standalone was running; after stopping standalone, the rebuild succeeded.
- Final production browser suite with one worker and 60000ms timeout: 38 passed, one failed, 3.2 minutes. The inherited test-12 pointer-activation/skip scenario encountered a detached element. The same unchanged scenario passed separately with one worker and its original 30000ms timeout: one passed, 2.1 seconds. Thus 39 unique scenarios passed across these runs; the entire final suite did not pass in one run. Concurrent execution is a possible timing factor, not a proven cause.

The production suite and isolated retry commands were:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://localhost:3114'
npm.cmd exec playwright test e2e/test-13-motion.spec.ts e2e/test-13-refinement.spec.ts e2e/test-12-magazine.spec.ts e2e/test-12-review-comments.spec.ts e2e/test-11-reveal.spec.ts e2e/test-10-magazine.spec.ts -- --workers=1 --timeout=60000 --output=test-results/test-13-graphic-details-final
npm.cmd exec playwright test e2e/test-12-magazine.spec.ts -- --grep 'pointer activation supports skip' --workers=1 --timeout=30000 --output=test-results/test-13-graphic-details-legacy-skip
```

Final production visual evidence is in [production/report.json](production/report.json), [1440×900 contact sheet](production/contact-sheet-1440.jpg) and [1100×700 contact sheet](production/contact-sheet-1100.jpg). Fourteen final screenshots cover all seven spreads at both sizes. At 1440×900, all seven spreads preserve text, links, page bounds and image bounds exactly. All three format links reached /formats through keyboard activation; page and network errors were empty. The compact correction leaves a 4.89px gap between the third service row and terms at 1100×700.

Independent blind acceptance passed 14/14 spread views, all three CTA checks, normal page turns and ArrowRight navigation with zero page errors. Independent SVG/CTA and compact-layout reviews passed. The QA detector returned an empty findings list. The coordinator's scoped diff check confirmed no changes to old versions, shared code or dependencies (exit 0).

The `after/` contact sheets have been regenerated from their final individual PNGs. `production/contact-sheet.jpg` is an alias of the final 1440 sheet. Original baseline images and the explicitly labelled legacy-overflow diagnostic remain for comparison; stale result-sheet versions were overwritten.

## D01: either-axis and ordinary-desktop spacing correction

The final compact condition uses width ≤1200px **or** height ≤790px. The former AND condition missed narrow/tall and wide/short books. A second original overlap was measured at 1440×900: the final format action extended to 711.797px while terms began at 704.938px. Reducing only format-action vertical padding from .38em to .12em removed it without changing heading size, body size, photos, terms position or page geometry. Service-row internal positions may change; pixel equality for those internals is no longer an acceptance requirement.

The [five-size browser measurement](after/compact-axis-report.json) records all five passing: 1100×700, 1100×900, 1440×700, 1280×720 and 1440×900. At 1440×900, the final row ends at 701.516px, its actual CTA at 692.766px and body at 666.859px; terms begin at 704.938px. The actual content clearance is 12.172px. The [full first-spread screenshot](after/1440x900/spacing-correction.png) was inspected after this correction. Earlier after-capture JSON and sheets document the preceding graphic pass; the coordinator's rebuilt production evidence supersedes them for this final spacing correction.

After the final OR/.12em correction, `npm.cmd run build` exited 0. With `PLAYWRIGHT_BASE_URL=http://localhost:3114`, `npm.cmd exec playwright test e2e/test-13-motion.spec.ts e2e/test-13-refinement.spec.ts -- --workers=1 --timeout=60000 --output=test-results/test-13-graphic-details-final-css` passed all 11 tests in 37.5 seconds. The coordinator updated production/report.json, all 14 production PNGs and all three production contact sheets; the final 1440 main view was visually checked.
