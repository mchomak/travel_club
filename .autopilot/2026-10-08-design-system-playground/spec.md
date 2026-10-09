# Спецификация: Travel Club Design System Playground

## Задача

Редактируя дизайн Travel Club, мне нужно быстро сравнивать изменения на примерах, похожих на сам сайт, сохраняя исходные страницы и исходные CSS нетронутыми.

## Решение

Внутренний `/design-system` объединяет панель временных настроек и адаптивный editorial preview. Контролы меняют только CSS Custom Properties корня preview. Исходные токены видны сразу, значения можно менять, скопировать в буфер как CSS или скачать JSON. RESET возвращает исходные значения и удаляет браузерный черновик. В публичной навигации route не появляется.

## Аудит и исходные значения

Основной источник компоновки и исходных editorial значений — `/test_2`; совпадающие принципы сверены с `/test_4`. Их локальные fonts: `TC Golos` (grotesk) и `TC Lora` (serif), с кириллическими и латинскими WOFF2-файлами в проекте. GFS Didot, Inter и Inter Display в проекте не найдены, поэтому переключатель семейств ограничен существующими гарнитурами. Глобальные стили и рабочая область admin имеют собственные системные sans и палитру, но не являются базой публичного editorial preview.

Повторяющиеся значения `/test_2`: paper `#f3f2ee`, ink `#20211f`, blue `#172f50`, muted `#595b57`, line `#c2c4bd`; контейнер `min(100% - 80px, 1440px)`, 12 колонок, gap 24 px; финальный desktop body 17 px / 1.55, mobile body 16 px; метаданные 10 px / 500 / 1.5 / `.08em`, mobile 12 px; masthead `clamp(60px, 12.7vw, 194px)` / 1.02 / 700 / `-.04em`, mobile 12.2vw; hero heading `clamp(44px, 4.6vw, 70px)` / 1.05 / 600 / `-.04em`, mobile `clamp(35px, 10.4vw, 58px)`; lead 18 px desktop, 16 px tablet, 15 px mobile; product description 17 px desktop / 14 px mobile; captions 14 px desktop / 12 px mobile; editorial links/CTA 15 px in the final override, CTA weight 500 and min-height 50 px. Form label/input styles include 10–14 px labels, underlined fields, aria-invalid error color, square corners and visible focus. Editorial breakpoints: 1100, 760 and 360 px. Frames are taken from actual `photo-slots`: hero 2.1, wide 1.5–1.65, square 1, portrait .8–.85 and narrow portrait .67–.75; photos are cropped with `object-fit: cover`.

Несогласованности: пользовательская закреплённая палитра отличается от редакционных значений `/test_2`; обе показываются с явными source labels (брендовые Cloud/Ink/destination и текущие editorial paper/ink/blue/muted/line), без переписывания страницы. В глобальных/admin стилях иная нейтрально-зелёная палитра, системный sans, радиусы и размеры controls; они не подменяют editorial-основу. В `/test_2` локальный meta на узком экране увеличивается примерно с 10 до 12 px, а второй локальный preset — до 14 px; в Playground одна база берётся из desktop `/test_2`, mobile preview показывает отдельный редактируемый mobile size. Значения нового краткого spacing scale — семантические стартовые точки, а не заявление, что исходник уже использует ровно эту шкалу.

В отдельные Playground tokens выносятся: цвета (включая source neutrals), font families и 11 семантических type roles, desktop/mobile size и остальные метрики ролей, XS–2XL и пять layout-level spacing values, container/content/narrow widths, column count/gutter, image ratios и theme accents. Начальные значения сверяются с указанными source declarations; заданная пользователем destination палитра включена как самостоятельные брендовые значения.

### Начальный набор Playground tokens

Все CSS размеры задаются в px, letter-spacing — в em, line-height — безразмерным множителем. Стартовые type-role метрики соответствуют source selector; если на странице одинаковая роль имеет несколько локальных вариантов, взят desktop вариант главной editorial-композиции `/test_2`. Отдельные mobile size отражают mobile overrides. Weight и tracking наследуются от указанного source, когда они не переопределены на роли.

