# 03 — Chapter index and selected story

**Requirements:** R01, R02, R03, R04, R08i, R09i  
**Blocked by:** 01  
**Zone:** `frontend/src/components/test_17/`, `frontend/src/app/test_17/`, `frontend/e2e/test-17-mobile.spec.ts`  
**Wave:** 2  
**Status:** ready

## What should work

Create `/test_17` as an issue index for scanning before reading. The initial screen offers seven clear, visually distinct chapter cards. Choosing one opens its complete spread as a readable story, with a persistent, plainly labeled action back to the index. The browser's back button returns to the index when the visitor entered a chapter from it.

## From the brief

> “если нельзя то в ней мало смысла”
> “разные варианты развертки для мобильных устройств”

## Implementation notes

- Depend on `MobileIssueSpread` from ticket 01. Do not modify its contract, ticket 01's zones, or `/test_13`.
- Use `SPREADS` names and truthful source imagery/copy only. A card may use its title and chapter label rather than inventing an excerpt.
- Use `?spread=1..7` for selected-chapter direct links; no query shows the index. Invalid or repeated values show the index safely.
- Keep all card titles and controls legible at 320px. If cards use images, they must not replace the chapter name or the complete text in the opened view.

## Acceptance

- [ ] Initial `/test_17` shows seven distinguishable cards with source chapter names and a clear prompt to open; the route is noindex.
- [ ] Opening any card presents both original pages of that spread in a readable flow, with all source text, imagery, facts, and links. A labeled return-to-index action is always available.
- [ ] Browser back from a selected card returns to the index; direct `?spread=1..7` links open the selected chapter; invalid values return to the index.
- [ ] At 320×700, 390×844, and 844×390 there is no document-level horizontal overflow; body copy is at least 16px, card/control touch targets are at least 44px, and reduced motion is respected.
- [ ] `frontend/e2e/test-17-mobile.spec.ts` checks all cards, open/return behavior, and responsive bounds; focused Playwright run passes.

## Return

Commit the ticket changes locally. Report changed files and focused check output.
