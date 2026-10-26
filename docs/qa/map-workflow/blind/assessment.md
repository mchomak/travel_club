# Independent blind acceptance — 2026-10-26

No drift from the seven textual brief requirements was observed in this independent main-flow walkthrough.
Read only the original brief and its additions under `.autopilot`; no specification, tickets, manifest or their summaries were read.
Target: already-running production app `http://localhost:3031`; isolated backend container `tc-map-workflow-backend`.
Geoapify configuration, tiles, route, city search and reverse responses were browser fixtures. Google coordinate-link resolution, auth, trip creation, saving and reloading used the running application.

| Brief requirement | Result | Observed evidence |
|---|---|---|
| 1. Taller stable map | Implemented | 1440px viewport: 1121×560 before/after opening transport dialog. 390px: 309×380; 320px: 239×380 before/after opening event dialog. Document width equalled viewport on both mobile widths. |
| 2. Google link first, confirmation, collapse/change, no coordinates | Implemented | Initial picker offered Google link; actual coordinate URLs produced a confirmation option. Selected, reopened, changed URL and saved. No latitude/longitude fields. Geoapify reverse fixture displayed name and street address in collapsed state. |
| 3. Flight countries and cities | Implemented | Typed country prefixes, selected Russia/China and dynamic city suggestions Moscow/Shanghai. Departure country/city shared y=438.5, country x=844 and city x=1132.5. Reloaded API returned RU/Москва and CN/Шанхай. |
| 4. Transport endpoints, calendar order, manual text and car estimate | Implemented | From ranked museum 10:00 first; To ranked garden 12:00 first for 11:00–11:09 transfer. Existing places selectable; custom “Личный вход QA” accepted. Taxi showed 9 min; bus showed manual-time instruction. |
| 5. Automatic numbering | Implemented | Created flights without editing titles: Перелёт 1, Перелёт 2; confirmed persisted titles after reload. |
| 6. Compact day boundaries and ordered options | Implemented | Dropdown order: current-day museum 10:00, garden 12:00; other-day event; then events without addresses. Selected museum/garden persisted after reload. |
| 7. Add automatic car/walk transfer | Implemented | Selected drive and added Такси 1: 11:51–12:00, duration_seconds=540. Selected walk in another day and added Пеший переход 1: 10:46–11:00, duration_seconds=840. Both persisted after reload; taxi retained pending price. |

Execution: Playwright `browser_navigate` and independent `browser_run_code_unsafe` interaction snippets; author test suite was not rerun as acceptance.
Read setup from `frontend/e2e/trip-map.spec.ts`, then followed an independent UI scenario with different dates, names and route measurements.
Shell setup and cleanup used `docker exec -i tc-map-workflow-backend python -c` with `create_admin` and SQLAlchemy deletion scoped to random login `blind_a26f4819`.
Setup exit 0. Cleanup exit 0, exact output: `own trips deleted: 1 own admin deleted: True`.
Screenshots: `route-1440.png` (88737 bytes), `route-390.png` (73445 bytes), `route-320.png` (72489 bytes); 320px screenshot visually inspected.
Limits: no live Geoapify credentials or geographic accuracy claim; original six chat screenshots were not available; keyboard Escape inside a dialog dropdown was not covered. No application/test files changed.
