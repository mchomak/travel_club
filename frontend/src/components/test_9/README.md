# `/test_9` — twenty Hero studies

This is a local snapshot of `/test_8` with only the Hero replaced. Header,
chapter markup, text, CSS and product selection behavior are preserved. No
changes to `/test_8`, global tokens or magazine mechanics.

## Entry points

- `/test_9?hero=1` … `hero=20`: direct comparison, no repeated magazine intro.
- `/test_9?hero=2&view=issue`: unchanged `/test_7/MagazineHandoff` wrapping the
  selected live page. Query switching keeps the existing DOM and state.
- `HIDE CONTROLS`: removes the panel from layout; `SHOW CONTROLS` at bottom
  right restores it. For screenshots only, the small restore button is hidden.
- `COPY LINK`: copies a direct Hero link. A selected text field is provided if
  clipboard access fails. Browser back/forward restores the variant.
- Invalid, repeated or missing `hero` parameters fall back to 1.

## Files

- `exploration.tsx`, `toolbar.module.css`: comparison state, history, clipboard,
  controls, optional magazine integration. In magazine mode the panel is
  positioned outside document flow so it cannot change the camera origin.
- `variants.ts`: twenty source asset paths and composition IDs. Variants
  11–20 carry individual logo/tagline positions, colors and mobile placements;
  each shows the whole landscape at its original aspect ratio. Integration rating is an art direction
  assessment, not a change to the magazine camera.
- `hero-experiment.tsx`, `hero.module.css`: deliberately different JSX
  compositions and scoped styling, original two SVG logo colors. Variants
  11–20 are the direct-overlay study; the full photo frame remains intact.
- `concept-home.tsx`: baseline page snapshot replacing just the Hero section.
- `concept.module.css`: byte-identical to `/test_8`.
- Local editor files: baseline copies; only `photo-store.ts` changes its
  IndexedDB name to `travel-club-test-9-photos`. Hero study photos are fixed;
  the remaining page retains its context-menu photo editor.
- Assets and provenance: `frontend/public/test_9/`.

The actual baseline container token is **1440 px**, with `100% - 80px` at
desktop/tablet and `100% - 36px` at mobile ≤760 px. At 1920 px this leaves
240 px on each side. This experiment does not introduce a global max-width.

## Checks

From `frontend/`:

```powershell
npm.cmd run typecheck
npm.cmd exec eslint -- src/components/test_9 src/app/test_9 e2e/test-9-heroes.spec.ts scripts/capture-test-9.mjs
npm.cmd test -- --run --testTimeout=15000
npm.cmd run build
npm.cmd exec playwright test e2e/test-9-heroes.spec.ts e2e/test-8-concept.spec.ts e2e/test-7-handoff.spec.ts -- --workers=2 --output=test-results/test-9-production
$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'
node scripts/capture-test-9.mjs
```

From root: `docker compose up -d --no-deps --build --wait frontend`.
Then `python scripts/test9_contact_sheet.py` creates the 4 × 5 contact sheets
and local gallery in `docs/qa/test-9/`. The report there records visual refinement,
sources, compatibility and exact check results.
