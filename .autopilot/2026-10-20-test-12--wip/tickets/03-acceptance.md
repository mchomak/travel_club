# 03 — Проверка интерактивного журнала

**Требования:** R01–R70, G01–G03 (проверка; coordinator выполняет git/rebuild)
**Blocked by:** 01
**Зона:** new test-12 e2e/capture scripts/QA docs; no source edits
**Волна:** 2
**Status:** ready

## Что должно заработать
Набор meaningful browser checks и screenshots доказывает семь глав, Products/About, cue и сохранность TEST_11. Пиши тесты параллельно Ticket02 без изменения его исходников. Предметные ожидания из spec и brief, не снимай expectations с текущего кода. После готовности контента прогон/визуальный просмотр и отчёт, ошибки передавай координатору на repair.

## Из брифа
> «Пройди весь журнал последовательно.»
> «Проверь прямое открытие разворотов.»
> «Сравни контрольные развороты с `/test_11`.»
> «1366×768.» / «1440×900.» / «1920×1080.»

## Спецификация
spec.md S2–S8; interfaces.md полный.

## Приёмка
- Sequential all seven and reverse; direct all seven URL; invalid/repeated query; back/forward; keyboard arrows and next/previous; active nav/focus, real motion path and reduced.
- Cover hint visible pre-hover even ready WebGL; Enter/Space and pointer; intro movement unchanged by source comparison.
- Products correct names/subtitles/prices/service-fee caveat/CTA URLs; equal founders roles, origin, no fake portraits.
- Capture changed 1/2 plus unchanged control chapters at required desktops; check text overflow/overlap and CTA visibility, no console errors; visually inspect images.
- Compare protected chapters 3..7 with TEST_11 2..6 except shifted folios, old files SHA unchanged.
- Existing regression tests remain untouched. Report exact commands/results. Production rerun at coordinator URL after local Docker rebuild. No commits or changes to other session runtime.
