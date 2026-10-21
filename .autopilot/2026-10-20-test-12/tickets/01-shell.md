# 01 — Независимая версия, обложка и оглавление

**Требования:** R01–R16, R53–R59, R65–R68, G01
**Blocked by:** none
**Зона:** app/test_12; test_12 shell/intro/CSS; initial component copy
**Волна:** 1
**Status:** ready

## Что должно заработать
Независимая TEST_12 сначала воспроизводит TEST_11. Полностью скопируй компоненты в локальный test_12 и app route, меняя только локальные import paths/имя page. До последующих изменений сохрани контрольные hash/результат copy parity в QA note. Затем только shell/intro/navigation CSS: «Открыть журнал» видна до hover; короткий мягкий CSS импульс и hover/focus физического объекта в закрытом состоянии, no endless rAF. Сцена после загрузки скрывает DOM cover — подсказка/idle эффект должны работать и с готовым GPU canvas. Сама intro-scene камера/тайминги/сценарий не меняются. Семантическая кнопка сохраняет early click/Enter/Space. Оглавление адаптивно к SPREADS.length и navLabel ?? title, readable hit areas/active/focus, compact horizontal под книгой. Не добавляй седьмую главу здесь — Ticket02 добавит данные и композиции.

## Из брифа
> «TEST_11 — неизменяемая контрольная версия, TEST_12 — новая итерация.»
> «Саму анимацию открытия НЕ МЕНЯТЬ.»
> «Подсказка должна быть видна до наведения мыши.»
> «Сохрани её расположение под журналом и горизонтальный характер.»

## Спецификация
spec.md S1, S2, S5, S7, S8; interfaces.md полный.

## Приёмка
- Полная isolated copy; old source unchanged; engines byte-identical; baseline readable route.
- Cue/hover/focus работают до и после загрузки WebGL, reduced motion не анимирует декор, click запускает исходное intro без изменения камеры.
- Nav loops/URL/active/lock/history derive actual SPREADS length, labels title fallback; явный focus, крупнее области клика.
- Добавь новый shell test при необходимости, только test-12 scope. Проверь targeted lint/typecheck/full unit (113 baseline). Не меняй data/spreads после копирования.
