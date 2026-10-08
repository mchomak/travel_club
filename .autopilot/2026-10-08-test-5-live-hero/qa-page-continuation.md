# QA — Right page continues through the homepage

Date: 2026-10-09. Scope: R10/R11, `/test_5` only.

- Red acceptance on `localhost:3001`: failed because Contents, formats, and the form extended beyond the open right-page bounds and failed hit-testing. Green after the change: 1 passed.
- Responsive camera regressions on `localhost:3001`: 7 passed, covering 1920/1440/1280/768/390 (plus landscape), endpoint/reverse, source `#start` parity, reduced motion, and fast-wheel reverse.
- Visual evidence: `frontend/test-results/test-5-page-continuation/1440-open-spread.png` shows the actual hero, contents, three formats, and form continuing almost to the bottom edge of the page.
- `npm.cmd run lint` passed; `npm.cmd run typecheck` passed; Vitest: 73 passed in 16 files; `npm.cmd run build` passed.
- Docker: `docker compose up -d --no-deps --build --wait frontend` completed; frontend healthy, `/test_5` returned HTTP 200. Production Playwright camera, photo-editor, `/test_4` editorial/photo, and Living Issue suites: 35 passed.
- Protected source check: 194 files unchanged. No dependencies added.
- Review: Manifest/Spec clean. Craft had no blocking finding; it recorded three nonblocking opportunities to strengthen the visual assertion. The saved browser image was also inspected directly.

An earlier attempted dev run used `127.0.0.1:3001` while Next was served at `localhost:3001`; Next's cross-origin HMR guard prevented hydration (4 passed / 11 failed). This run is invalid as product evidence. All reported dev results above use the matching `localhost` origin. Production suite was run against `localhost:3000` after the Docker rebuild.
