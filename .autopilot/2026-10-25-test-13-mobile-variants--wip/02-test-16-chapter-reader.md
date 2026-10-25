# 02 — One-chapter reader

**Requirements:** R01, R02, R03, R04, R08i, R09i  
**Blocked by:** 01  
**Zone:** `frontend/src/components/test_16/`, `frontend/src/app/test_16/`, `frontend/e2e/test-16-mobile.spec.ts`  
**Wave:** 2  
**Status:** ready

## What should work

Create `/test_16` as a focused chapter reader. It shows one spread at a time, stacking its two source pages vertically so the original content remains complete and readable. Visitors can choose any chapter, see their place in the issue, and move explicitly to the named previous or next chapter.

## From the brief

> “удобно, читабельно и понятно пользователю”
> “разные варианты развертки для мобильных устройств”

## Implementation notes

- Depend on `MobileIssueSpread` from ticket 01. Do not modify that shared interface or ticket 01's zones.
- Use `?spread=1..7` for direct chapter links and browser history. Read it safely on the server; invalid, repeated, or missing values open the first chapter. Preserve unrelated query parameters only if the chosen Next.js route handling makes that straightforward.
- Previous and next controls state the destination chapter. A labeled native select or equivalent semantic control gives direct access to all seven.
- No page-turn or swipe interaction is needed. Keep the route noindex and do not alter `/test_13`.

## Acceptance

- [ ] Direct URL `?spread=1` through `?spread=7` opens the corresponding complete chapter; malformed/repeated values safely fall back to chapter 1.
- [ ] Only one spread is presented at a time; its two pages are stacked and all original text, imagery, and links remain available.
- [ ] Previous/next controls name their destination, chapter selection is keyboard/touch operable, and back/forward navigation follows the URL state.
- [ ] At 320×700, 390×844, and 844×390 there is no document-level horizontal overflow, body copy is at least 16px, controls are at least 44px, and reduced motion is respected.
- [ ] `frontend/e2e/test-16-mobile.spec.ts` checks selection, a direct chapter link, and the responsive bounds; focused Playwright run passes.

## Return

Commit the ticket changes locally. Report changed files and focused check output.