| Роль | Семейство / desktop size | Mobile size | Line-height / weight / tracking | Источник `/test_2` |
|---|---|---|---|---|
| DISPLAY XL | TC Golos / clamp(60px, 12.7vw, 194px) | 12.2vw | 1.02 / 700 / -.04em | `.masthead` |
| DISPLAY L | TC Golos / clamp(72px, 10.7vw, 154px) | clamp(38px, 10.8vw, 76px); 10.4vw below 360px | 1 / 600 / -.04em | `.issueTitleRow h2` |
| H1 | TC Golos / clamp(44px, 4.6vw, 70px) | clamp(35px, 10.4vw, 58px) | 1.05 / 600 / -.04em | `.coverGrid h1` |
| H2 | TC Golos / 36px | 31px | 1.15 / 500 / -.035em | `.contentsIndex h2` |
Responsive source sizes such as masthead `clamp()` and mobile `vw` remain fluid inside the preview canvas. The editable desktop number represents a `clamp()` maximum; the mobile number is its px target at 390 px. The original minimum and viewport coefficient remain in token metadata unless the user changes the target.
| H3 | TC Lora / 25px | 26px | 1.3 / 500 / normal | `.principle h3` |
| LEAD | TC Golos / 18px | 15px | 1.5 / 400 / 0 | `.heroDeck p` |
| BODY | TC Golos / 17px | 16px | 1.55 / 400 / 0 | `.root` final override |
| BODY SMALL | TC Golos / 17px | 14px | 1.5 / 400 / 0 | `.productLink p` final override |
| METADATA | TC Golos / 10px | 12px | 1.5 / 500 / .08em | `.meta` |
| CAPTION | TC Golos / 14px | 12px | 1.5 / 400 / 0 | `figcaption` final override |
| BUTTON / CTA | TC Golos / 15px | 15px | normal / 500 / 0 | `.primaryButton`, `.textLink` final override |

Color defaults: brand Cloud `#F2F0EA`, Ink `#171717`, China `#163A5F`, Thailand `#27493B`, Ocean `#627F92`, Madagascar `#7D3027`, Tobacco `#7C5A3B`; editorial surface `#f3f2ee`, editorial ink `#20211f`, blue `#172f50`, muted `#595b57`, rule `#c2c4bd`. Spacing scale starts at XS 4, S 8, M 16, L 24, XL 32, 2XL 48 px (recurring source steps). Layout starts: max container 1440, page padding 40 (24 at tablet and 18 at mobile), 12 columns (6 at mobile), gutter 24 (16 tablet, 14 mobile), section spacing 46, block spacing 42, editorial gutter 24, content width 1160, narrow text width 440. The narrow width and spacing names expose convenient roles backed by repeated source values; they do not claim a pre-existing token API.

## Истории и критерии приёмки

