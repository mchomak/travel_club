# Specification — test_14 visual iteration

Independent copy of test_13 at /test_14, including its local intro/capture/page-turn engines, seven spreads, metadata and direct spread links. No modifications to test_13/test_8/shared base tokens. Preserve factual product/trip content and desktop minimum 1100x700 fallback.

## Acceptance stories
- R01/R02: /test_14 and spread=1..7 work independently; source versions unchanged. Keep invalid/repeated query normalization, back/forward, keyboard, cover revisit, reduced-motion and canvas capture.
- R03: determine actual milk token used for Thailand in test_8; use as desk surface with legible navy controls and restrained shadows; no pink gradient.
- R04: whole visible closed cover opens via pointer, Enter or Space, and existing open button still works. No full-screen invisible hit area. No double opening during animation; revisit restores activation and focus. Visible focus treatment.
- R05/R06: new cover photo, layout and headline with production-facing editorial language; remove experimental labels and visible photo annotations from cover. Keep accurate alt and provenance in asset documentation. Do not pretend illustrative photos are personal trip documentation; do not invent founder portraits or activate real request submission.
- R07/R08: NEXT at left and ISSUE at right; Next Issue right page echoes warm red-orange through restrained type/rule/detail accents. Maintain readable prose and original text reveal.
- R09: replace China palette and photos in both pages with recognizable China architecture/landscape, cohesive aesthetic, intentional crop. Use local optimized assets with attribution/source/license provenance. No external image requests at runtime.
- R10/R11: replace Archive yellow, image selection and composition, removing tape/pin/rotated print styling. Use an editorial grid or aligned triptych with clear reading order and unchanged travel facts.
- R12: cohesive local provisional color/type/spacing/icon roles using existing TC Golos/TC Lora and authored seven-symbol set. Avoid new font or icon dependencies; these remain candidates for final extraction.

## Boundaries
Single executor owns route, local components/assets and behavior tests; browser checks through existing page DOM/data attributes. Existing public-site token adapter and asset collection are read-only sources. No backend/auth/schema changes.

## Verification
Lint, typecheck, relevant unit tests, production build, Playwright for closed-cover pointer/keyboard/revisit, navigation all seven spreads, direct URLs, source regression, reduced motion, compact supported viewport and unsupported fallback. Visually inspect cover, Next Issue, China, Archive at 1440x900 and 1100x700; no overflow, overlaps, broken images or runtime errors. Update local README with actual commands/results. Rebuild local frontend container if available so localhost:3000/test_14 serves new code; this is local preview, no external deployment.

## Out of scope for this iteration
R13 final shared design-system extraction and R14 applying it to test_8: explicitly after iterative approval of test_14. No changing prices/product structure, real forms, invented facts, backend, payments or hosting.

## G2 clarification
R12 requires an actual typography choice after inspecting available local fonts, not automatic retention: evaluate TC Golos/TC Lora against other existing licensed local families and select cohesive readable editorial/sans roles; explain choice in README. Reuse existing authored symbols as the proposed set unless a clear inconsistency warrants local refinement. New font packages are unnecessary; licensed local font assets may be selected. This overrides any above wording that fixes families without evaluation.
R01 prerequisite: verify the connected directory C:/Users/McHomak/Projects/travel_club before copying; it is now accessible and git status was checked. If access drops, report it and do not claim edits.
