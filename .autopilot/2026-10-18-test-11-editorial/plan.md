# Travel Club /test_11 Implementation Plan

Goal: один большой художественный журнал для сравнения с test_10.
Architecture: established mechanics adapted locally; shell and art direction separated by fixed React exports. Stack: existing Next.js, React, TS, CSS modules, optional existing Three.js locally. Spec: spec.md. No dependencies or external publish.

## Global constraints

All old routes/shared sources untouched. Dirty work preserved. Three spreads exactly, prices fixed. New photos real/local/source verified/illustrative. Prefers reduced motion includes runtime changes. Product code only subagents.

## Tasks and waves

1. 01 shell (wave1): route, large book/desk, cover opening,450ms nav/history/focus/query, tests. Consumes MagazineSpread/MagazineCover/SPREADS fixed interfaces; exports MagazineExperience.
2. 02 editorial (wave1,disjoint): cover +6 pages/photos/copy/finite animation, exact exports. No shell edits.
3. 03 browser refinement (wave2 after01+02): screenshot matrix+performance, refinements through file owners, production verification, docs.

Plan decision: shell01 and editorial02 parallel despite generic sequential01 rule, since existing shell is established and no shared foundation changes. Exact public exports and zones are fixed before implementation; reduces idle time with no shared writes.

## Steps

- [ ] Run a focused new-route behavior test, demonstrate missing route/red when practical.
- [ ] Implement isolated shell and editorial concurrently, verify exact integration contracts.
- [ ] Run focused tests/lint/typecheck, then full Vitest once. Review each task on manifest/spec/craft.
- [ ] Capture/inspect initial cover+all3 spreads; refinement based on observed hierarchy/crop/geometry/motion.
- [ ] Final production build/Docker local frontend +behavior and regression suites/screenshots.
- [ ] Independent G4 versus original brief only, record limitations; memory from code; final small report.

## Review focus

- Rapid next/back during reveal: correct spread, no stale animation.
- Reduced motion toggled during opening/turn: readable final state, lock released.
- Back/Forward during450ms: authoritative URL and content agree.
- Low supported1280×768: texts/CTAs/page bounds/near-full-height.
- Cover revisited after spread3: returns without resetting reading or stuck inert.

Mapping is generated from requirements.json into per-task requirements and state. G3 forward/backward checked programmatically.
