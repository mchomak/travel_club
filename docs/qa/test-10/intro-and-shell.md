# Intro and magazine shell verification — 18 October 2026

The actual test_7 scene used by test_8 is reused. Shared changes are optional:
whole-book camera fitting, full-spread projection, left target texture and a
second transparent cutout. The normal right-page camera/cutout path is retained.

`frontend/scripts/capture-test-10.mjs` records the closed cover, cover opening,
automatic flips and twenty frames at 25 ms intervals through the eighth turn.
See `intro-final-00.png` through `intro-final-19.png`, `intro-reading.png` and
`intro-final-samples.json`. These were inspected visually: the turning reverse
carries the actual first-page logo, photo and copy, then settles into the live
page without a replacement flash. The preceding printed spread remains behind
the moving leaf until covered. No right-half zoom or later intro replay occurs.

At 1440 × 900, the native reading frame is `(96, 34.5)` to `(1344, 814.5)`.
The last measured projected corners differ by less than 0.001 px. The automated
natural-intro test requires every corner to differ by less than 1 px, requires
TARGET rather than a fallback, and verifies that the WebGL canvas is removed.
There is a small expected sharpening when the projective compositor is removed;
the page geometry and image framing stay aligned.

Shell refinement changed the two-line outer masthead into a single line so it
clears the book at 768/900 heights, raised metadata/navigation to at least 11 px,
kept navigation outside the page content, and moved edge hit areas across the
outer paper boundary. Explicit Skip moves keyboard focus to the live book.

Targeted ESLint and TypeScript checks pass. Six new Playwright cases pass on
dev3001: direct/history navigation; natural whole-book handoff/GPU disposal;
450 ms CSS leaf and overlapping-input lock; reduced motion/query/contents;
Skip/WebGL failure; unsupported-width fallback. Existing-route and production
checks are recorded separately by the integrating agent.

Limit: snapshot capture is verified in Chromium, not Safari/Firefox. Capture or
WebGL failure displays the usable DOM book. Images are illustrative; commercial
trip facts and the unpublished Thailand detail are not invented.
