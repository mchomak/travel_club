# Границы, решённые в спецификации

| Модуль | Владеет | Выставляет | Прячет |
|---|---|---|---|
| API и данные пункта | допустимые типы, subtype, длительности аэропорта, сериализация | существующий `TripInput` / `TripDocument` | миграцию и SQL |
| Расчёт | итог пункта и группировку | `calculate_trip(TripInput)` и `calculateTrip(TripInput)` | формулы и округление |
| Календарь | производные блоки аэропорта и положение во времени | `buildCalendarEntries(days, items, dates)` | разрезание по дням и обрезку |
| Редактор | выбор категорий, формы и сохранение | существующий `TripEditor` / `ItemForm` | состояние панели и черновика |

Швы проверки: API TripInput/TripDocument, `calculate_trip`/`calculateTrip`, `buildCalendarEntries`, поведение редактора.

## Правила проекта

- FastAPI, SQLAlchemy 2, Alembic, PostgreSQL; Next.js 16, React 19, TypeScript.
- Backend финансовый источник истины; денежные расчёты на Decimal, не менять существующие формулы без причины.
- Создание/правка поездки через существующий авторизованный API и `DraftSession`.
- Сохранённые старые типы пунктов остаются читаемыми и финансово неизменными.
- Не изменять несвязанные пользовательские файлы и незакоммиченные `Travel_Club_*.md` и `.playwright-mcp/`.
- Проверки: `docker compose exec -T backend pytest -q`, `ruff check .`, `alembic check`; frontend `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run test:e2e`.
- Если зависимость отсутствует, сообщить `BLOCKED`; не ставить пакеты без согласования с оркестратором.

## Из таска 01 — данные и расчёт

- `ItemType` дополнен `meal`; старые типы сохранены для чтения прежних поездок.
- `ItemInput` / `ItemDocument` / `PreviewItem`: `subtype`, `airport_before_minutes`, `airport_after_minutes`; backend возвращает явные значения 180/60 по умолчанию, TypeScript поля могут быть необязательными для старых фабрик.
- Подвиды: transport `bus/train/taxi/rental/water/other`; meal `restaurant/cafe/bar/street_food/other`; activity `excursion/activity/other`; other `insurance/sim/communication/visa_fee/service_fee/other`; flight/hotel без подвида.
- `calculate_trip(TripInput)` и `calculateTrip(TripInput)` учитывают еду в существующей финансовой схеме. Подвид и длительности аэропорта стоимость не меняют.

## Из таска 02 — выбор категорий

- `trip-ui.ts` выставляет `eventCategories`, `extraExpenses`, `subtypeOptions`, `eventCategory`, `displaySubtype`, `itemDisplayLabel`, `newCategoryItem` для редактора и следующих календарных изменений.
- Пять кнопок событий создают пункт в дне; отдельные кнопки допрасходов под календарём создают пункт без расписания, по умолчанию `per_person`.
- Старые `train_bus`, `rental`, `insurance`, `excursion` остаются читаемыми в форме и списке без изменения финансовых полей.

## Из таска 03 — блоки аэропорта

- `buildCalendarEntries(...).airportBlocks` возвращает производные блоки с `itemId` исходного рейса. `airportBlockInterval(item, days, kind)` вычисляет внешний интервал по локальным датам и часам.
- `TripCalendar.onOpenAirport(itemId, kind)` открывает `AirportBlockForm` через `TripEditor`; форма сохраняет длительность у рейса через `DraftSession`.
- `tripInput(TripDocument)` переносит `subtype`, `airport_before_minutes`, `airport_after_minutes` в повторно сохраняемый документ.
- Блоки не являются `TripInput.items` и не участвуют в `Calculation`; перемещение/удаление рейса меняет их автоматически.
