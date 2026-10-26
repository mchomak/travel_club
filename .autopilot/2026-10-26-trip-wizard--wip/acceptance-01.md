# Таск 01 — фактическая проверка, 26 октября 2026

## Runtime и отдельная БД

Рабочие production-контейнеры не пересобирались, рабочая БД не изменялась. PostgreSQL используется из существующего Compose, но все тесты выполнялись на отдельной `travel_club_timezone_test`.

Однократная подготовка, выполнена успешно из корня:

```powershell
docker compose exec -T postgres createdb -U travel_club travel_club_timezone_test
docker compose run --rm --no-deps -e POSTGRES_DB=travel_club_timezone_test -v "${PWD}/backend:/app" backend alembic upgrade head
```

База создана с нуля, все миграции до `e82b73ac51d9` применены. Для повторных проверок БД уже готова; повторять `createdb` не нужно. Секреты берутся через существующий Compose env_file, URL/пароль не выводятся. Bind mount `/app` обеспечивает проверку текущего source вместо старого image.

Полный backend прогон из корня:

```powershell
docker compose run --rm --no-deps -e POSTGRES_DB=travel_club_timezone_test -v "${PWD}/backend:/app" backend sh -c "pytest -q && ruff check ."
```

Последний результат: **170 passed, 1 warning, 23.79s; Ruff All checks passed; exit 0**. До таска — 160 тестов, добавлено 10 timezone/migration cases. Существующее предупреждение Alembic `No path_separator found` из research migration test не относится к изменению.

Точечный backend:

```powershell
docker compose run --rm --no-deps -e POSTGRES_DB=travel_club_timezone_test -v "${PWD}/backend:/app" backend pytest -q tests/test_transport_timezones.py
```

Проверены настоящий API→PostgreSQL→GET→duplicate→allowlisted preview, UTC chronology, pair/range/strict integer validation, westbound same local date, previous local arrival date, midnight, legacy null и migration на populated legacy row без изменения цены/названия.

## Frontend

Из `frontend/`:

```powershell
npm.cmd test -- --run --testTimeout=15000
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

Результаты: **47 files, 216 passed** (baseline 210); lint **0 errors/0 warnings**, typecheck exit 0, актуальный production build exit 0. После последней правки effect dependency дополнительно выполнено `npm.cmd test -- src/components/trips/item-form.test.tsx src/components/trips/trip-calendar.test.tsx src/lib/trip-ui.test.ts` — **3 files/38 passed**. `git diff --check` exit 0.

Публичные red→green проверки: westbound API сначала 422 unknown fields, затем roundtrip passed; calendar ошибочно рисовал legacy overnight, затем endpoints passed; drag ошибочно переносил arrival на следующий день, затем UTC duration passed; форма не имела UTC labels, затем submit/tripInput passed; day-route терял date-line scheduled leg, затем оба local dates passed; time label неверно утверждал next day, затем offsets label passed; preview сначала не отдавал offsets, затем allowlist passed.

## Контракты для следующих тасков

- `ItemInput`/`ItemDocument` и безопасный `PreviewItem`: optional nullable `departure_utc_offset_minutes`, `arrival_utc_offset_minutes`. API требует оба либо ни одного, integers [-840,840], только flight/train_bus/transfer.
- При обоих offsets `end_day_id=null` означает ту же местную дату; автоматический следующий день действует только для legacy null pair. End day может быть предыдущей local date, если UTC arrival после departure.
- `frontend/src/lib/transport-schedule.ts`: `hasUtcOffsets(item): boolean`, `itemEndDate(days,item): string|null`, `resolveItemSchedule(days,item): ItemSchedule|null`, `absoluteLocalMinute(date,minute)`, `localDateAndMinute(value)`, `localMinute(time)`, `offsetLabel(minutes)`.
- `ItemSchedule`: startDate/endDate/startMinute/endMinute/durationMinutes/hasOffsets/localReversed. `durationMinutes` фактическая при pair, legacy wall-clock иначе. Для неполного/неположительного расписания null.
- `buildCalendarEntries` остаётся local; корректный обратный local interval даёт два коротких endpoint markers через `events`, optional `event.endpoint=departure|arrival`. Эти визуальные сегменты не длительность рейса. Уникальные render keys включают endpoint, подписи «Отправление»/«Прибытие».
- `moveEvent` принимает optional UTC fields и сохраняет UTC duration, возвращая local endpoints; caller должен spread исходный item, чтобы сохранить offsets, как уже делает Editor.
- `buildDayRoute` теперь включает date-line scheduled legs и разрешает оба local dates. Boundary multi-day transit остаётся таску02.
- `autoTransferStatus` source signature включает offsets только у timezone-aware source, legacy signatures не меняются из-за пустых полей.
- `timeLabel` выводит оба UTC labels при pair; финансовые данные в preview не добавлены.

## Ограничения

UTC offsets выбираются вручную на дату события; автоматического IANA/DST нет, как решено спецификацией. Реальный браузерный сценарий/обычный compose rebuild выполняются в таске04. При добавлении single-day календаря сохранить полный days и endpoint key для inverse-local flights.

## Дозапрос 1 — исправления после независимого review

Причины: API принимал встроенный tzinfo в полях местных часов; декоративные endpoint markers календаря ошибочно учитывались как интервалы занятости в local transfer conflicts.

Красные regression tests до fix: четыре API case для start_time/end_time/check_in_time/check_out_time с `12:00+03:00` (TypeError либо ошибочный 200 вместо 422); публичный planAutoTransfer после westbound arrival 10:00–10:10 (ложный conflict вместо успешного плана).

Исправления ограничены четырьмя файлами: ItemInput field validator отклоняет embedded timezone понятной 422-ошибкой местного времени; findConflicts пропускает только декоративные `CalendarEvent.endpoint`, продолжая проверять реальные airport blocks. Тест также доказывает сохранение конфликта при airport_after_minutes=60. Схема/прочие поля не менялись.

Финальные проверки после fixes теми же командами выше: backend **174 passed, 1 прежнее warning, 30.04s**, Ruff passed; frontend **47 files/217 passed**, lint/typecheck/production build exit 0; git diff --check exit 0. Targeted backend **14 passed**, auto-transfers **7 passed**.

Снимок только исправлений и новых regression tests: `repair-01.diff` (4 файла). Полный исходный diff туда не включён. Рабочая БД/production images по-прежнему не изменялись.
