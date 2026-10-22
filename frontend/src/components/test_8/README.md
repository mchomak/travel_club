# `/test_8` — Homepage Concept 01

An isolated version of `/test_7` with the homepage composition and Russian copy
from the supplied `docs/design/references/TC_Homepage_Full_Concept_01.html`. Chapter order: hero,
formats, next trip, Field Notes (Thailand and China), 2025 archive, approach,
conversation/process, footer. The reference's scripts, demo toasts, external
fonts and embedded images are not shipped.

- `frontend/src/app/test_8/page.tsx` composes the existing `/test_7`
  `MagazineHandoff` with one live `ConceptHome` and a local photo editor.
  The eight-leaf opening, camera, projection, native scroll, reverse scroll,
  skip, fragment entry, reduced motion and WebGL fallback use the unchanged
  `/test_7` implementation.
- `concept-home.tsx` owns the semantic page and keyboard-accessible format
  selection. CTA links use the existing `/start?format=route|complete|group`,
  `/formats` and `/archive` pages. Individual archive detail pages do not exist,
  so story links lead to the archive. There is no new form or submission API.
- `concept.module.css` keeps the study's grid relationships while applying
  TC Golos / TC Lora, the existing publication palette and type scale.
  `createSiteVariables()` reads immutable `BASE_TOKENS`; playground drafts
  cannot affect this page. The destination backgrounds match `/test_5`.
- `photo-slots.ts` defines 14 independent editable frames using existing local
  photographs. Ratios belong to the slots, including in the crop dialog.
  The local editor/crop/store files are snapshots of `/test_5`; IndexedDB
  `travel-club-test-8-photos` keeps this experiment's edits separate.
  No new assets, dependencies, environment variables or backend changes.

From `frontend/`:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test -- --run --testTimeout=15000
npm.cmd run build
npm.cmd exec playwright test e2e/test-8-concept.spec.ts e2e/test-7-handoff.spec.ts -- --workers=1 --output=test-results/test-8-production
```

The new browser suite checks chapter order, single live DOM, branding, loaded
photos, frame bounds, local anchors, lack of horizontal overflow at 1440/768/
390/320px, keyboard selection, CTA format, magazine opening/reverse and editor
access. Screenshots are generated under `frontend/test-results/test-8-concept/`.

From the repository root, rebuild the running frontend:

```powershell
docker compose up -d --no-deps --build --wait frontend
```
