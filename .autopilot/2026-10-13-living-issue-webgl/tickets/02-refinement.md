# 02 — Visual refinement and measured acceptance

Requirements: all R001–R712, from original brief; ticket01 implementation, ticket02 quality/verification.
Blocked by: 01
Zone: frontend test_6 feature; ticket01 also package files.
Wave: 02

## Result
Starting from working scene, perform three distinct actual before/after visual passes: GEOMETRY, LIGHT/CAMERA, MOTION. Inspect screenshots initial/25/50/75/final; particularly midflip. Change and retest where necessary. Measure performance, browser console, responsive viewports1440/1280/768/390, all controls, reduced-motion, final stop, cleanup. Document findings and results in components/test_6/README.md and verification report, collect artifacts. Final check relevant lint/typecheck/unit/build and production browser after local Compose rebuild if possible.

## Exact brief
“Реализуй реальное изменение vertices.”
“НЕ изменяй /test_5.”
“Не останавливайся на первой работающей версии.”

## Spec
All sections spec.md apply, including full original brief contract.

## Acceptance
- all requested behavior implemented and visually convincing
- all indicated verification executed
- no unrelated changes

## Ticket01 review findings to verify/fix
- artwork.ts font rejection can let another load add after cleanup: failed init must leave no owned fonts.
- natural completion must expose consistent paused hook/report, browser assert TARGET pause.
## Root baseline visual observations
Root final/mid screenshots in frontend/test-results/test-6-root-*.png. Main shadow is too long on floor, adjust key elevation/xyz and softness; root UI variant Pitch18, keyX-2/Y1/Z12, Bend2.05/Curl.9 shortened shadow and improved portrait appearance. These are comparables, not mandatory numbers.

Root initial screenshot: closed cover bounds ~x710..1140 on1440 viewport, apparent centre925 vs viewport720. In camera/composition pass consider gentle initial centering as it opens (no flying entry), since user requests near-centre initial object; full spread current centre is good. Need compare this visually alongside curl and fit.
