# Shanghai /test_3 verification

Production URL: http://localhost:3000/test_3

## Final commands

- `npm.cmd test`: exit 0, 67 tests / 14 files passed, including two new form behavior tests.
- `npm.cmd run lint`: exit 0.
- `npm.cmd run typecheck`: exit 0.
- `npm.cmd run build`: exit 0; /test_3 statically generated.
- `docker compose build frontend`: exit 0.
- `docker compose up -d --no-deps frontend`: exit 0; only frontend recreated.
- `git diff --stat`: empty. New source/assets are confined to src/app/test_3, src/components/test_3 and public/test_3. Existing unrelated untracked files preserved.
- Docker backend and PostgreSQL remained running with their previous uptime.

Raw check output is in adjacent unit-check.log, lint-check.log, typecheck.log, build-check.log and docker-build.log.

## Browser evidence

Playwright opened the implementation and production route. Final screenshots: desktop-production.png (1440x900), tablet-production.png (1024x900), mobile-production.png (390x844). Earlier screenshots retain first implementation and refinement evidence.

Measured viewport/document widths match at 1440, 1024, 390 and 320px. Large headings have no clipped scroll width. Dates, eight people and application status are visible in the hero. CTA hash targets all exist. All 18 image elements loaded. No external resource requests or failed requests were observed in the cold production traversal. Full traversal image resources were approximately 1.26 MB decoded body data; total resource bodies approximately 2.22 MB. These are local functional observations, not a throttled performance benchmark. Hero uses eager/high loading; later photographs remain lazy. Fixed image frames and local fonts limit layout shifts.

Day index tracks the containing day, including day 01, 03 and 05. Day 05 reaches 100% night shift. Reduced motion clears live attributes and custom progress values; the first four route days stay paper and the last four use static graphite. Effects clean up listeners and scheduled frames. No runtime errors occurred in the final production pass.

The full mobile form flow exercised empty/invalid errors and first-invalid focus, Telegram t.me input, all seven interest options including exclusive catchall, pace/priority choices, demo confirmation and returning to preserved values with restored name focus. No mutation or API request was made. Confirmation explicitly states no sending, storage or booking.

## Visual refinement

First implementation was reviewed in actual screenshots. Refinements brought date/group metadata into the first viewport, corrected mobile oversized-word clipping, aligned day progress coordinates and current-day selection, kept active cobalt dates readable in every tone, restored form editing focus, and added white keyboard focus indicators on cobalt backgrounds. Photography and form/final CTA screenshots were inspected after refinement. Scoped source remained unchanged after final checks.

## Independent review

Specification coverage: two omissions found and resolved before implementation (performance acceptance and all nine report points).
Craft: clean after bounded fixes to return focus, scroll-coordinate consistency and cobalt focus visibility.
Blind acceptance: accepted with no partial or missing block; independent live Node Chromium runner exit 0, all three target viewport journeys, form/errors/success/edit/reload, reduced motion, CTA and imagery checked. See blind-acceptance.md.
