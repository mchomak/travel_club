# Манифест требований

Источник: `2026-10-08-brief.md`. Строку может снять только пользователь.

| ID | Из брифа (дословно) | Статус | Основание | Где |
|---|---|---|---|---|
| R01 | «создать внутренний Design System Playground для визуальной настройки текущей дизайн-системы сайта» | done | 01 | tickets/01-token-controls.md |
| R02 | «Это НЕ redesign сайта и НЕ задача по переделке существующих страниц.» | done | 01, 02 | tickets/01-token-controls.md, tickets/02-preview-layout-export-qa.md |
| R03 | «визуально видеть основные элементы дизайна Travel Club, менять их параметры через UI и мгновенно видеть результат» | done | 01 | tickets/01-token-controls.md |
| R04 | «Изменения внутри Playground НЕ должны автоматически записываться в исходные CSS-файлы проекта.» | done | 01 | tickets/01-token-controls.md |
| R05 | «используй текущий сайт как источник исходных значений» | done | 01 | tickets/01-token-controls.md |
| R06 | «визуальной базой считай существующий editorial-язык Travel Club» | done | 01 | tickets/01-token-controls.md |
| R07 | «Не переделывай /test, /test_2, /test_3, /test_4 и другие существующие routes; не меняй их визуал без необходимости» | done | 01, 02 | tickets/01-token-controls.md, tickets/02-preview-layout-export-qa.md |
| R08 | «не трогай backend, admin, constructor и unrelated routes» | done | 01, 02 | tickets/01-token-controls.md, tickets/02-preview-layout-export-qa.md |
| R09 | «не внедряй Design System глобально во весь сайт на этом этапе» | done | 01, 02 | tickets/01-token-controls.md, tickets/02-preview-layout-export-qa.md |
| R10 | «Создай отдельный внутренний route: /design-system» | done | 01 | tickets/01-token-controls.md |
| R11 | «Не добавляй ссылку на этот route в публичную навигацию Travel Club.» | done | 01, 02 | tickets/01-token-controls.md, tickets/02-preview-layout-export-qa.md |
| R12 | «найди используемые сейчас: font-family; font-weight; font-size; line-height; letter-spacing; цвета; border colors; spacing; section spacing; container widths; gutters; grid; image aspect ratios; кнопки; ссылки; metadata; captions; form controls.» | done | 01 | tickets/01-token-controls.md |
| R13 | «Определи повторяющиеся значения.» | done | 01 | tickets/01-token-controls.md |
| R14 | «выбери значение, которое лучше соответствует текущей базе /test_2 и общей editorial-концепции сайта» | done | 01 | tickets/01-token-controls.md |
| R15 | «кратко зафиксируй: какие стили найдены; какие значения будут вынесены в tokens; какие несогласованности существуют» | done | 01 | tickets/01-token-controls.md |
| R16 | «Создай отдельный слой design tokens.» | done | 01 | tickets/01-token-controls.md |
| R17 | «Используй CSS Custom Properties.» | done | 01 | tickets/01-token-controls.md |
| R18 | «Начальные значения извлеки из текущего сайта.» | done | 01, 02 | tickets/01-token-controls.md; tickets/02-preview-layout-export-qa.md; story 29 (D01) |
| R19 | «Cloud #F2F0EA; Ink #171717; Shanghai / China #163A5F; Thailand #27493B; Ocean #627F92; Madagascar #7D3027; Tobacco #7C5A3B.» | done | 01 | tickets/01-token-controls.md |
| R20 | «Если текущий сайт использует дополнительные нейтральные оттенки, borders или функциональные цвета — тоже покажи их» | done | 01 | tickets/01-token-controls.md |
| R21 | «Текущий визуальный принцип Travel Club: editorial serif + modern grotesk.» | done | 01 | tickets/01-token-controls.md |
| R22 | «Сначала проверь реальные font imports проекта. НЕ заменяй существующие шрифты другими.» | done | 01 | tickets/01-token-controls.md |
| R23 | «В Playground должны быть отдельные типографические роли минимум: DISPLAY XL; DISPLAY L; H1; H2; H3; LEAD; BODY; BODY SMALL; METADATA; CAPTION; BUTTON / CTA.» | done | 01 | tickets/01-token-controls.md |
| R24 | «Для каждой роли должно быть возможно визуально менять: font family; font size; line-height; font weight; letter-spacing.» | done | 01 | tickets/01-token-controls.md |
| R25 | «Используй slider + numeric input там, где это удобно.» | done | 01 | tickets/01-token-controls.md |
| R26 | «Изменение должно применяться моментально к preview.» | done | 01 | tickets/01-token-controls.md |
| R27 | «Размеры должны поддерживать отдельно как минимум desktop и mobile, если текущая система использует разные значения.» | done | 01 | tickets/01-token-controls.md |
| R28 | «Покажи CORE: Cloud; Ink; основные neutral/border цвета текущего сайта.» | done | 01 | tickets/01-token-controls.md |
| R29 | «Покажи DESTINATION: China; Thailand; Ocean; Madagascar; Tobacco.» | done | 01 | tickets/01-token-controls.md |
| R30 | «Для каждого цвета: название; HEX; color picker; текстовое поле HEX; визуальный swatch.» | done | 01 | tickets/01-token-controls.md |
| R31 | «Создай управляемые spacing tokens: XS; S; M; L; XL; 2XL.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R32 | «Отдельно важные layout-level параметры: section spacing; block spacing; column gap; page horizontal padding; editorial gutter.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R33 | «Покажи визуально разницу между значениями.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R34 | «позволить настраивать минимум: max container width; page horizontal padding; number of columns; column gutter; section spacing; content width; narrow text width.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R35 | «Основная логика Travel Club — editorial grid примерно на 12 колонок.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R36 | «Добавь режим визуального отображения grid overlay в preview: SHOW GRID ON / OFF.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R37 | «Grid overlay должен быть служебным и не менять сам layout.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R38 | «Нужно визуально показать реальные примеры» с текстами «TRAVEL CLUB», «Куда — важно. С кем — важнее.», «FIELD NOTES / 2026», «THAILAND ’26», «Города разные. Люди — свои.» и «Небольшие групповые путешествия, индивидуальные маршруты и поездки под ключ.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R39 | «Metadata и captions тоже должны быть показаны на реальном контенте.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R40 | «Покажи editorial section label; issue number; year; metadata row; route; coordinates / location-style metadata; caption; thin rule; section index; large serif statement; large grotesk title; small uppercase metadata; editorial link / arrow CTA.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R41 | «Не создавай декоративные элементы, которых сейчас нет на сайте.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R42 | «Покажи primary text CTA; secondary editorial link; arrow treatment; hover; focus.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R43 | «Покажи text input; textarea; select / choice; active; focus; disabled; error, только если такая система уже нужна проекту.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R44 | «Покажи PRODUCT ITEM» с примерами «01 МАРШРУТ», «02 ПОД КЛЮЧ», «03 В КОМПАНИИ» и «Мы продумываем. Вы путешествуете самостоятельно.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R45 | «Все preview images должны использовать: fixed frame; overflow hidden; object-fit: cover.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R46 | «Покажи реальные пропорции, которые используются или целесообразно выделяются из существующего сайта.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R47 | «Для каждого frame покажи: название; aspect-ratio; пример изображения; поведение object-fit: cover.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R48 | «Добавь переключатель: TC; CHINA; THAILAND; MADAGASCAR.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R49 | «Постоянными должны оставаться: typography hierarchy; grid; spacing logic; component structure; base layout.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R50 | «Theme меняет только primary destination color; secondary accent при необходимости; preview photography; некоторые локальные editorial accents.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R51 | «TC / default: Cloud + Ink + основной brand blue текущего сайта.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R52 | «China: Cloud + #163A5F + Ink. Thailand: Cloud + #27493B + #627F92. Madagascar: Cloud + #7D3027 / #7C5A3B + Ink.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R53 | «Основная часть страницы должна содержать полноценный LIVE PREVIEW.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R54 | «В preview собери небольшой editorial composition: metadata; TRAVEL CLUB; hero statement; explanatory body copy; product item; photograph; Field Note; CTA; небольшой form fragment.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R55 | «Добавь переключатели: DESKTOP; TABLET; MOBILE.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R56 | «Preview должен реально показывать соответствующую ширину.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R57 | «Интерактивные настройки Playground НЕ должны менять глобальный :root всего сайта во время просмотра.» | done | 01, 02 | tickets/01-token-controls.md, tickets/02-preview-layout-export-qa.md |
| R58 | «Backend не нужен. API не нужен. Запись файлов не нужна.» | done | 01, 02 | tickets/01-token-controls.md, tickets/02-preview-layout-export-qa.md |
| R59 | «Настройки можно хранить: React state и, если это не усложняет реализацию, localStorage.» | done | 01, 02 | tickets/01-token-controls.md, tickets/02-preview-layout-export-qa.md |
| R60 | «Добавь RESET; COPY CSS; EXPORT TOKENS.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R61 | «Не делать SAVE TO PROJECT; WRITE TO CSS; WRITE TO FILE; APPLY TO WEBSITE; SERVER SAVE.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R62 | «Нужны sticky control panel или sticky toolbar; понятные группы настроек; collapse/expand для крупных групп; numeric input рядом со slider; общий RESET; мгновенный preview; минимум визуального шума.» | done | 01, 02 | tickets/01-token-controls.md, tickets/02-preview-layout-export-qa.md |
| R63 | «Не добавляй новую dependency, если задачу можно нормально решить средствами уже установленного стека.» | done | 01, 02 | tickets/01-token-controls.md, tickets/02-preview-layout-export-qa.md |
| R64 | «После реализации обязательно: запусти проект; проверь /design-system; убедись, что существующие routes продолжают работать; проверь browser console; ... проверь RESET, COPY CSS, EXPORT TOKENS, desktop / tablet / mobile preview.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R65 | «Сделай один refinement pass после первого рабочего варианта.» | done | 02 | tickets/02-preview-layout-export-qa.md |
| R66 | «В финальном отчёте напиши кратко» про файлы, токены, противоречия, запуск, UI, base tokens, COPY CSS, EXPORT TOKENS и сохранность существующих страниц. | done | 02 | tickets/02-preview-layout-export-qa.md |
| D01 | R18: preserve source fluid clamp/vw sizes in the editable preview model | done | 01, 02 | spec.md D01 | Review proved fixed numeric size lost responsive source behavior |
| D03 | Migrate browser draft v2 to v3 while preserving user-edited targets and adding new responsive clamp metadata | done | 02 | spec.md D03; tickets/02-preview-layout-export-qa.md | Schema extension must not restore stale responsive defaults |
| D04 | Keep destination metadata, captions, alt text and photos consistent with the selected preview theme | done | 02 | spec.md D04; tickets/02-preview-layout-export-qa.md | Craft review found stale Bangkok coordinates and mixed Istanbul imagery |

## Самобрифинг: принятые решения

- ASSUMPTION — используем браузерный `localStorage` только как черновик настроек. Пользователь разрешил его, он позволяет вернуться к настройке после перезагрузки и очищается кнопкой RESET.
- ASSUMPTION — выбор TC/China/Thailand/Madagascar переключает активные акценты и фото, а ручные значения палитры остаются в редактируемых токенах. Это сохраняет авторский выбор цвета при сравнении миров.
- ASSUMPTION — адаптивная композиция preview реализуется container queries на ширинах 1440/768/390, а не фиксированным desktop-layout в декоративной рамке.
- ASSUMPTION — подключаются только уже имеющиеся локальные гарнитуры TC Golos и TC Lora; файлов GFS Didot, Inter или Inter Display в проекте не обнаружено.
- ASSUMPTION — заданная в брифе Cloud/Ink и destination-палитра задаёт доступные бренд-токены; исходные цвета editorial CSS показываются дополнительными нейтральными swatches, а `/test_2` остаётся визуальным источником для композиции и размеров.