| # | Метка | История | Приёмка |
|---|---|---|---|
| 1 | R01–R03, R06, R10–R11 | Как разработчик, я открываю отдельный редактор и вижу изменения в контексте Travel Club | `/design-system` загружается напрямую; preview содержит editorial примеры; публичная навигация его не перечисляет |
| 2 | R02, R07–R09 | Как владелец сайта, я сохраняю текущие страницы и их вид | Изменения ограничены новым route и его scoped assets; нет правок существующих страниц и глобальных tokens |
| 3 | R04, R16–R18, R57–R59 | Как разработчик, я временно меняю tokens, не записывая их в проект | UI меняет React state и scoped variables preview; нет API/серверной/файловой записи; разрешённый localStorage хранит только браузерный draft |
| 4 | R05, R12–R15 | Как разработчик, я понимаю, откуда взяты стартовые значения и что в текущем CSS расходится | Страница показывает источник и системные стартовые tokens; аудит выше указывает шрифты, метрики, цвета, grid, frames, controls и отличия `/test_2` от globals/admin |
| 5 | R19–R20, R28–R30 | Как разработчик, я меняю фирменные и фактические нейтральные цвета | Для каждого цвета доступны имя, HEX, color picker, HEX input и swatch; валидный ввод обновляет preview сразу; некорректный HEX не применяется и остаётся исправимым |
| 6 | R21–R27 | Как разработчик, я сравниваю и настраиваю текстовые роли | Для DISPLAY XL/L, H1/H2/H3, LEAD, BODY, BODY SMALL, METADATA, CAPTION и BUTTON/CTA доступны только TC Golos/TC Lora, size desktop/mobile, line-height, weight и tracking; range и number синхронизированы |
| 7 | R31–R34 | Как разработчик, я подбираю ритм и ширину композиции | XS/S/M/L/XL/2XL и section/block/column/page-padding/editorial-gutter имеют понятные значения и видимый spacing sample; доступны container, padding, columns, gutter, section, content и narrow width с диапазонами в px |
| 8 | R35–R37 | Как разработчик, я проверяю 12-column композицию | Настраиваемая колонная сетка базируется на 12 колонках; overlay включается и выключается независимо, не принимает участие в layout и не перехватывает ввод |
| 9 | R38–R41, R53–R54 | Как редактор, я оцениваю hierarchy на реальном коротком фрагменте сайта | Preview показывает данные из брифа, реальное фото, editorial label, issue/year, маршрут и location metadata, caption, rule, index, serif statement, grotesk title, product, Field Note, CTA и небольшой form; вымышленных UI-мотивов нет |
| 10 | R42–R45 | Как редактор, я сравниваю повторяемые ссылки, controls и формат услуги | Есть текстовая primary CTA, вторичная editorial arrow-link с hover/focus, input, textarea, choice/select и active/focus/disabled/error пример; product rows 01/02/03 используют примеры из брифа; изображения имеют fixed frame, hidden overflow и cover |
| 11 | R46–R47 | Как разработчик, я сравниваю используемые рамки фото | Для hero 2.1, landscape 1.5–1.65, square 1, portrait .8–.85 и narrow portrait .67–.75 показаны подпись, ratio и фото; размеры происходят из существующих slot данных |
| 12 | R48–R52 | Как редактор, я сравниваю миры направлений, сохраняя общую систему | TC/China/Thailand/Madagascar меняют акцент, локальную фотографию и допустимый local accent; hierarchy, grid, spacing, component structure и base layout одинаковы; TC берёт editorial brand blue, destinations — значения из брифа |
| 13 | R55–R56 | Как разработчик, я проверяю результат на типовых ширинах | Desktop 1440, Tablet 768 и Mobile 390 задают реальную ширину внутреннего responsive canvas; container queries перестраивают композицию по существующим 1100/760/360 breakpoints; узкий preview доступен прокруткой в рабочей панели |
| 14 | R60–R61 | Как разработчик, я сбрасываю, копирую CSS и экспортирую JSON без записи в проект | RESET возвращает полный base state и очищает draft; COPY CSS формирует текущие custom properties и копирует их или показывает доступный fallback; EXPORT TOKENS скачивает JSON текущих colors/typography/spacing/layout/theme; действий Save/Write/Apply и endpoint нет |
| 15 | R62 | Как разработчик, я быстро нахожу контролы и меняю параметры | Sticky control area/toolbar, группы с collapse/expand, ясные labels, range + number, общий reset и мгновенный preview; на мобильном controls идут перед preview, интерфейс остаётся читаемым |
| 16 | R63 | Как сопровождающий, я не получаю ненужный runtime вес | Новых dependencies нет; React, CSS Modules, native inputs, CSS variables, localStorage и браузерный download достаточны |
| 17 | R64 | Как владелец проекта, я получаю проверенный инструмент | Production build, lint, typecheck и имеющийся frontend test suite проходят; браузерный QA проверяет route, console, основные controls/actions, трёх viewport, themes и нерегрессию прежних routes |
| 18 | R65 | Как владелец проекта, я получаю завершённый рабочий интерфейс | После первой реализации выполнен отдельный visual refinement pass по удобству групп, считываемости настроек, preview и переключателей |
| 19 | R66 | Как владелец проекта, я понимаю, что создано и как этим пользоваться | Итоговый отчёт содержит файлы, извлечённые токены и найденные расхождения, URL, редактируемые группы, путь base tokens и поведение CSS copy/JSON export, подтверждение сохранения существующих страниц |
| 20 | R04.1 | Как разработчик, я могу обновить вкладку после настройки | При наличии локального draft значения восстанавливаются только в этой browser origin; RESET возвращает первоначальные значения и удаляет сохранённое состояние |
| 21 | R30.1 | Как разработчик, я исправляю ошибку HEX ввода, не ломая preview | Пока значение не валидный `#RRGGBB`, swatch/base state не меняются; валидный ввод синхронизирует оба поля и preview |
| 22 | R60.1 | Как разработчик, я понимаю результат команды копирования даже при запрете clipboard | Доступ к буферу обрабатывается; при отказе CSS остаётся видимым для выбора вручную, без потери текущих значений |
| 23 | R54.1, R59.1 | Как посетитель инструмента, я вижу работоспособное исходное состояние | При первом визите показываются base tokens и полный preview; повреждённый/устаревший draft отбрасывается целиком в пользу base state с понятным локальным статусом |
| 24 | R38.1, R39.1 | Как разработчик, я сравниваю роли на одних и тех же реальных фразах | В preview видны literal examples: `TRAVEL CLUB` — DISPLAY XL; «Куда — важно. С кем — важнее.» — H1 с serif-фрагментом; `FIELD NOTES / 2026` — metadata; `THAILAND ’26` — DISPLAY L; «Города разные. Люди — свои.» — H2/serif statement; брифовый текст о небольших группах — LEAD/BODY; для фото показаны настоящие caption и route/location metadata |
| 25 | R42.1 | Как разработчик, я проверяю интерактивные состояния обоих CTA | Primary CTA и editorial arrow link имеют различимые default, hover и focus-visible состояния; arrow видим отдельно от подписи; focus outline соответствует существующему link/control принципу |
| 26 | R62.1 | Как разработчик, я быстро отменяю локальный эксперимент | Настройки можно reset по одному параметру и целой группе, когда группа поддерживает этот control; group reset возвращает только соответствующие base values, общий RESET сбрасывает всё |
| 27 | R65.1 | Как владелец проекта, я вижу, что именно проверял refinement pass | После первого рабочего варианта повторно проверены читаемость панели, число открытых настроек, различимость текущего token, мгновенная видимость изменений, реалистичность preview, theme/viewport controls и отсутствие dashboard-шаблонности; при обнаруженном затруднении сделана одна конкретная коррекция |
| 28 | R64.1 | Как владелец проекта, я получаю проверяемую QA матрицу | В браузере вручную меняются font size, line-height, color, spacing и max container width; проверяются все 4 themes, RESET после нескольких изменённых групп, COPY CSS и CSS fallback, скачивание/содержимое JSON, responsive DOM/layout на 1440/768/390, console, root scoping и существующие `/`, `/test`, `/test_2`, `/test_3`, `/test_4` |
| 29 | R18.1 -> D01 | Compare typographic roles across preview widths | Source `clamp()`/`vw` sizes remain fluid; desktop/mobile numeric controls stay editable and 1440/768/390 show the corresponding curve |

