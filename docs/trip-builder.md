# Trip builder

The private trip builder stores one trip aggregate through the existing authenticated trip API. The full editor remains available at `/admin/trips/{id}`; the staged builder is `/admin/trips/{id}/builder`.

## Starting and resuming a trip

Create a trip at `/admin/trips/new` with its title, dates, participant count, and base currency. The basic form can expand **Дополнительные параметры** for its client title, pricing mode, and notes. After saving, it opens stage 2 at `/admin/trips/{id}/builder?step=2`.

The six stages are:

1. Main trip settings
2. Long-haul travel
3. Hotels
4. Day-by-day program
5. Expenses and cost
6. Review

The `step` query parameter is an integer from 1 to 6; a missing or invalid value opens stage 2. Stage 4 also stores the selected day ID as `day`. For example, `/admin/trips/{id}/builder?step=4&day={day-id}` opens that day directly. Reloading or opening this URL restores its stage and day. The full editor's **Пошаговый конструктор** action targets stage 4. Stage and day switches keep the same draft session and update the URL. Leaving for the full editor or client preview waits for the pending save acknowledgement.

## Flights and local time

Scheduled transport can store the nullable pair `departure_utc_offset_minutes` and `arrival_utc_offset_minutes`. Enter both integer offsets, each in the range −840 through +840, or leave both empty. The API rejects partial pairs, invalid ranges, offsets on unsupported item types, and schedules whose resulting UTC duration is not positive.

The calendar keeps the entered local dates and clock times. The elapsed time is calculated as `arrival local datetime − arrival offset − (departure local datetime − departure offset)`. This supports an earlier arrival clock time, overnight travel, and date-line crossings when the elapsed UTC interval is valid. The offsets are manual event values; there is no IANA time-zone database, city-based zone lookup, or automatic daylight-saving adjustment. Confirm each offset for the event's departure or arrival date.

The new columns are nullable so existing items keep their prior local schedule and legacy overnight inference. The additive Alembic migration is `e82b73ac51d9`; it leaves old offset values null. Editing an old item does not assign a guessed time zone.

## Saving, map, and pricing behavior

Authentication, trip reads/writes, optimistic versions, and PostgreSQL persistence remain real. The builder and full editor share the same trip and stable item/day UUIDs. An error or version conflict keeps the local draft available; a save is shown as complete only after the server acknowledges that revision.

The map derives route and stop displays from trip items and day boundaries. Automated browser tests stub map configuration, tiles, or route-provider responses only where the scenario needs a deterministic provider; trip authentication, save requests, and database reads are not stubbed. Manual map points and linked places remain item/day data.

The backend remains authoritative for money and uses Decimal values. The trip base currency and per-item conversion rates are manually entered; no external FX feed is used. Day totals allocate multi-day and hotel costs without counting the same item twice in the trip total.

## Local verification

From `frontend/`, run `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test -- --run --testTimeout=15000`, and `npm.cmd run build`. With the local Compose services and Chromium available, run `npm.cmd exec playwright test e2e/constructor.spec.ts e2e/trip-map.spec.ts e2e/trip-builder.spec.ts -- --workers=3` from `frontend/`. The T04 run and its exact results are recorded in `.autopilot/2026-10-26-trip-wizard/acceptance-04.md`.
