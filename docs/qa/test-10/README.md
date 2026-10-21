# TEST_10 — final prototype report

Verified 18 October 2026 on the production frontend at `http://localhost:3000/test_10`.
The experiment contains exactly HERO + FORMATS, NEXT ISSUE and THAILAND ’26.

1. **Files.** New route: `frontend/src/app/test_10/page.tsx`. New local components:
   `frontend/src/components/test_10/` contains the experience, intro, capture helper,
   spread components/data and scoped CSS. Photos/provenance:
   `frontend/public/test_10/`. Tests: `frontend/e2e/test-10-magazine.spec.ts`.
   Reproducible intro capture: `frontend/scripts/capture-test-10.mjs`.
   Shared change is limited to optional configuration in
   `frontend/src/components/test_7/scene.ts`; existing default behavior is retained.

2. **Reuse.** The actual test_7 scene and eight-leaf preset powering test_8 are
   reused, including cover opening, automatic turns, page deformation, lighting,
   shadows and hidden-tab clock handling. Existing `pageMatrix`, immutable
   `BASE_TOKENS`, publication adapter, TC Golos/TC Lora and supplied test_9 SVG
   signatures are reused. No new global design system, dependency or backend.

3. **Intro and handoff.** The optional camera endpoint fits the entire measured
   spread. The actual first left page is captured with embedded local images and
   fonts for the final turning reverse; depth cutouts expose the live DOM.
   At TARGET the same live book becomes interactive and GPU resources are
   disposed. There is no right-page zoom or reintro on navigation. The final
   1440 × 900 projection differs by less than 0.001 px from the native book;
   the browser test requires less than 1 px. See [dense intro notes](intro-and-shell.md),
   `intro-final-00.png` through `intro-final-19.png`, `intro-reading.png` and
   `intro-final-samples.json`.

4. **Navigation.** A double-sided CSS leaf rotates around the spine in 450 ms,
   with perspective and a moving shadow. Edge buttons, ArrowLeft/ArrowRight,
   Previous/Next and a three-section contents control share one state and input
   lock. Direct `?spread=1|2|3`, Back/Forward and invalid-query canonicalization
   work; unrelated query values survive. Native links, focus states, inert hidden
   copies and reduced motion are retained. Wheel navigation is deliberately absent.

5. **Images and rights.** Five new optimized local Pexels photographs: Guilin
   landscape (thanhhoa tran), Guilin mist (Vincent Tan), Thai coastline (Fernando
   Serrilho), boat/atmosphere (Elina Sazonova), Bangkok street (Margarita K).
   All are explicitly illustrative, not team/client photographs or a destination
   announcement. The [asset README](../../../frontend/public/test_10/README.md)
   and [manifest](../../../frontend/public/test_10/manifest.json) record primary
   source links, authors, license, modifications and dimensions. The applicable
   [Pexels License](https://www.pexels.com/license/) permits website use/modification.

6. **Limits.** Desktop scope is >=1100 × 700 px; smaller windows link to test_8.
   Snapshot fidelity is verified in Chromium; Safari/Firefox are not established.
   Capture/WebGL failure, direct links, Skip and reduced motion show the usable
   DOM book. Already-started font/image decode promises may finish after Skip;
   abort/finished guards prevent any late scene creation or handoff. No forms,
   backend, upload/editor or mobile magazine were added. NEXT ISSUE remains
   BUILDING; Thailand is four friends before launch. Its labelled story CTA opens
   `/archive` because the full story has not been published.

7. **Verification and refinement.** Production lint, typecheck and build passed;
   Vitest: **119 tests / 26 files passed**. Docker frontend rebuilt healthy.
   Playwright: **23 passed** (6 new plus 17 test_7/test_8 regressions), using:

   ```powershell
   $env:PLAYWRIGHT_BASE_URL='http://localhost:3000'
   npm.cmd exec playwright test e2e/test-10-magazine.spec.ts e2e/test-8-concept.spec.ts e2e/test-7-handoff.spec.ts -- --workers=1 --output=test-results/test-10-production
   ```

   All three spreads were checked at 1280/1440/1728/1920 × 768/900: **24 views**,
   zero document/page overflow and zero broken images. Data: [final matrix](final-matrix.json).
   Final screenshots: `final-{spread}-{width}x{height}.png`;
   [contact sheet](contact-sheet.jpg). Refinement addressed logo/type hierarchy,
   photo crops/saturation, margins, CTA placement, page balance, fold/shadows and
   readable metadata. The outer masthead now clears the book. With visible images
   decoded, test_8 before/after at 1440 × 900 matched exactly pixel-for-pixel;
   its source and protected pre-existing dirty-file hashes stayed unchanged.

8. **Next iteration.** Validate capture and handoff in Safari/Firefox, then replace
   illustrative Thailand images with verified team photography and publish the
   real Field Note. Decide whether the magazine improves desktop navigation before
   designing mobile behavior or adding any further spreads.