## Решения по реализации

- Использовать текущий Next.js App Router, React state, TypeScript, CSS Modules и CSS Custom Properties; новых зависимостей нет, потому что задача укладывается в установленный стек.
- Создать route `/design-system` без ссылок в публичной навигации; страница — client-side, поскольку все изменения локальны браузеру.
- Слой base tokens отделить от runtime state. Все интерактивные overrides назначать только на корень `.tcDesignPreview`; CSS самого инструмента остаётся отдельным CSS Module.
- Задействовать только существующие TC Golos/TC Lora и локальные Travel Club фотографии. Не копировать и не подключать глобально исходный editorial CSS: preview собирается локальной небольшой композицией и tokenized компонентами.
- Preview responsive через внутреннюю ширину canvas и container queries на существующих breakpoint values; внешний control panel управляет viewport preset и может горизонтально прокручивать широкий canvas.
- Состояние сохранять в localStorage под версионированным ключом как browser draft; разбор и валидация целостные. Ошибочная структура игнорируется и заменяется base state. RESET удаляет ключ.
- CSS copy — сериализовать runtime state как `:root` snippet для ручного переноса, но не применять его. Clipboard failure открывает доступную для ручного копирования область. JSON export скачивает локальный файл. Ни браузерный download, ни clipboard не отправляются серверу.
- Экспортированное CSS представляется переносимым набором tokens без обещания вставить его напрямую в глобальный проект: применение не входит в этот этап.
- Color/theme state сохраняет ручные значения палитры при переключении destination. Theme выбирает активный акцент и фото; постоянные layout и типографика остаются пользовательскими значениями одного набора.
- Формы в preview демонстрационные и не отправляют данные; error state показан как образец, поскольку текущий `/test_2` уже использует `aria-invalid`/field error стили.
- В группах видны только существенные выбранные controls одновременно; крупные секции свёрнуты до заголовков, активная роль и имя token остаются очевидными. Если группа/параметр можно независимо изменить, рядом есть локальный reset.
- Визуальный refinement pass повторно оценивает читаемость панели, количество раскрытых полей, выбранный token, мгновенную обратную связь, реалистичность композиции, theme/viewport controls и отличие utilitarian developer tool от случайного admin dashboard; найденные проблемы приводят к одной адресной правке.
- QA включает существующие lint/typecheck/test/build команды и браузерную проверку: type size и line-height, color, spacing, max container width, destination theme, group/global RESET, COPY CSS и fallback, JSON downloaded content, viewport 1440/768/390, console и сохранность `/`, `/test`, `/test_2`, `/test_3`, `/test_4`.

