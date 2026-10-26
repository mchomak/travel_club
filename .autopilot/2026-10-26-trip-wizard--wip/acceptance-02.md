# T02 — calendar/day projections acceptance

2026-10-26. Frontend only; no dependencies, API, schema, public pages, TripEditor, TripForm or routes changed. No commits or workspace/branch changes.

## Verified

- Before: 217 frontend tests in 47 files (T01 handoff). After: **226 passed, 48 files**.
- From `frontend/`: `npm.cmd test -- --run --testTimeout=15000`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build` all exit 0 after the final code change. `git diff --check` exits 0.
- Backend, Compose and browser E2E were not run: this task provides frontend core seams; wizard composition and integration are T03/T04 work. Existing backend/pricing formulas were not changed.

## Red → green evidence

- Single-day calendar initially rendered three day cells and the old accessible name; now one selected day shows the overnight arrival, while full source days retain correct edit/select/create/drag callbacks.
- Calendar allocation test initially rendered full hotel cost and omitted untimed per-day allocation; now day totals are 110/110/10, general 7, trip 237 RUB. No item-price fallback exists; missing allocation shows unknown, including empty days when the calculation is unavailable. Old summary fixtures/assertions were updated to the explicit allocation contract.
- `buildDayRoute` intermediate transit initially returned a hotel boundary; now both boundaries are transit, there is no invented local leg, and a manual boundary still wins.
- New `getDayProgram` first implementation returned only source-day entries; the behavior test failed with missing arrival and checkout. Membership now uses calendar projection, route transport coverage and endpoint dates, includes hotels through checkout, and deduplicates item IDs.
- New `reviewTrip` empty result failed against expected actionable warnings. It now reports blank days, conflicts, missing nights/places/prices/FX and ambiguous boundaries without mutating input. Transit nights and the last trip day produce no invented missing-night warning.
- Legacy midnight arrival initially disappeared from the next day. Regression then exposed its incorrect late ordering; arrival sorts at 00:00 and checkout retains the hotel address. Additional cases cover untimed multi-day transit, real westbound duration (300 minutes, rather than visual 15-minute endpoints), hotel change, ambiguity and manual override.
- Map marker selection initially lacked pressed state and callback. It now updates numbered markers while retaining camera bounds and the map instance.
- Split boundaries/right map initially rendered duplicate boundary controls; now one `DayRouteBoundaries` plus `DayRouteMap hideBoundaries` has one control pair, one provider state, four expected mode requests, aggregate updates and linked selection. Existing boundary/stale-transfer/conflict/ordering controls remain covered by the existing suite.

## T03 interfaces

`TripCalendarProps` adds `visibleDayId?: string | null`, `title?: string`, `accessibleLabel?: string`, `selectedItemId?: string | null`, `onSelectItem?: (itemId: string) => void`. Always pass the **full** `days` array to both calendars. These props constrain display only; omitted props retain the existing full-calendar UI. A clicked existing item calls selection and then the existing open handler; drag remains governed by the existing callbacks.

`DayRouteMapProps` adds `hideBoundaries?: boolean`, `selectedItemId?: string | null`, `onSelectItem?: (itemId: string) => void`. Existing props are `trip: TripInput`, `dayId: string`, `onChange: (patch: Partial<TripInput>) => void`, `onAddTransfer?: (item: ItemInput) => void`, `onOpenItem?: (itemId: string) => void`.

`DayRouteBoundaries(props: DayRouteBoundariesProps)` is exported from `day-route-map.tsx`; its props are `Pick<DayRouteMapProps, 'trip' | 'dayId' | 'onChange'>`. Mount once in the central column; mount one `DayRouteMap hideBoundaries` in the right column. Boundaries compute the same pure `buildDayRoute` but own no map/provider/request state. `BoundaryResolution.source` adds `'transit'`.

`MapCanvasProps` adds `selectedItemId?: string | null`, `onSelectItem?: (itemId: string) => void`; its nodes accept optional `itemId?: string`.

`getDayProgram(trip: TripInput, dayId: string): DayProgram` and `reviewTrip(trip: TripInput): TripReviewWarning[]` are exported from `lib/day-program.ts`.

`DayProgram = { day: DayInput | null; entries: DayProgramEntry[]; route: DayRoutePlan }`.
`DayProgramEntry = { item: ItemInput; segments: CalendarEvent[]; startDate: string | null; endDate: string | null; startTime: string | null; endTime: string | null; durationMinutes: number | null; address: string; arrival: boolean; overnight: boolean }`.
Use `entry.item.id` for actions/selection and `entry.item` for editing. Times/dates retain original local endpoints; `segments` supplies clipped selected-day positioning. `durationMinutes` comes from `resolveItemSchedule`, never endpoint decoration. Untimed items have null duration. Hotel check-in/out dates/times remain in the item and entry.

`TripReviewWarning = { code: 'blank_day' | 'time_conflict' | 'missing_night' | 'missing_place' | 'ambiguous_boundary' | 'missing_price' | 'missing_fx'; dayId: string | null; itemIds: string[]; message: string }`.
Warnings are advisory and do not block saving. Missing price uses existing `price_pending` or an empty price; an explicitly entered zero remains a legitimate free item. A missing exchange rate must still fail through existing authoritative calculation/save validation; this read model does not calculate money.
