# Границы
- Existing LivingIssue(children ReactNode) owns one live EditorialHome DOM and local camera. Keep route/provider contract, id=start, data-page-masthead and photo DB.
- Hero seam may use one local data attribute/ref in test_5 EditorialHome to measure the actual first screen; avoid content/layout changes in its settled state.
- TIMELINE and smoothing parameters stay local, named and documented; native scroll -> target -> rAF render -> CSS transforms/clip. Cached offset geometry; ResizeObserver/resize/fonts.ready lifecycle cleaned up.
- Allowed product paths: frontend/src/components/test_5/living-issue.tsx, living-issue.module.css, editorial-home.tsx (measurement seam only), README.md; frontend/e2e/test-5-camera.spec.ts. Other paths read-only unless a concrete blocker is reported to root.
- Root owns git, .autopilot and Docker production rebuild. Executor can use dev3001 and must report session/process for root cleanup. No package installs/new dependencies or backend/database operations.
