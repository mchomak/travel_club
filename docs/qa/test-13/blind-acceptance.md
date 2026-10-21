# TEST_13 blind acceptance — 2026-10-21

Verdict: **G4 PASS — observed flows and the final-production CTA resting/hover/focus retest passed; no blocking gap remains in this acceptance scope.**

This review used only the exact original brief at `.autopilot/2026-10-21-test-13-motion/2026-10-21-brief.md` (additions: none), actual source, Git, and independently launched headless Chromium. No other autopilot files or planner summaries were opened. Runtime was the already-running production preview `http://localhost:3114/test_13`, with same-origin `/test_12` as control. No application source or services were changed by this review.

## Acceptance by requirement group

| Requirement | Verdict and direct evidence |
| --- | --- |
| Independent copy; original versions untouched | PASS, source evidence. Every changed frontend path relative to `3a1dbf7` is inside the new `app/test_13` or `components/test_13` directories. Existing versions, assets, global styles, package files and shared components have no changes. Git contains baseline commit `28c80ae`. `/test_13` imports its own local implementation, rather than aliasing the control route. |
| Seven chapters; original editorial design/content | PASS, runtime. All seven chapters were opened in order and screenshot-reviewed at 1440×900. All fourteen completed pages had zero page overflow. Text, image source/alt/decode metadata, and link text/targets exactly matched control pages in every chapter. Prices and founder placeholders are preserved. Large multiline Cyrillic titles, punctuation, folios, palette and serif/sans composition were readable without clipping in the reviewed captures. |
| Intro preserved | PASS, runtime plus source. Both routes opened from the closed cover through the physical sequence to `TARGET`, ending in reading. Measured click-to-reading was about 3.6 seconds on each route; independently timed screenshots show the same physical spread/camera presentation. `intro-scene.ts`, `magazine-intro.tsx`, `capture-page.ts`, both page-turn files and `data.ts` are byte-identical between versions. |
| Existing photo motion preserved | PASS, source plus runtime sample. All original CSS rule groups for hero sweep, Next Issue aperture, Thailand strips/figures, China images and archive contact sheet are identical. On actual Thailand pages, the five photo objects retained the control's animation names, durations and delays: three strips at 2.2s with 0/.35/.7s delays, figure at 2.3s/.2s and city at 2.3s/.65s. Text annotations intentionally use the new cascade. |
| REVEAL | PASS, runtime. The About heading and both founder names were observed with partial left-to-right clip masks, then complete text. Runtime durations were 620ms for multiline and 480ms for ordinary titles, with founder names delayed 90ms. All completed chapter titles remain normal selectable DOM text. The large Thailand artwork retains its existing photo composition. |
| CASCADE | PASS, runtime. About roles/body/origin arrived at different delays with opacity and 8px rise; runtime duration 340ms. Services are grouped as rows; each row's name, description and price share the same arrival. New editorial animations were observed on every sequentially entered chapter 2–7, and on direct loads. Completed pages contain no indefinitely running editorial animations. |
| DRAW and icons | PASS, runtime/source. Existing running-head, folio, product and content separators animate through 380ms line growth, with folios at 250ms and staggered delays. Runtime CSS animations and pseudo-element transforms were recorded. Existing Lucide icons remain small, thin and colored by their page; short entrance/hover motion is finite. No additional icon package was introduced. |
| Hover/CTA | PASS, runtime. Product icon moves 2px upward, product row rectangle remains identical before/after hover, and keyboard focus produces a visible 2px outline. Enter on the focused row opens the existing `/formats` route. All seven chapters' link targets and labels equal their control counterparts. Source provides arrow/underline responses for editorial CTA and start links without changing target URLs. |
| Navigation | PASS, runtime. All seven direct `?spread=1`–`7` URLs selected their matching chapter and active item. Next/previous and ArrowLeft worked, browser Back/Forward restored the corresponding page and URL, and last-page Next was disabled. The shared underline moved from x=8px through x≈59px/94px to x=94.64px over its 260ms transition. Active labels followed the displayed pages. |
| Start effects only after turn completion | PASS, runtime. Forward traces show static source, pending destination, then `enter` only when `data-turning=false`. A targeted real animation-event capture on the About transition recorded 32 start/end events; zero new editorial animation starts occurred while turning. Text effects then completed in order. Resize after completion caused no restart. |
| Reduced motion and failure paths | PASS, runtime. Reduced-motion direct pages use `static`, with no active animations; ArrowRight reaches the next chapter without a turn. With WebGL contexts disabled, a CSS fallback turn still reaches chapter 2 and readable content. Disabling all CSS animation leaves normal opacity and no heading clips. With JavaScript disabled, the existing visible notice links to `/test_8`. |
| Touch/responsiveness | PASS for inherited scope, runtime. Touch emulation at 1100×700 successfully selected About; its completed composition was screenshot-reviewed. At 390×844 the existing large-screen notice and `/test_8` alternative remain available. No mobile journal redesign was added. |
| Runtime errors / scope | PASS for observed execution. No page errors or console errors were recorded on the main seven-chapter/control/intro journey. No dependency changes, new business pages or unrelated feature additions were found. |

