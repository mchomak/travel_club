# 01 — Make the calendar visibly taller

## Requirement

R03: «Сделать длиннее по размеру, чтобы на экран вмещалось больше событий».

## Finding

G4 found that `maxHeight: 70vh` combined with `minHeight: 720px` leaves the calendar at the old 720px cap for common 768–900px viewport heights. The day remains scrollable, but the change does not show more events there.

## Change

- Increase the calendar's visible height for typical desktop and tablet viewports while preserving a usable minimum height and the ability to scroll through all 24 hours.
- Keep the change local to the calendar surface and its tests. Do not alter event layout, day summaries, or interactions.

## Acceptance

- At both 768px and 900px viewport heights, the visible calendar scroll area is taller than 720px.
- At a shorter tablet-sized viewport, it remains usable and the full day can still be reached by scrolling.
- The component test reflects the new sizing behavior; run the focused calendar test and the relevant constructor browser scenario if practical.

## Zone

- `frontend/src/components/trips/trip-calendar.tsx`
- `frontend/src/components/trips/trip-calendar.test.tsx`
- `frontend/e2e/constructor.spec.ts` only if a browser-level height assertion is needed.

## Executor

Read `C:/Users/McHomak/.agents/skills/autopilot/prompts/executor.md` before editing. Use existing frontend dependencies only. Commit this ticket after the focused checks pass; the final run record and acceptance changes will be committed separately.
