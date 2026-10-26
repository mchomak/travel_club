# Общий контракт конструктора

## Правила

- C:/Users/McHomak/Projects/travel_club, PowerShell. UTF8 явно, npm.cmd. AGENTS.md обязателен. Не менять public pages и чужие untracked HTML.
- Единственный TripInput/DraftSession, backend authoritative Decimal. Никаких stage-specific itinerary copies, dummy transport, формул в wizard.
- API paths сохраняются. Единственная ожидаемая schema migration — nullable UTC pair; отсутствие pair сохраняет legacy semantics.
- Исполнители не коммитят/не меняют git ветки/worktree, state/manifest/interfaces. Shared working tree, зоны последовательно. Код пишет только исполнитель. Документировать найденные швы в возвратном INTERFACES.
- Не добавлять зависимости, если не хватает — вернуть BLOCKED с именем. Никаких новых credentials/services.
- Тесты frontend: из frontend `npm.cmd test -- --run --testTimeout=15000`, один файл `npm.cmd test -- src/lib/calendar.test.ts`; `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`.
- Backend: `docker compose exec -T backend pytest -q`, `docker compose exec -T backend ruff check .`. Для изменённого backend нужен build или локальный тестовый runtime: проверь compose mounts. Проверки используют isolated PostgreSQL, не рабочие поездки; clean migrations в отдельной DB. Не печатать .env/secret.
- E2E из frontend `npm.cmd exec playwright test e2e/constructor.spec.ts e2e/trip-map.spec.ts -- --workers=1`, требует работающего сайта. Изучить fixtures до запуска.
- Промпт исполнителя C:/Users/McHomak/.agents/skills/autopilot/prompts/executor.md читать до edit. Возврат <=25 строк STATUS/FILES/TESTS/INTERFACES/REQUIREMENTS/CONCERNS/BLOCKERS, без кода/diff.

## Границы, решённые в спецификации


| Модуль | Владеет | Выставляет | Прячет |
|---|---|---|---|
| Trip aggregate / DraftSession | Одна поездка, revision, version, errors | tripApi create/get/save/duplicate; DraftSession change/save/subscribe | сериализацию запросов и server reconciliation |
| Transport schedule | Местные endpoints и опциональные UTC offsets | общий schedule helper для calendar/interaction и проверки API | UTC arithmetic, legacy inference |
| Calendar / day program | Производное представление trip.days/items | TripCalendar optional visibleDayId/selectedItemId; getDayProgram(trip,dayId), reviewTrip(trip) | clipping, принадлежность дню, warnings, без persistence |
| DayRouteMap | buildDayRoute, boundary controls, map/logistics | optional layout/parts composition для central boundaries/right map, selectedItemId callbacks | provider requests/cache; без второго алгоритма границ |
| Editor / builder | Общая сессия/handlers/modal forms, six-step composition | TripEditor mode editor|builder, default editor; TripForm basic variant | этап/выбранный день URL и responsive layout |
| Pricing | Существующий backend pricing + TS preview | Calculation.days/items/total и Finances | формулы и округление; не дублировать в wizard |

Швы для тестов: существующие REST/DraftSession, buildCalendarEntries/moveEvent/buildDayRoute, pricing; новый read model getDayProgram/reviewTrip только если нужен для UI, не generic framework.

## Из таска 01 — часовые пояса

- ItemInput/ItemDocument и безопасный PreviewItem: nullable pair `departure_utc_offset_minutes`/`arrival_utc_offset_minutes`, integer ±840; оба/null. Alembic head `e82b73ac51d9`, старые null не меняются. Paths API сохранены.
- `frontend/src/lib/transport-schedule.ts`: `hasUtcOffsets`, `itemEndDate`, `resolveItemSchedule`, `localMinute`, `absoluteLocalMinute`, `localDateAndMinute`, `offsetLabel`; читать точные типы из модуля, не переписывать арифметику.
- ItemSchedule даёт local endpoints, durationMinutes, hasOffsets, localReversed. С offsets null end_day_id означает ту же local date; без offsets legacy next-day inference.
- CalendarEvent.endpoint optional departure|arrival; local reversed intervals — два подписанных endpoint segments. moveEvent сохраняет UTC duration/previous-local-day arrival. TripCalendar имеет корректное доступное имя/локальное время таких сегментов.
- Новые поля проходят ItemForm→tripInput→save/get/duplicate/preview. Финансовые формулы и allocation не менялись.
- Повторяемые проверки: acceptance-01.md. Отдельная БД `travel_club_timezone_test` уже upgraded; backend runtime через `docker compose run --rm --no-deps -e POSTGRES_DB=travel_club_timezone_test -v "${PWD}/backend:/app" backend sh -c "pytest -q && ruff check ."` из корня. Production ещё старый до финального rebuild.

## Из таска 02 — дневные проекции

- TripCalendar optional `visibleDayId`, `title`, `accessibleLabel`, `selectedItemId`, `onSelectItem`; по-прежнему передавать полные days/items. День ограничивается только видимостью; day total строго calculation.days, отсутствующая allocation означает unknown.
- `DayRouteBoundaries(props: Pick<DayRouteMapProps,'trip'|'dayId'|'onChange'>)` — центральные existing controls. Справа `DayRouteMap` с `hideBoundaries`, `selectedItemId`, `onSelectItem`; единственный map/provider/request state у правого компонента. Чистый buildDayRoute общий.
- `buildDayRoute`: source transit для intermediate multi-day dates; manual boundary приоритет. Не создавать фиктивные local legs через транзит.
- `getDayProgram(trip:TripInput,dayId:string):DayProgram {day:DayInput|null,entries:DayProgramEntry[],route:DayRoutePlan}`. Entry содержит item (ID через item.id), segments:CalendarEvent[], startDate/endDate:string|null, startTime/endTime:string|null, durationMinutes:number|null, address:string, arrival/overnight:boolean. Hotel checkout включён, ID dedup, UTC duration из общего helper.
- `reviewTrip(trip):TripReviewWarning[] {code,dayId:string|null,itemIds:string[],message}` — advisory, ссылки на day/items для T03. Точные типы в новом day-program модуле; предупреждения не блокируют draft.
- MapCanvas/TripCalendar поддерживают optional linked selection. Старые default props сохраняют прежний редактор.
- Проверки/композиция: acceptance-02.md. Full frontend226/48files, lint/typecheck/build passed; backend не менялся.

