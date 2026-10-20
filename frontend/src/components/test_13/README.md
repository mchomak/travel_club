# /test_13 — Между строк

Independent noindex iteration of `/test_11`, supported from **1100 × 700 px**. The original routes, shared design system, assets and backend remain read-only. Seven spreads / fourteen reading pages:

| Chapter | Contents label | Editorial title | Folios |
| --- | --- | --- | --- |
| 1 | Услуги | Hero + Formats | 02–03 |
| 2 | О нас | О нас | 04–05 |
| 3 | Первая поездка | Next Issue | 06–07 |
| 4 | Таиланд | Thailand ’26 | 08–09 |
| 5 | Китай | China ’26 | 10–11 |
| 6 | Архив | Archive ’25 | 12–13 |
| 7 | Начать | Point of View + Start | 14–15 |

The cover is separate from these chapters. Field Notes describe private trips with friends before the club launched; the photographs remain illustrative. Next Issue is in preparation. Existing functional `/formats`, `/start` and `/archive` pages are unchanged; `/start` remains a prototype.

## Files and contracts

- `../../app/test_13/page.tsx` owns metadata and the server parser for `spread=1`–`7`. A spread query opens reading directly. Invalid/repeated values normalize to 1 while preserving unrelated query parameters.
- `data.ts` centralizes `SPREADS` (`title`, `navLabel`), `FORMATS`, `FOUNDER_PHOTOS`, existing `PHOTOS`, archive records and principles. The navigation uses `navLabel`; the printed chapters retain their editorial titles.
- `magazine-experience.tsx` owns the single chapter index, navigation lock, keyboard, edge controls, compact contents, focus and browser history. It derives the chapter count from `SPREADS.length`. Temporary pages are inert and aria-hidden.
- `magazine-intro.tsx` and `magazine.module.css` add a visible opening cue and a finite closed-cover pulse. Opening remains a semantic keyboard-accessible button. The effects stop during opening; reduced motion presents a static state. Returning to the cover retains the current chapter.
- `intro-scene.ts`, `capture-page.ts`, `reading-turn.tsx`, `reading-turn-engine.ts` preserve the copied TEST_11 camera, timing, capture, physical page deformation, fallback and cleanup contracts. They read existing geometry from test_7/test_8. Idle reading has no engine canvas or requestAnimationFrame loop.
- `spreads.tsx` exports `MagazineCover()` and `MagazineSpread({ index, side?, animate?, reveal? })`. `index` is 0–6, `side` is `left | right`, and exported `RevealPhase` is `static | pending | enter`. Static is the complete printable capture state.
- `spreads.module.css` owns cover and reading compositions, including the new founder pair and refined service list. Existing Next Issue, Thailand, China, Archive and Point of View + Start retain their content, artwork, type and reveal, with only the folios shifted.

## Editorial changes

Hero retains the existing mountain, original navy SVG signature and slogan. Its short caption identifies Travel Club as an independent travel editorial project. Services lead with Travel Design / Travel Ready / TC Trips, Russian purpose, concrete benefit and price. Travel Design and Travel Ready prices explicitly cover the club's services; travel expenses are separate. A compact top-right `/start` link and a separate lower `/formats` link replace the duplicated hero action.

About uses the existing Cloud (`#F2F0EA`), Navy (`#172F50`) and Ink palette, bundled TC Golos / TC Lora, large names and mirrored portrait/text columns. Василиса / Рамиль are equal cofounders. The shared origin follows real independent travel with friends, organizing trips, planning routes and exploring places. It introduces individual services and authored group journeys without turning earlier trips into commercial work.

## Replace the two founder portraits

There are no verified founder portraits in the available assets. Each page deliberately displays a named portrait area and states that the real portrait will appear later. No stock or generated person stands in for either founder.

In `data.ts`, set `FOUNDER_PHOTOS.vasilisa.src` and `FOUNDER_PHOTOS.ramil.src` to the paths of the supplied real images. Set each `alt` to an accurate description and adjust `position` (CSS object-position, default `50% 50%`) to frame the face. For example, a supplied file in `public/test_13/` uses a `/test_13/...` source. The `FounderPortrait` component switches automatically from the labelled area to the photograph; no layout changes are needed. Do not relabel an illustrative travel photo as a founder.

Travel photographs remain in `public/test_11/`; their manifest and credits remain there. Logos are read from `public/test_9/`. No new package or environment variable is required.

## Local preview and verification

Use the isolated preview supplied by the coordinator (development `http://localhost:3113/test_13`), not the main checkout's running site. The planned production preview uses a separate container and port. Do not restart other sessions' servers.

From this worktree's `frontend/` in PowerShell:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test -- --run --testTimeout=15000
npm.cmd run build
$env:PLAYWRIGHT_BASE_URL='http://localhost:3113'
npm.cmd exec playwright test e2e/test-13-magazine.spec.ts -- --workers=1
```

Editorial executor verification on 20 October 2026: lint and typecheck passed; Vitest passed all 113 tests in 26 files (same as the starting baseline). A direct Chromium check of chapters 1–2 at 1366×768, 1440×900 and 1920×1080 found no page overflow or clipped text; the 1366×768 compositions were visually reviewed. Production and independent browser evidence belong to the isolated TEST_13 QA report; previous-version counts are not evidence for this iteration.
