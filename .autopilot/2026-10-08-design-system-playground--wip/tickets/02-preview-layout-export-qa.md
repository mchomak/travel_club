# 02 — Editorial preview, layout, themes и приёмка

**Требования:** R02, R07–R09, R11, R31–R56, R57–R66
**Дополнения спецификации:** R38.1, R39.1, R42.1, R60.1, R62.1, R64.1, R65.1
**Blocked by:** 01
**Зона:** `frontend/src/app/design-system/`, `frontend/src/components/design-system/`, `frontend/styles/`, `frontend/e2e/`
**Волна:** 2
**Status:** ready

## Что должно заработать

Расширить token controls и первую live sample до полезного инструмента целиком: визуальные шкалы spacing и layout, overlay сетки, все editorial/component примеры, рамки изображений с реальными отношениями сторон, четыре destination theme, responsive canvas на трёх ширинах, локальные reset controls, полный reset, безопасные CSS copy и JSON download. Добавить проверяемые browser scenarios и провести отдельный visual refinement pass.

## Из брифа, дословно

> «за 5–10 секунд понять, как изменение token влияет на реальный сайт»
>
> «Это НЕ четыре разных дизайн-системы. Постоянными должны оставаться: typography hierarchy; grid; spacing logic; component structure; base layout.»
>
> «Добавь: RESET; COPY CSS; EXPORT TOKENS»

## Разделы спецификации

Истории 2, 8–19 и 24–28; Решения §4–10; Границы и швы; Вне рамок.

## Критерии приёмки

- [ ] XS–2XL, section/block spacing, column gap, page padding и editorial gutter настраиваются и наглядно сопоставляются; все layout параметры из спеки управляемы.
- [ ] Overlay 12-column grid показывается поверх композиции, не сдвигая её и не перехватывая ввод.
- [ ] Preview содержит все предоставленные строки, реальные metadata/captions/route/location, product items 01/02/03, CTA, form fragment, фото и editorial primitives.
- [ ] Primary text CTA и secondary arrow link имеют hover и focus-visible; input, textarea, choice/select имеют idle/active/focus/disabled/error examples.
- [ ] Показаны все существующие frame ratios и реальные фотослоты; каждый фото-элемент имеет fixed frame, clipped overflow и `object-fit: cover`.
- [ ] TC/China/Thailand/Madagascar используют согласованные colors/photos/local accents и сохраняют общие type, grid, spacing, components и base layout.
- [ ] Desktop 1440, tablet 768 и mobile 390 реально меняют ширину внутренней responsive composition через container queries; доступен горизонтальный осмотр широкого canvas.
- [ ] Один параметр, группа и общий RESET возвращают соответствующие base values; глобальный RESET чистит localStorage draft.
- [ ] COPY CSS копирует текущие scoped tokens как переносимый snippet; при отказе clipboard появляется текст для ручного копирования; кнопок Save/Write/Apply и endpoint нет.
- [ ] EXPORT TOKENS скачивает валидный JSON с актуальными color/typography/spacing/layout/theme settings.
- [ ] Добавлены Playwright сценарии для preview controls/actions, themes, viewports и отсутствия изменений существующих страниц.
- [ ] Выполнен visual refinement pass по полному checklist; его конкретная коррекция и основание описаны в handoff.
- [ ] Финальные lint, typecheck, Vitest, build, E2E/browser smoke и console checks успешны; изменения ограничены route и новыми token assets.

## Проверка

Запустить frontend lint/typecheck/Vitest/build. Запустить приложение; E2E проверить изменение font size, line-height, color, spacing и container width, четыре themes, RESET, CSS copy и fallback, скачанный JSON, режимы 1440/768/390 и console. Проверить `/`, `/test`, `/test_2`, `/test_3`, `/test_4` с тем же renderer и сравнить существующий editorial layout после task 01.

## Additional refinement acceptance

- [ ] Below 360px preview width, DISPLAY XL/L mobile controls still change computed preview size; no CSS override replaces editable tokens.
- [ ] Each group reset button has a unique accessible name that identifies its section.
- [ ] The editorial headline remains readable in a narrow split preview without breaking the grid.
- [ ] The source mobile clamp curves are preserved in computed preview typography for DISPLAY L (`clamp(38px, 10.8cqw, 76px)` with the below-360 rule) and H1 (`clamp(35px, 10.4cqw, 58px)`); verify at 390px and 320px and prove numeric mobile edits remain effective.
