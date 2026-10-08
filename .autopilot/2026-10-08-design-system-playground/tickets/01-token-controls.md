# 01 — Базовые tokens, редактор и живая типографика

**Требования:** R01–R30, R57–R59, R62–R63
**Дополнения спецификации:** R04.1, R30.1, R54.1, R59.1
**Blocked by:** нет
**Зона:** `frontend/src/app/design-system/`, `frontend/src/components/design-system/`, `frontend/styles/`
**Волна:** 1
**Status:** ready

## Что должно заработать

Открывается внутренний `/design-system` со sticky control panel и отдельным preview. В нём можно поменять все 11 типографических ролей: TC Golos/TC Lora, desktop/mobile size, line-height, weight и tracking. Палитра содержит все заданные брендовые цвета и editorials `/test_2`; color picker и HEX input синхронны. Preview сразу отображает изменённые font/color values. State отделён от base tokens и от UI контролов, живёт в React и может восстановиться как browser draft. UI не пишет в проект.

Первая версия preview показывает реальную иерархию Travel Club для проверки type/color. Завершённая editorial композиция и все остальные группы настроек развиваются в task 02.

## Из брифа, дословно

> «создать отдельную внутреннюю страницу, где я смогу визуально видеть основные элементы дизайна Travel Club, менять их параметры через UI и мгновенно видеть результат»
>
> «font-family; font-weight; font-size; line-height; letter-spacing; цвета; border colors; spacing; section spacing; container widths; gutters; grid; image aspect ratios; кнопки; ссылки; metadata; captions; form controls»
>
> «Интерактивные настройки Playground НЕ должны менять глобальный :root всего сайта во время просмотра.»

## Разделы спецификации

Решение; Аудит и исходные значения; Начальный набор Playground tokens; истории 1–6, 15–16 и 20–23; Решения §1–4; Границы и швы.

## Критерии приёмки

- [x] Прямой URL `/design-system` открывает отдельную страницу без добавления ссылки в публичную навигацию.
- [x] Вся настройка установлена в base token → React draft → scoped preview variables; изменение не устанавливает Playground values на глобальные `:root` или UI sidebar.
- [x] Видны начальные значения из editorial CSS и 12 заданных/source цветов с color picker, валидируемым HEX полем и live swatch.
- [x] Все типографические роли имеют переключение только TC Golos/TC Lora, desktop/mobile size, line-height, weight, letter-spacing; range и number вводы синхронны.
- [x] Начальное состояние использует реальные исходные font imports, размеры и цвета из спецификации; первый визит показывает его без пустого preview.
- [x] Необычный/невалидный HEX не применяется к preview; валидный `#RRGGBB` сразу обновляет оба поля и preview.
- [x] Local draft при доступности сохраняется только в текущем browser origin; отказ/повреждение storage оставляет рабочий in-memory preview.
- [x] Controls имеют доступные labels, фокус виден, группы сворачиваются, по возможности работают reset параметра/группы.
- [x] Нет новых dependencies, API, backend, файловой записи или глобального внедрения tokens; не изменены существующие pages/components/styles.
- [x] В ticket handoff точно указаны экспортируемые типы/функции и файлы, которыми может продолжить task 02.

## Проверка

Запустить `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test -- --run` и `npm.cmd run build` из `frontend/`. Открыть `/design-system`, изменить один font size, line-height и color; убедиться, что live preview обновился, root/controls не перекрасились и reload восстанавливает draft. Smoke-check `/test_2` и `/test_4`.