## Границы и швы

Внутри route граница одна: typed token/state layer владеет базовыми значениями, допустимыми theme/viewport и сериализацией; shell владеет React state, draft storage и действиями controls; scoped preview потребляет state как локальные CSS variables. Между зонами согласованы типы: `FontFamily = "TC Golos" | "TC Lora"`; `TypeRole = "displayXL" | "displayL" | "h1" | "h2" | "h3" | "lead" | "body" | "bodySmall" | "metadata" | "caption" | "button"`; `SpacingToken = "xs" | "s" | "m" | "l" | "xl" | "2xl"`; `ColorToken = "cloud" | "ink" | "china" | "thailand" | "ocean" | "madagascar" | "tobacco" | "editorialPaper" | "editorialInk" | "brandBlue" | "muted" | "line"`; `FrameRole = "hero" | "landscape" | "editorialLarge" | "editorialSmall" | "portrait" | "square"`; `DestinationTheme = "tc" | "china" | "thailand" | "madagascar"`; `ViewportPreset = "desktop" | "tablet" | "mobile"`; `FrameToken = { aspectRatio: number; src: string; alt: string }`; `LayoutTokens = { containerWidth: number; pagePadding: number; columns: number; columnGutter: number; sectionSpacing: number; blockSpacing: number; contentWidth: number; narrowTextWidth: number; editorialGutter: number }`; `ResponsiveTypeScale = { desktopMin?: number; desktopVw?: number; mobileVw?: number; mobileReferenceWidth?: number }; TypographyRole = { family: FontFamily; desktopSize: number; mobileSize: number; responsiveScale?: ResponsiveTypeScale; lineHeight: number; weight: number; letterSpacing: number }`; `PlaygroundTokens = { colors: Record<ColorToken, HexColor>; typography: Record<TypeRole, TypographyRole>; spacing: Record<SpacingToken, number>; layout: LayoutTokens; frames: Record<FrameRole, FrameToken> }`; `PlaygroundState = { tokens: PlaygroundTokens; theme: DestinationTheme; viewport: ViewportPreset; showGrid: boolean }`. `BASE_TOKENS: PlaygroundTokens` is immutable source state; initial user state is its copy. Публичные функции token boundary: `createPreviewVariables(state: PlaygroundState): React.CSSProperties`, `createCssExport(state: PlaygroundState): string`, `createJsonExport(state: PlaygroundState): string`, `readDraft(): PlaygroundState | null`, `writeDraft(state: PlaygroundState): void`, `clearDraft(): void`. `HexColor` is validated `#RRGGBB`. Browser storage is best effort and its failure leaves the in-memory UI usable. Ни один из этих слоёв не экспортирует запись в исходники. Проверочный шов — rendered route и его DOM/UI, плюс чистые функции сериализации/проверки; backend boundary отсутствует.
D01 ? R18: task 01 demonstrated that a numeric `desktopSize` alone cannot represent source `clamp()`/`vw` typography. `TypographyRole.responsiveScale` retains those source parameters. The live preview continues to calculate them against its own width; numeric desktop/mobile controls adjust their targets without reducing the base behavior to one fixed size.

