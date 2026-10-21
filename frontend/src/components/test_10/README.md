# /test_10 — interactive editorial magazine

An isolated desktop homepage prototype: exactly three two-page spreads, with no
ordinary vertical homepage underneath. `/test_8` is unchanged.

- `magazine-experience.tsx` owns the current spread, 450 ms turn lock, keyboard,
  edge buttons, contents and browser history. `spread=1|2|3` opens directly;
  invalid/repeated values become `spread=1`, preserving unrelated query values.
  There is no wheel interception. Links keep their normal browser behavior.
- `magazine-intro.tsx` reuses the actual `/test_7` scene and eight-leaf preset
  used by `/test_8`. Its optional whole-spread endpoint fits the measured live
  book instead of focusing the right page. Default scene behavior is preserved.
- `capture-page.ts` snapshots the already rendered first left page into a
  self-contained SVG/canvas texture. Local photos, logo and actual font files
  are embedded; computed layout is retained. The final turning back therefore
  matches the live Hero. This is a temporary GPU texture, never uploaded/saved.
  During the final turn the live right page shows through a depth cutout;
  at TARGET both live pages replace the scene at the same projected corners.
- The same DOM book remains mounted. On handoff/skip/failure the scene, textures,
  renderer, observers and listeners are disposed; no WebGL RAF runs while reading.
  Hidden tabs pause the existing scene clock. Reduced motion skips the intro
  and ordinary leaf animations, including when the preference changes at runtime.
- `magazine.module.css` owns the common physical book, fold, page depth and
  double-sided CSS turn. Turning copies are inert/hidden from assistive technology
  and are removed after 450 ms. All meaningful actions remain DOM links/buttons.
- `spreads.tsx`, `spreads.module.css` and `data.ts` own page compositions and copy.
  They reuse `createSiteVariables(BASE_TOKENS)`, TC Golos/TC Lora and the supplied
  `/test_9` SVGs. New photographs and provenance are in `public/test_10/`.

Supported scope is desktop >=1100 × 700 px. The requested 1280/1440/1728/1920
widths at 768/900 heights fit without scrolling. Smaller windows show an ordinary
site link. There is no mobile book UX, backend, editor, form persistence or new
business API. The full Thailand story does not exist yet: its labelled CTA opens
`/archive`. NEXT ISSUE is BUILDING, without confirmed dates/destination/price.

The SVG snapshot has been verified in Chromium. If assets, canvas capture or
WebGL are unavailable, the fully usable DOM magazine is shown. Firefox/Safari
capture fidelity is not established by this prototype's browser verification.
Skip aborts local fetches and guards every scene callback. Browser font/image
decode promises already in flight may finish afterward; they cannot create a
late scene or replace the readable book.

From `frontend/`:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test -- --run --testTimeout=15000
npm.cmd run build
$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'
npm.cmd exec playwright test e2e/test-10-magazine.spec.ts e2e/test-8-concept.spec.ts e2e/test-7-handoff.spec.ts -- --workers=1 --output=test-results/test-10-production
node scripts/capture-test-10.mjs
```

Capture script defaults to dev3001; set `PLAYWRIGHT_BASE_URL` for production.
Intro frames and measured corners are saved in `docs/qa/test-10/`. Default scene
regressions must run alongside the new route tests whenever shared scene options
change. Always use a dedicated Playwright output directory during parallel QA.

Final verification on 18 October 2026: lint, typecheck and production build
passed; Vitest 119 tests in 26 files passed. Docker frontend rebuilt healthy.
On production localhost:3000, all 23 Playwright cases passed (6 new magazine
checks and 17 test_7/test_8 regressions). The 24-view final desktop matrix had
no document/page overflow or broken images. The decoded 1440 × 900 test_8
before/after screenshots matched pixel-for-pixel; protected source hashes were
unchanged. Full report and final screenshots: `docs/qa/test-10/README.md`.
