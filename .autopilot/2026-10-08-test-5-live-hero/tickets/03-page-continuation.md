# Task 03 — Continue the live homepage through the right magazine page

Requirements: R10, R11; preserve R01–R09. Read the executor contract and this run's current interfaces/spec. Root owns this metadata, independent review, full checks, commit/push and Docker.

Product zone: `frontend/src/components/test_5/`, acceptance zone `frontend/e2e/test-5-camera.spec.ts`. Keep the one live `EditorialHome` DOM. The magazine page should show hero followed by existing Contents / three formats / lead form in the same continuous reduced layout. Add only a semantic end marker at the existing form wrapper if required; do not alter wording, photos, styling, or normal final homepage. Measure untransformed offset geometry during resize/fonts/ResizeObserver, fit continuation height + site width within right page, and grow the current clip to that end marker. Preserve native/reverse scroll, camera stability, #start/no-JS/reduced motion, inert, and photo/form state.

Acceptance at desktop 1440×900 during the open spread: real hero, Contents, formats, and form fit inside the right paper and are visibly rendered (bounds + hit-test), with one copy each and no large empty lower area. Capture screenshot evidence. Regressions: camera suite at 1920/1440/1280/768/390 plus current source routes; on tablet/mobile retain the adapted camera without horizontal overflow and verify final #start/homepage and native scrolling unchanged. No dependencies or commits by executor.

Report exact validation commands and counts, artifact path, actual changed files, public seam/data marker and any concerns. Root performs lint/typecheck/unit/build, browser review, Docker restart, scoped commit and push.
