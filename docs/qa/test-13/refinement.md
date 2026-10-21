# TEST_13 — slower motion and hidden destination content

Follow-up, 21 October 2026. Requested: slower/smoother editorial motion; no destination-text flash before reveal; open button under the journal; taller chapter buttons on hover; commit, push and rebuild the local preview.

## Cause and changes

The destination's `pending` CSS explicitly restored editorial text to opacity 1. Both the stationary destination and the back of the captured leaf therefore contained text before `enter`; the new animation then hid it again. A real-GPU navigation regression reproduced the bug with five visible About text groups (opacity 1 instead of 0).

Pending now hides only editorial text, legacy text groups, new icons and drawn rules. Fixed running-head text remains visible. The same CSS applies to live pages and pending capture markup. Static/outgoing captures and finished pages remain fully printed. Existing intro, physical turn engines, photographs, masks and timings are unchanged. Reduced motion resets the pending hiding; disabled animations still leave entered content readable.

Headings reveal in 1000/1200 ms; text groups take 650 ms with 160 ms stagger, finishing within 1.93 s. Lines take 450/650 ms and icons 550 ms. The gentler easing avoids the former fast initial snap. Hover feedback remains responsive.

The semantic open button is below the closed cover with a 44 px minimum hit target and a visible focus ring. Chapter buttons grow from 44 to 50 px upward on hover/focus without stretching fonts. A fixed 52 px navigation slot reserves the space, with layout containment; the book, neighbouring buttons and active underline keep their positions.

## Verification

- Regression was red against the old production preview: incoming About headings, name, role and body were visible in pending.
- Three new browser regressions pass: pending text/rules hidden while fixed print stays visible; close-below-cover button placement/click; upward navigation growth with stable book/indicator geometry.
- The existing handoff test now observes DOM insertion as well as attribute changes. This samples the actual source/landed phases instead of racing a transient state through several Playwright round trips.
- Visual review: real WebGL cover and reading/hover state at 1100×700, 1440×900 and 1920×1080.
- TypeScript and lint passed. Docker production build passed; the isolated container serves http://localhost:3114/test_13 (HTTP 200).
- Final browser/unit counts are recorded below after the production run.

## Design detector review

The hook flags height transitions. The chapter-button height change is intentional: the user explicitly requested taller buttons; it is bounded to 6 px inside a fixed, layout-contained navigation slot. Regression checks prove that the book, neighbouring layout and underline do not move. No ignore/suppression configuration was added. The manual detector returned an empty findings array for the changed targets.
## Final result

Production Playwright: **39 passed (1.1 min)**, including 3 new regressions, the TEST_13 motion suite and TEST_12/11/10 checks. Vitest: **113 passed / 26 files**. Lint, typecheck and Docker production build passed. SHA256 of all 424 protected frontend files match, with zero changes.

From `frontend/` in PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://localhost:3114'
npm.cmd exec playwright test e2e/test-13-refinement.spec.ts e2e/test-13-motion.spec.ts e2e/test-12-magazine.spec.ts e2e/test-12-review-comments.spec.ts e2e/test-11-reveal.spec.ts e2e/test-10-magazine.spec.ts -- --workers=2
```
