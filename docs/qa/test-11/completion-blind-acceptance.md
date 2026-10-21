# Test 11 — independent user acceptance, 19 October 2026

Verdict: **PASS for the requested application experience** at `http://localhost:3000/test_11`. No missing requested chapter, broken primary journey, factual drift, or visual blocker found in this bounded desktop acceptance. Commit, push, final rebuild and delivery explanation remain the root agent's completion steps.

## Independence and method

Read the complete original `.autopilot/2026-10-18-test-11-editorial--wip/2026-10-18-brief.md`, including both additions and the latest 19 October wording. No other `.autopilot` files were opened. Compared those words with actual route/components/CSS/intro/leaf engine, photo manifest, existing archive facts and the live production UI. Did not use existing automated tests as visual proof. No application code changed.

Launched a fresh installed Playwright Chromium context at 1440 × 900 after the root signalled that other browser runs had ended. Walked background click → opening → Hero + Formats → Next Issue → Thailand → China → Archive → Point of View + Start → previous archive → contents jump back to Start → `/start` → empty-form validation → demo completion at `/thanks`. A separate reduced-motion context opened China. A short second opening capture inspected the temporary visual spreads and curved leaves. Personally opened and inspected every resulting PNG listed below.

## Original words against result

| Requested outcome | Status | Actual evidence |
|---|---|---|
| Smoother, more realistic section turns, like the opening | Implemented | Live WebGL leaf with visible curved surface and shadow in `02-curved-leaf.png`; geometry sample curvature 0.7469 and spine error 0. Source uses the existing page deformation, finite 1000 ms motion; test_10 used a 450 ms rigid CSS turn. Five observed next actions completed in 1226–1373 ms including preparation. |
| More gradual text/photo animation, slower than before | Implemented | Early and settled Hero/China captures differ as intended. Photo masks, opacity/rise text, staggered descriptions, archive prints and Start steps assemble over roughly 1.8–2.8 s with overlapping delays up to 1.1 s. |
| FIELD NOTES / CHINA finished in the same style | Implemented | `04-spread.png`: graphite/ice palette, large CHINA, vertical urban image and story with 4 from Moscow + 2 local friends in Beijing. |
| ARCHIVE '25 finished in the same style | Implemented | `05-spread.png`: ochre contact-sheet composition and editorial index of China, Madagascar and Thailand. |
| POINT OF VIEW + START finished in the same style | Implemented | `06-spread.png`: plum/pink paired pages, three principles, clear conversation CTA, process and prototype disclosure. |
| Avoid the fully-visible-then-rehide reveal defect | Implemented | First exposed Hero/China frames keep titles, prices, anchors and CTA present while photos/body copy start hidden; settled captures show the remaining material. CSS pending values match entrance keyframes. No initial full-content flash appeared in captured states. |
| Replace disliked grey background | Implemented | Burgundy/wine background visible around the cover and all spreads. |
| Small distant cover waits for any click on cover/background | Implemented | `00-cover.png` shows cover alone on wine background; log remains `opening / CLOSED` before click at (30,30), then advances. |
| Opening uses temporary visual spreads and stops at Hero + Formats | Implemented | Observed OPENING, SPREAD/FLIP phases and TARGET; `10-opening-visual-spread.png` and `11-opening-leaves.png` show the visual-only pages. Reading then starts at Hero + Formats. Contents has only the six real chapters, not those temporary leaves. |
| Improve hierarchy, typography, icons, colour and small interactions | Implemented | Readable chapter titles/body copy; format icons and compact prices; CTA arrows, coloured format marks and consistent running heads/folios. No text collision or clipping found in the inspected desktop captures. |
| Large desktop magazine, almost full viewport height | Implemented | Live book bounds 1337.59 × 835.98 at x=51.20, y=16 in 1440 × 900, about 92.9% of viewport height; navigation remains visible. |
| Distinct but coherent editorial spreads and title/photo interaction | Implemented | Blue Hero, red circular Next Issue, green image-filled THAI/LAND lettering, graphite China, ochre Archive and plum POV retain the same print furniture while changing composition. |
| Proper Travel Club cover, identity and first issue metadata | Implemented | Inspected gold cover with original logo, sea photograph, МЕЖДУ СТРОК, №01 and editorial metadata. |
| Preserve original three chapters and actual product prices | Implemented | Inspected Hero + Formats, Next Issue and Thailand; prices are 5 000 ₽, 10 000 ₽ and По согласованию. Price note distinguishes service format from trip cost. |
| Preserve real facts, do not invent commercial trips/dates | Implemented | Next Issue explicitly in preparation, no direction/dates announced. Friends' journeys remain pre-launch personal trips. China/Archive facts match actual existing archive sources. |
| Real photos with traceable sources/usage and illustrative labelling | Implemented, repository evidence | Local manifest records seven Pexels primary photo URLs, authors and Pexels License links. Live captions label stock images as illustrative and not team/trip photographs. No incomplete images in inspected settled chapters. External license pages were not independently reopened in this pass. |
| Understand the brand/products and how to leave a request | Implemented | Hero explains three services; Start CTA reaches the existing form. Empty submit focuses contact; demo contact advances to `/thanks`, which explicitly states data was not sent or saved. Real request delivery was not added or claimed. |
| Navigation, repeat visits and reduced motion | Implemented | Five next turns, previous turn and contents jump worked. Returning to Archive settled correctly. Reduced-motion China rendered complete with 0 document animations. |
| Separate experiment, preserve test_10 | Implemented within inspected scope | `/test_11` has its own route, content, CSS and navigation; current source change list contains no test_10 entry. Unrelated pre-existing working-tree changes were not attributed or reviewed here. |
| Screenshots and browser visual refinement evidence | Implemented | Cover, all six final spreads, reveal states, opening leaves, CTA/form and reduced-motion screenshots were generated and personally inspected. |

No application outcome is marked partial or missing. Historical comparison against the original Pinterest image attachments is limited to their descriptions preserved in the brief; the attachments themselves were not available to this reviewer.

## Commands and actual results

From `frontend/`:

```powershell
node test-results/test-11-blind-acceptance/journey.cjs
```

Exit 0: `{"status":"PASS","steps":18,"errors":[]}`. Evidence log: `frontend/test-results/test-11-blind-acceptance/journey.json`. This was a new independent walkthrough, not the existing project test suite.

```powershell
node test-results/test-11-blind-acceptance/intro.cjs
```

First attempt exited 1 because this reviewer initially waited for a nonexistent `FLIP_SEQUENCE` phase. Actual source uses `FLIP_n`; corrected that evidence selector and reran. Exit 0, observed CLOSED → OPENING → SPREAD/FLIP phases → TARGET. This was an evidence-script error, not an app failure.

Personally inspected PNGs in `frontend/test-results/test-11-blind-acceptance/`: `00-cover`, `01-first-reveal`, `01-hero-formats`, `02-curved-leaf`, `02-spread`, `03-spread`, `04-china-reveal`, `04-spread`, `05-spread`, `06-spread`, `07-start-form`, `08-thanks`, `09-reduced-china`, `10-opening-visual-spread`, `11-opening-leaves`.

## Limits

One meaningful desktop journey, one reduced-motion chapter and short opening evidence; no repeated viewport/browser matrix. Frame rate, GPU throughput and real-device performance were not benchmarked. Observed responsiveness and finite completion support functional acceptance, not a universal smoothness guarantee. Build/lint/typecheck/unit/e2e-suite results, final renderer compatibility-only change, final deployment rebuild and Git delivery belong to the root agent's separate verification.