## Verification commands and results

Run from `C:/Users/McHomak/Projects/travel_club/.worktrees/test-13`:

```powershell
node docs/qa/test-13/blind-runtime.cjs
node docs/qa/test-13/blind-motion.cjs
node docs/qa/test-13/blind-rest-check.cjs
python docs/qa/test-13/blind-source.py
git diff --exit-code 3a1dbf7 -- frontend/src/components/test_12 frontend/src/app/test_12 frontend/src/components/test_11 frontend/src/app/test_11 frontend/src/components/test_10 frontend/src/app/test_10 frontend/src/components/public-site frontend/src/app/globals.css frontend/package.json frontend/package-lock.json
git diff --name-only 3a1dbf7 -- frontend/src frontend/public frontend/package.json frontend/package-lock.json
git log --oneline 3a1dbf7..HEAD
```

All final commands exited 0. Runtime results: seven chapters, seven complete control matches, no captured main-journey errors, intro TARGET twice, keyboard/history/CTA/touch/reduced-motion/fallback checks passed. Motion results: 32 events, zero early editorial starts, photo animation signatures equal, all seven direct links correct. Source audit: six protected implementation/data files byte-identical, all eight photo rule groups identical, no existing frontend path changed.

Final-production follow-up after the coordinator refreshed port 3114: `blind-rest-check.cjs` passed six editorial CTA links across chapters 1, 3, 4, 5, 6 and 7. Each resting underline had full horizontal scale 1; each normal-motion hover moved it up 2px, with unchanged link bounds and active keyboard focus. The reduced-motion follow-up retained a fully visible underline at rest and hover with zero vertical movement. This closes the coordinator-reported resting-underline issue through independent runtime observation. Evidence: `blind-rest-check.json` and screenshot-reviewed `blind-cta-final.png`.

Raw evidence: `blind-runtime.json`, `blind-motion.json`, `blind-source.json`; executable probes: corresponding `.cjs`/`.py` files. Images `blind-chapter-1.png` through `blind-chapter-7.png` show all completed spreads; `blind-motion-mid.png` and `blind-touch-final.png` show intermediate and 1100×700 states. `blind-test_12-intro.png` and `blind-test_13-intro.png` show independently timed intro samples.

## Objective limits

The pre-motion copy's browser session was not independently witnessed in this acceptance run; Git and the final control comparisons establish the available copy/isolation evidence. Browser evidence is local Chromium, including emulated touch; it does not certify physical devices or other browser engines. Intro screenshots were independently timed, so they establish the same presentation rather than frame-perfect synchronization; source identity supplies the timing/camera comparison. Detailed live photo-signature sampling covered Thailand; the remaining image-motion preservation is supported by exact CSS/source comparison and completed visual review. This reviewer did not rerun the full regression/build suite; those are separate coordinator checks. No unmet requirement or extra capability requiring a product decision was found within this scope.
