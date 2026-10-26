# 02 — Общий календарь и дневные проекции

**Требования:** R17, R18, R26, R27, R28, R29, R30, R31, R32, R33, R34, R35, R36, R37, R38, R39, R43, R44, R45, R46, R47
**Blocked by:** 01
**Зона:** frontend/src/lib/, frontend/src/components/trips/trip-calendar*, frontend/src/components/trips/day-route-map*, frontend/src/components/trips/map-canvas*
**Волна:** 2
**Status:** ready

## Что должно заработать

Реализовать §3/§4 seams для следующего UI таска без самого wizard. TripCalendar optional visibleDayId, accessible label/title distinction, selectedItemId/onSelectItem; полный days остаётся для projections/drag. По умолчанию старый UI неизменен. Исправить daily summary на Calculation.days, не сумму полных items. Derived getDayProgram(trip,dayId) читает все hotel/arrival/overnight/untimed, dedup item ID, время/адрес/duration доступно UI; reviewTrip(trip) выдаёт nonblocking warnings о blank days, time conflicts, missed nights (не транзит), missing places/ambiguity/prices/FX. Переиспользовать buildCalendarEntries/buildDayRoute, без второго алгоритма. Дополнить boundary inference многосуточным transit, manual override приоритетный. Разделить DayRouteMap view для центральных boundaries и правой карты+логистики через optional variant/slots или exports, не дублируя provider state/route computation. MapCanvas linked selection optional. Сохранить прежние формы Boundary, stale-transfer/conflict controls и все старые функции. Не менять trip-editor/new-trip/trip-form/новые routes — это T03. Вернуть точные сигнатуры для T03. Стиль существующий; не вводить зависимости.

## Из брифа, дословно

> «Используй даты проживания для определения предполагаемых ночёвок и начальных/конечных точек дней. При этом учитывай дату выселения и возможность ночных переездов.»

> «Каждый день поездки редактируется отдельно, но пользователь одновременно видит общий календарь всего путешествия.»

> «Сразу под верхней частью размести календарь, который сейчас используется в основном редакторе маршрута.»

> «Отображаются все дни поездки, события, перелёты, отели и временная шкала.»

## Разделы спецификации

§3, §4, §6, §7; Границы и швы.

## Критерии приёмки

- [ ] Single-day viewport показывает ночной arrival при полном days и поддерживает прежние edit/create/move.
- [ ] Hotel/day totals используют allocation; sum days+general=total без двойного учёта.
- [ ] Дневная проекция/проверки покрывают checkout/change hotel/first-last/overnight/multiday transit/manual/missing.
- [ ] Центральные boundaries/right map используют тот же buildDayRoute и синхронное состояние; selection optional.
- [ ] Старые calendar/map tests и новые regression tests проходят, lint/typecheck/build зелёные.
