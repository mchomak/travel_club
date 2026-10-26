# 01 — Часовые пояса переездов и совместимость

**Требования:** R04, R09, R12, R51, R53, R59
**Blocked by:** нет
**Зона:** backend/, frontend/src/lib/, frontend/src/components/trips/item-form*
**Волна:** 1
**Status:** ready

## Что должно заработать

Реализовать §5 целиком, через существующие API и поля item. Nullable pair UTC offsets с additive Alembic migration, Pydantic и SQLAlchemy. UTC chronology, backward-compatible null legacy semantics, full roundtrip/duplicate. Существующий ItemForm получает понятные поля UTC±HH:MM на дату для транспортных событий. Calendar/airport segments остаются local; обратные local intervals и previous local arrival date не исчезают; drag сохраняет UTC duration. Обновить day-route scheduleOf и auto-transfer chronology/signatures при необходимости, не переписывая их. Новый reusable schedule helper допустим, чтобы не разнести правила по UI. Новых зависимостей не нужно. Не менять wizard/new-trip/TripEditor/TripForm, не менять визуальную компоновку DayRouteMap/MapCanvas. Все существующие функции остаются. Backend regression и новые meaningful timezone cases включая westbound same-day, date-line, midnight и legacy null; frontend calendar/drag/form roundtrip. Финансовые формулы неизменны.

## Из брифа, дословно

> «По возможности сохрани существующие API и структуру БД. Если изменения в схеме действительно необходимы, подготовь безопасные миграции с сохранением совместимости существующих поездок.»

> «Для каждого переезда должны поддерживаться пункты отправления и прибытия, даты, местное время, географические точки, стоимость и прочие доступные в текущей реализации параметры.»

> «Учти пересечение полуночи и часовые пояса при работе с перелётами.»

> «Изменение дат перелёта или проживания корректно обновляет связанные дни.»

## Разделы спецификации

§5, §6, §7; Границы и швы.

## Критерии приёмки

- [ ] Чистая миграция и старые записи null совместимы; pair/range/UTC-order серверно валидируются.
- [ ] create/save/get/duplicate сохраняют offset values и прежние local часы, auth/version/date guards проходят.
- [ ] Перелёт с arrival local earlier виден, аэропортовые буферы доступны, move сохраняет duration.
- [ ] Форма даёт понятные ошибки, прежние items не требуют заполнения offsets.
- [ ] Backend pytest/Ruff и frontend tests/lint/typecheck/build проходят.
