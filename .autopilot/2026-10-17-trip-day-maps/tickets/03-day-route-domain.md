# 03 — Логика начала, конца и участков дня

**Требования:** R02,R03,R08,R09,R10,R11,R12,R17,R19i
**Blocked by:** 01
**Зона:** frontend/src/lib/day-route.ts (new) and day-route.test.ts only
**Волна:** 2
**Status:** done — 105 frontend tests; дозапрос1 закрыт, Manifest/Spec/Craft blocking нет.

## Результат
Pure buildDayRoute API turns saved itinerary into deterministic route nodes and legs, explaining inferred boundaries. No UI/provider HTTP. Use existing calendar local schedule/legacy overnight semantics.

## Из брифа
«изначальная точка это отель или аэропорт, или другое событие если оно стоит на ночь, нужно это по умному определять»; приняты конец следующего отеля и ручной выбор при неоднозначности.

## Спецификация
spec.md §4 полностью, §3 scheduled legs and missing connectivity, Границы и швы. interfaces.md shapes.

## Приёмка
- [ ] Hotel last-night/next-night date predicates incl checkout outside trip; changed hotels; overlapping stays produce explicit ambiguous state, explain choice.
- [ ] Overnight flight/train/other arrival/departure precedence, explicit end_day, legacy end<start, scheduled transport endpoints never become driven airport-airport route. Handle same-day transport and overnight endpoints correctly.
- [ ] Stable chronological timed events and persisted manual order untimed. No optimization. Ignore pure financial costs, don't duplicate multi-day hotels as visits.
- [ ] Unknown place breaks route rather than bridges events; start/end missing no fake 0; manual overrides and saved per-pair mode preferences hold stable across reordering.
- [ ] Pure tests for all boundary/ambiguity/hotel switch/transport/day switch/missing coord cases and formats. Use existing calendar helpers, no new financial/timezone model.
- [ ] Return useful helpers for UI total/format/mode preference update if appropriate and document signatures; no UI/shared contract edits without root coordination.
