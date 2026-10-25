# 01 — Shared mobile reader and continuous issue

**Requirements:** R01, R02, R03, R04, R08i, R09i  
**Blocked by:** none  
**Zone:** `frontend/src/components/test_mobile/`, `frontend/src/components/test_15/`, `frontend/src/app/test_15/`, `frontend/e2e/test-15-mobile.spec.ts`  
**Wave:** 1  
**Status:** ready

## What should work

Create a static mobile reader wrapper that reflows the two existing pages of one original spread into a readable vertical sequence without changing the magazine source. Demonstrate it at `/test_15` as one continuous seven-chapter issue with a compact sticky chapter rail. A reader can start immediately, jump to a named chapter, and follow the original links.

## From the brief

> “проверить можно ли страницу test_13 корректно адаптировать для мобильных устройств”
> “сделать разные варианты развертки ... на test_15 test_16 test_17”

## Implementation notes

- Read `/test_13` exports in `interfaces.md`; use `MagazineSpread({ index, reveal: "static" })` and keep all source text, facts, images, alt text, and hrefs. Do not edit `/test_13` or shared magazine files.
- Expose the contract `MobileIssueSpread({ index, className? })` from `test_mobile/issue-content.tsx`. Its CSS module owns only mobile reflow/reset rules.
- Add noindex metadata and a direct-reading entry state. Do not require the cover action, page-turn animation, WebGL, hover, or swipe.
- Render all seven spreads in one reading column. Keep the sticky chapter links compact, reachable by touch, and give headings enough scroll margin not to hide below the rail. Track the active chapter in an accessible way.

## Acceptance

- [ ] `/test_15` presents all seven complete original spreads (left page followed by right page) and all original links; the route is noindex and `/test_13` files remain unchanged.
- [ ] On 320×700, 390×844, and 844×390, body copy is at least 16px, touch targets at least 44px, the document has no horizontal overflow, and the sticky rail does not cover a selected chapter heading.
- [ ] Every chapter can be reached by a named link and keyboard; current chapter is communicated; reduced motion is respected.
- [ ] `frontend/e2e/test-15-mobile.spec.ts` checks the seven chapters, responsive overflow, and a chapter jump; focused Playwright run passes.

## Return

Commit the ticket changes locally. Report changed files, focused check output, and any content element the mobile layout could not safely reflow.