## Вне рамок

| Требование | Почему не сейчас |
|---|---|
| R02, R07 | Редизайн и изменение существующих маршрутов не нужны для самостоятельного инструмента. |
| R08, R58 | Backend, admin, constructor, API и server persistence не участвуют в настройке preview. |
| R09, R57 | Глобальное внедрение не требуется; state ограничен preview. |
| R11 | Публичная навигация не должна рекламировать внутренний route. |
| R61 | Save/Write/Apply противоречат требованию безопасного локального playground. |

## Открытые места

Нет. Неизвестные значения разрешаются из существующих CSS/asset метаданных, а не заглушками.

## Покрытие манифеста

| Требование | Раздел спецификации |
|---|---|
| R01 | Решение; история 1 |
| R02 | истории 2; Вне рамок |
| R03 | Решение; история 1 |
| R04 | Решение; история 3; 20 |
| R05 | Аудит; история 4 |
| R06 | Задача; Аудит; история 1 |
| R07 | история 2; Вне рамок |
| R08 | история 2; Вне рамок |
| R09 | история 2; Решения |
| R10 | Решение; история 1 |
| R11 | история 1; Вне рамок |
| R12 | Аудит; история 4 |
| R13 | Аудит; история 4 |
| R14 | Аудит; история 4 |
| R15 | Аудит |
| R16 | Решение; история 3 |
| R17 | Решения; история 3 |
| R18 | Аудит |
| R19 | Аудит; история 5 |
| R20 | Аудит; история 5 |
| R21 | Аудит; история 6 |
| R22 | Аудит; история 6 |
| R23 | история 6 |
| R24 | история 6 |
| R25 | история 6; история 7 |
| R26 | Решение; истории 5–7 |
| R27 | Аудит; история 6 |
| R28 | Аудит; история 5 |
| R29 | история 5 |
| R30 | история 5 |
| R31 | Аудит; история 7 |
| R32 | Аудит; история 7 |
| R33 | история 7 |
| R34 | история 7 |
| R35 | Аудит; история 8 |
| R36 | история 8 |
| R37 | история 8 |
| R38 | история 9 |
| R39 | аудит; история 9 |
| R40 | история 9 |
| R41 | история 9 |
| R42 | история 10 |
| R43 | история 10 |
| R44 | история 10 |
| R45 | история 10; аудит |
| R46 | аудит; история 11 |
| R47 | история 11 |
| R48 | история 12 |
| R49 | история 12 |
| R50 | история 12 |
| R51 | история 12; аудит |
| R52 | история 12; аудит |
| R53 | Решение; история 9 |
| R54 | история 9 |
| R55 | история 13 |
| R56 | история 13 |
| R57 | истории 2–3; решения |
| R58 | Решение; история 3; Вне рамок |
| R59 | Решения; истории 3, 20, 23 |
| R60 | история 14 |
| R61 | история 14; Вне рамок |
| R62 | история 15 |
| R63 | история 16 |
| R64 | история 17 |
| R65 | история 18 |
| R66 | история 19 |

## D03 — Browser draft schema migration

The local browser draft is a temporary preview, but schema changes must not restore a valid v2 draft with incomplete responsive typography. `readDraft` should migrate v2 payloads to v3 by preserving the user's current token values and merging only newly required responsive curve metadata from `BASE_TOKENS`; migration persists under the v3 key. `RESET` clears both legacy and current draft keys. Unknown/malformed versions remain best-effort: ignore with a visible fallback status rather than throwing.

## D04 — Destination preview consistency

Theme previews may change destination color, photographs and local editorial details, but the visible city/country, route, coordinates, captions and image alt text must remain internally consistent with the selected theme. The default TC theme must describe a real place matching its selected images, or use destination-neutral copy when those images are reused.
