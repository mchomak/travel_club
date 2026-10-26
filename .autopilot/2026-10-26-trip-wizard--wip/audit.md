# Аудит существующего конструктора

Проведён до изменения кода 26 октября 2026.

## Создание и единое состояние

`new-trip.tsx` → `TripForm` → `tripApi.create`, текущий переход в полный редактор. `TripForm` уже содержит основные/второстепенные параметры. `trip-editor.tsx` координирует все представления одним `DraftSession`/`TripInput`. Очередь PUT сериализована; revision сохраняет последние изменения, version защищает от других вкладок. Ошибка сохраняет draft. Новый builder следует подключить как mode того же Editor, с прежними modal forms и handlers.

## Календарь и формы

`trip-calendar.tsx`: responsive calendar, выбор дня/интервала, drag событий/отелей, аэропортовые блоки. `calendar.ts`: проекция item в timed segments, hotel bars, markers; `calendar-interaction.ts`: move/selection. `item-form.tsx` и `transport-endpoints.tsx`: все категории, местные даты/время, страны/города/географические endpoints, hotel check-in/out, стоимость и режимы, заметки/ссылки. `airport-block-form.tsx`: буферы. `editor-panels.tsx`: DayForm, RatesForm, Finances. Не создавать новые реализации этих форм.

Один день календаря требует optional visibleDayId с ПОЛНЫМИ days. Передача только одного дня ломает overnight/end_day_id/drag. Итог календаря сейчас повторно суммирует полные суммы многодневных items: исправить на calculation.days allocation.

## География и маршрутизация

`day-route.ts/buildDayRoute`: derived boundary start/end, nodes/legs, ambiguity и manual override. Начало от previous hotel night: check_in < date <= check_out; конец: check_in <= date < check_out. Overnight endpoints выше отеля; manual выше auto. Нужно дополнить промежуточные дни многосуточного транзита. `day-route-map.tsx` включает Boundary controls, MapCanvas, routing и logistics; безопасно вынести view parts без второго алгоритма. `map-canvas.tsx`: Leaflet markers/geometry; добавить optional linked selection. `auto-transfers.ts`: только явное создание, duplicate/stale/conflict guards; не запускать автоматически ради соединения точек. Места доступны без provider key, карта/маршруты зависят от существующей конфигурации Geoapify.

## API и PostgreSQL

`backend/app/trips.py`: защищённые create/get/list/update/duplicate/delete/preview. `models.py`: Trip, TripDay, TripItem, TripCurrencyRate; SQLAlchemy relational aggregate. PUT заменяет child rows транзакционно, parent row lock и version защищают от overwrite; populated date shrink требует DATE_REMOVAL_REQUIRED confirmation. Серверный preview использует allowlist. Сохраняем endpoint paths и агрегат. Потерянный ответ после успешного PUT приводит при повторе к 409: draft остаётся, слепой overwrite недопустим.

## Финансы

`backend/app/pricing.py` — authoritative Decimal, PostgreSQL NUMERIC; `frontend/src/lib/pricing.ts` — Decimal preview, shared vectors. Finances/RatesForm уже дают все режимы, participants/room overrides, FX, markup/target margin, прибыль. `Calculation.days` содержит корректное распределение, `general_total` — общие расходы. Новый UI не вводит формулы.

## Необходимая совместимая миграция

Timezone сейчас отсутствует в DB/API; в календаре явно local wall-clock, same-day arrival<departure backend отклоняет. Добавить nullable departure_utc_offset_minutes/arrival_utc_offset_minutes с парной валидацией и диапазоном ±840. Старые null сохраняют legacy inference. Сравнивать UTC chronology, отображать local endpoints, drag сохраняет фактическую длительность. Поля должны проходить input/document/tripInput/duplicate. Текущий Alembic head d71ce9ab402f. Других необходимых schema changes нет.

## План переиспользования

1. Совместимое timezone расширение с API/DB/форма/календарь тестами.
2. Single-day viewport того же календаря, derived day program/review, переиспользуемые boundary/map view parts; day sums из allocation.
3. Builder mode/route, basic creation, six-step composition и navigation над общей сессией, существующие формы/финансы/preview.
4. 8-дневный реальный browser/API/DB сценарий, failure/race/legacy/responsive regression, миграции и запуск.

## Проверки

Существующие seams: draft-session.test, calendar/interaction/test calendar components, day-route/auto-transfers, trip-editor, backend trips/concurrency/pricing/auth. E2E constructor.spec/trip-map.spec уже имеют real auth/API и DB assertions через Docker. Нужен отдельный wizard suite с 8 днями, двумя отелями, несколькими дальними переездами и mixed events, повторным открытием, move/delete/recalc и network failure.
