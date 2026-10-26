# T04 acceptance — 26 October 2026

## Result

All 17 numbered scenarios R63–R79 passed; the R62 fixture and R80 evidence requirements also passed on the real local frontend, authenticated API, and PostgreSQL. The main fixture uses a random temporary admin; browser requests create and save trips normally. Cleanup removes only that run's admin, login-attempt rows, and owned trips. No credentials were logged. Map-provider configuration, tiles, and route responses are deterministic test stubs; auth, trip API, save/reload, database reads, and financial calculations are real.

## R62–R80 evidence

| Requirement | Action and observed result |
| --- | --- |
| R62 | Created an 8-day, 5-participant Japan trip with two flights, two hotels, a meal, activity, and local transport. Main scenario: `e2e/trip-builder.spec.ts`, “builder round-trips…”. |
| R63 | Created the draft from the new-trip form; saved title, Nov 1–8 date range, 5 participants, and CNY base currency. Landed on builder stage 2. |
| R64 | Added two long-haul flights through the stage 2 UI form. Verified local dates/times and offsets in the API; the overnight Beijing–Tokyo item displays as two calendar-day segments. |
| R65 | Added Tokyo and Kyoto hotels through the stage 3 UI form with Nov 2–5 and Nov 5–8 stays. Verified each save, both hotel rows, and their calendar spans. |
| R66 | Confirmed flights and hotel spans appear in the shared calendar immediately after save; the overnight flight uses separate departure/arrival day segments. |
| R67 | Loaded first-day meal and activity data through the authenticated trip API, then verified both in the day program. The activity has a map point and three participating guests. |
| R68 | Used next/previous day controls; checked selected-day URL values and return to day 1. |
| R69 | Renamed the tea event from the shared calendar and waited for the acknowledged save. |
| R70 | Renamed that same stable-UUID item again from the day list; verified the API contains the new title once. |
| R71 | Selected the garden marker and checked the corresponding day-list item becomes selected. Map route/tiles are stubbed; item, boundary, and trip persistence remain real. Existing Leaflet, provider-error, and keyboard-marker regressions also passed. |
| R72 | Reloaded and reopened the saved builder, entered the full editor, returned to the builder at stage 4, and directly opened `builder?step=4&day={day-id}`. Verified stage 4 and day 4 are restored. |
| R73 | Ran direct SQL constrained by the fixture trip UUID and its random test owner: 8 `trip_days`, 7 remaining `trip_items` after deletion, unique item UUIDs, persisted offsets, amounts, and `cost_total=30150.00`. |
| R74 | Moved the tea item from day 1 to day 2 using its edit form. API and direct SQL both show the original UUID on day 2. |
| R75 | Deleted the local taxi through the UI and confirmed deletion. Checked it is absent and no item UUID is duplicated. |
| R76 | Verified backend Decimal total `30150.00 CNY`; SQL also shows the tea's original and normalized amount as `500.00` at rate `1.00000000`. |
| R77 | Opened and saved an overnight item with both legacy offsets null in the full editor; local times and null offsets remain unchanged. A separate pre-upgrade migration proof confirms existing rows survive the schema upgrade unchanged. |
| R78 | Aborted the first save, observed the error, retried successfully, then delayed a write while making a newer day change and verified the last revision. A separate 409 version-conflict case proves the local draft remains visible until explicit reload. |
| R79 | Verified three desktop columns, two tablet columns, no horizontal overflow, and interactions at desktop/tablet sizes. Captured [desktop](../../test-results/trip-builder/desktop.png) and [tablet](../../test-results/trip-builder/tablet.png) screenshots. |
| R80 | Combined browser and DB checks verify actual create/save/reload, relationships, UUID stability, Decimal amounts, auth protection, and same-trip consistency between builder and full editor. |

## Follow-up evidence — R51 and 390px route

- The added `e2e/trip-builder.spec.ts` flow edits an already-saved overnight flight in the UI from Nov 1–2 to Nov 3–4 and an already-saved hotel from Nov 2–4 to Nov 6–8. The API returns each original item UUID exactly once with the edited dates/day IDs and unchanged flight offsets.
- Calendar assertions confirm the old flight segments and hotel markers are gone, the new flight segments and hotel span/check-in/check-out markers appear (including the calendar's second date page), and the day program contains the flight only on days 3–4 and the hotel only on days 6–8. API day totals move with the items; hotel night allocations are compared using Decimal arithmetic.
- Direct SQL reads only the fixture trip owned by the random admin and the two known item UUIDs. It confirms the same item relationships and eight unique trip-day IDs/dates; no unrelated user rows are queried.
- The original `route-390.png` was captured while the item panel was still exiting after the test changed viewport from desktop to 390px. The updated real-browser scenario waits for the 220ms close animation before its idle capture, then opens the item form at 390px, waits for its enter animation, verifies the dialog and edit controls fit the viewport, cancels, checks visible route controls and adjacent workspace geometry, and captures a clean idle state: [route-390.png](../../docs/qa/map-workflow/route-390.png). No product layout repair was needed.

## Migration proof

An isolated temporary PostgreSQL database was upgraded to pre-offset revision `d71ce9ab402f`. A legacy trip, two days, and overnight item were inserted while the offset columns did not yet exist. After `alembic upgrade head` (head `e82b73ac51d9`), direct SQL confirmed the trip and item retained their title/date, local times `23:00`–`02:00`, amount/normalized amount `25.00`, and trip total `25.00`; both new offsets were `NULL`. The proof rows used trip UUID `7b8643e0-d1c4-4b1f-8fb5-880000000001` and item UUID `7b8643e0-d1c4-4b1f-8fb5-880000000002`. Only that temporary database was dropped afterward.

## Checks and runtime

Run from `frontend/` unless noted:

| Command | Result |
| --- | --- |
| `npm.cmd exec playwright test e2e/constructor.spec.ts e2e/trip-map.spec.ts e2e/trip-builder.spec.ts -- --workers=1 --output=test-results/r51-combined` | 42 passed, 0 failed (2.7 min), including the marker keyboard regression, R51 date edits/API/SQL proof, and 390px idle/form interaction assertions. |
| `npm.cmd exec playwright test e2e/trip-builder.spec.ts -- --workers=1 --grep "editing saved flight and hotel dates" --output=test-results/r51-date-edit` | 1 passed, 0 failed (11.7 s); targeted R51 date edit flow. |
| `npm.cmd test -- --run --testTimeout=15000` | 237 passed in 50 files. |
| `npm.cmd run lint` | Passed. |
| `npm.cmd run typecheck` | Passed. |
| `npm.cmd run build` | Passed. |
| `docker compose up -d --no-deps --build --wait frontend` (repo root) | Exit 0; frontend reported healthy. |
| Backend baseline, run independently by root: isolated `pytest` | 174 passed. |
| Backend baseline, run independently by root: `ruff check .` | Passed. |

The prior T04 browser run used the rebuilt Compose frontend; PostgreSQL/backend remained healthy. The follow-up browser suites used the active local frontend and real authenticated API/PostgreSQL. Builder screenshots are in `test-results/trip-builder/`; the clean mobile route capture is `docs/qa/map-workflow/route-390.png`.

## Limits

- Flight offsets are manually entered minute offsets, bounded to ±14 hours and stored as a pair. There is no city/IANA-zone lookup or automatic DST rule application. Old rows stay nullable and retain legacy local-time behavior.
- Map provider calls are stubbed in these browser tests. The run verifies map-to-item selection and local persistence, not external provider availability or live geographic accuracy.
- Exchange rates remain manual per trip; no FX service or booking provider was added.
