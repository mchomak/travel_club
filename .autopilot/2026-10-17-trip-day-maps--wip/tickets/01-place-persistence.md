# 01 — Сохранение мест событий и настроек дня

**Требования:** R03,R08,R09,R10,R11,R15,R17,R19i,R24i
**Blocked by:** none
**Зона:** backend aggregate models/schemas/trips/migrations/tests; frontend contracts.ts, trips.ts, trip-ui.ts and their tests
**Волна:** 1
**Status:** ready

## Результат
Полный сохранённый документ поездки принимает координаты/места, границы дня и предпочтения способов передвижения. Legacy документы не меняют финансов и календарных смыслов. Основа доступна следующим таскам без выдумывания DTO.

## Из брифа
«события на день они помечались точками на карте»; «изначальная точка это отель или аэропорт»; ранее принято сохранение ручных выборов в существующей поездке.

## Спецификация
spec.md §2 Места (shape only), §4 Порядок (date semantics only), §5 Сохранение и конфигурация (aggregate only), Границы и швы.

## Приёмка
- [ ] MapPlace/TravelMode/MapLegMode shared DTO exactly interfaces; optional frontend props preserve legacy fixtures; newItem/tripInput roundtrip all map fields.
- [ ] Alembic JSONB nullable values + day modes default []; coordinate finite/range/name/URL validation; bounded preferences duplicate pair rejection.
- [ ] API save/read/repeat-save/duplicate preserve values. Item-reference node keys remapped when duplicated. Schema validates references coherently without rejecting legacy/stale harmless preferences.
- [ ] Date shortening map-only days uses existing destructive confirmation; removing items/days doesn't lose unrelated map fields.
- [ ] Meaningful persistence/invalid input/duplicate/date guard tests pass; financial regression suite green.
- [ ] Document final names/types in return contract. No provider API/router/UI/package edits (reserved later).
