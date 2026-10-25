# /test_14 — interview design candidate

Isolated copy of `/test_13`, with seven spreads and the same physical opening/page-turn, keyboard, history, inert and reduced-motion behavior. The page remains noindex and supports desktop windows from 1100 × 700; smaller screens retain the `/test_8` fallback. This iteration proposes the visual direction; it does not finalize shared tokens or modify `/test_8`.

## Art direction

- Desk: **#F0EEE5**, the exact milk surface in `/test_8` Thailand (`concept.module.css`, `.fn-story--thailand`). Navy controls maintain contrast on the light surface.
- Cover: full-bleed Bromo dawn photograph, cream signature, new heading “Искусство быть в пути.” The cover has no experimental or photo-credit annotation. Provenance stays in the asset manifest; alt identifies illustrative imagery.
- Next Issue: ISSUE aligns to the right opposite NEXT; ember **#A93A27** connects the right-page heading, running head, symbols, rule and CTA with the red-orange left page.
- China: jade **#DCE4D9** and tea **#203E39**, with clay year/detail ink. Zhangjiajie and Zhujiajiao replace the hutong photo. Captions distinguish illustrative China imagery from the actual Beijing–Shanghai journey; Zhangjiajie is not presented as a route stop.
- Archive: wine **#6D3739** and rose **#E9E3E2**. An aligned asymmetric photo grid replaces the rotated prints; all three image choices differ from `/test_13`.

## Typography and symbols

Voice: considered, companionable, exploratory. The licensed local inventory includes **TC Golos**, **TC Lora**, and **Barlow Condensed** (`public/test_3/fonts/barlow-condensed.ttf`). Barlow's manifest records normal weight 600 and the adjacent SIL OFL 1.1 license; direct inspection of this file's Unicode cmap confirms Latin capitals but no Cyrillic А (U+0410). Its narrow poster shapes suit short Latin display words, but Russian headlines would fall back to another family, weakening the consistent bilingual rhythm. TC Golos therefore remains the chosen navigation, label and display family; TC Lora supplies contrasting narrative headings. System Georgia/Segoe were also considered as fallbacks, but the embedded local pair gives stable Russian metrics and a consistent printed-canvas capture. No external font dependency is introduced.

Seven authored currentColor SVG symbols stay on their shared 24-unit grid: route, ready, companions, direction, waypoint, note, onward. Existing page furniture, container-relative spacing and finite editorial motion are preserved. The changed color roles are local candidates for later shared-system extraction.

## Cover activation contract

`MagazineIntro` adds `moving: boolean`. A native button covers the visible closed cover and supports click, Enter and Space, with a visible keyboard focus ring. `SpreadSceneOptions.coverProjection?(corners)` projects the actual front-leaf corners into that button's transform; the no-WebGL/reduced-motion fallback uses the same dimensions and perspective as the DOM cover. The button is disabled during opening. The separate open/skip buttons remain; cover revisit retains the current spread and restores focus to the book after opening.

## Assets

Five optimized local WebP files live in `frontend/public/test_14/`; `manifest.json` carries original author/source/license, earlier repository verification and local conversion metadata. These are selected from already licensed repository sources. No photos are generated, no external requests are needed at runtime, and no personal journey or founder photos are invented.

## Verification — 25 October 2026

Commands from `frontend/`:

```powershell
npm.cmd run lint
npm.cmd run typecheck
New-Item -ItemType Directory -Force test-results/temp | Out-Null
$env:TEMP=(Resolve-Path test-results/temp).Path
$env:TMP=$env:TEMP
npm.cmd test -- --run --testTimeout=15000 --maxWorkers=2
npm.cmd run build -- --webpack
$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\McHomak\AppData\Local\ms-playwright'
$env:PLAYWRIGHT_BASE_URL='http://localhost:3114'
npm.cmd exec playwright test e2e/test-14-design.spec.ts -- --workers=2
```

Lint and typecheck passed. Vitest **161 passed / 38 files** after using a shared workspace TEMP/TMP; the sandbox's per-process virtual temp paths otherwise caused ENOENT before tests ran.

CLI Playwright is currently blocked before loading the application by `ERR_NETWORK_ACCESS_DENIED` for both localhost and 127.0.0.1. Its eight behavior scenarios are present but are **not a passing browser result**. Docker local rebuild is blocked by access denied on dockerDesktopLinuxEngine.

`qa-test14-offline.cjs` renders the actual React SSR and CSS with embedded local fonts/images in Chromium, using no HTTP. It verifies final static layouts at 1440×900 and 1100×700, including all changed spreads and the fallback cover. Screenshots are in `frontend/test-results/test-14-offline/`. No heading, paragraph, figure or folio crossed a page boundary in those ten states. This validates layout only; it does not replace live intro/navigation acceptance.

Production verification limitation: both normal and isolated `next build --webpack` compiled the code and completed TypeScript, then the sandbox rejected directory creation during prerender (`EPERM`, first on existing `/test_2`, then `/_global-error` with one worker). Production build is therefore **not reported as passed**. The default Turbopack build stalled in compile and was stopped. Original shared config is unchanged. For review, the source can run with `npm.cmd run dev -- --hostname 127.0.0.1 --port 3114`.


## Mounted client acceptance without HTTP

The browser network restriction was isolated using Playwright `route.fulfill` on a synthetic origin. `qa-test14-bundle.cjs` bundles the **actual** MagazineExperience, React and Three code with the existing Next webpack; `qa-test14-behavior.cjs` serves all bundle, image and font responses from local bytes. No real network request is made and no production UI is reimplemented.

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\McHomak\AppData\Local\ms-playwright'
node qa-test14-bundle.cjs
node qa-test14-behavior.cjs
```

Mounted-client checks passed: Enter/Space; three inside-cover pointer points and outside clicks; reopening through the whole cover with chapter and focus preserved; seven chapters, history and direct URLs; actual projected cover geometry; actual WebGL opening with double activation; reading turn explicitly observed as `data-reading-turn="webgl"` while active, then landed. Final result: zero page errors and zero missing local assets. Evidence: `test-results/test14-behavior/results.json`, `live-closed.png`, `live-active-turn.png`, `live-after-curl.png`. This validates client behavior independently of the blocked real Next HTTP integration and prerender build.
