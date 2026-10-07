# Спецификация: Travel Club /test_4

## 1. Безопасная копия

Новая редакционная версия существует отдельно на /test_4. До любых содержательных изменений снять SHA-256 исходных компонентов/страницы /test_2, общих используемых assets и файлов других маршрутов, а также screenshots /test_2 на 1440×900, laptop 1280×800, 390×844. Копировать компоненты, CSS, данные и страницу локально в test_4; поменять только import пути. Подтвердить неизменность исходных хешей и одинаковый вид копии. Только после этого разрешается переработка. Admin/backend/API/PostgreSQL/auth/другие routes и общие компоненты не меняются. Единственное общее изменение — добавление cropper в package/lock, не замена текущих версий.

## 2. Порядок и сохранённые блоки

Living Issue → Hero → три продукта → START YOUR STORY → FIELD NOTES intro → Thailand ’26 → China ’26 → FROM THE ARCHIVE / 2025 → NEXT ISSUE → Point of View → Club → Process → CTA/footer. Hero, продукты, форма, Point of View, Club, Process, CTA максимально сохраняют markup, copy, шрифты и характер исходной версии; допустимы небольшие композиционные правки для новой структуры и необходимые изменения якорей/ссылок. Memory/The Book не рендерится; ссылки на отсутствующий блок удалены/заменены в локальном содержании и navigation. Оригинальные компоненты не удаляются.

## 3. Living Issue

Механика открытия при нативной прокрутке, rAF, длительности, размеры, reduced-motion и доступное содержимое берутся из копии. Меняются только данные и China palette, без новой opening концепции. Видимый контент: FIELD NOTES / 2026, BEIJING → SHANGHAI, 4 FRIENDS, + 2 LOCAL FRIENDS IN BEIJING. Короткая рамка: поездка друзей до публичного запуска. Не клиенты и не коммерческий тур. Иллюстрации China из текущего языка /test_2. Палитра graphite/deep blue/cold off-white/silver.

## 4. Происхождение и терминология

После формы короткий editorial intro: «Сначала мы просто ездили сами». Продолжение о друзьях, маршрутах, поиске мест, изменениях планов и сохранении того, что хотелось повторить; из этих поездок должен вырасти Travel Club. Две визуально отдельные определения: FIELD NOTES — реальные поездки с друзьями до публичного запуска; ISSUES — будущие официальные поездки Travel Club. Короткий текст без вымышленных событий.

## 5. Thailand ’26

Первый и самый большой разворот, крупнее China. THAILAND / 2026 / ISLANDS → BANGKOK / 4 PEOPLE. Сочетание deep botanical green #24483b, warm off-white #f0eee5, muted green #819486; малый sky акцент допустим. Цвета на локальной секции, общий сайт светлый. Фотографическая асимметричная композиция: большой landscape, вертикальный detail, несколько smaller разных кадров, metadata, captions, year/route/people, небольшой текст. Чувство влажности, солнца, островов, дороги, Бангкока и компании, без выдуманных остановок или событий. Не tour card, не tropical gradient, neon, turquoise/resort и palm-leaf оформление.

## 6. China ’26

Второй крупный разворот с локальным graphite #232831, blue #3763eb, off-white #f1f0ec, silver #c3c9d1. BEIJING → SHANGHAI / 2026 / 4 FRIENDS / + 2 LOCAL FRIENDS IN BEIJING. Текст: «Четверо прилетели из Москвы. Двое друзей ждали нас в Пекине. Дальше история собиралась сама». People > places; город, еда, ночь, дорога и два города показаны тематически, без расписания или вымышленных событий. Большие фото, editorial serif/grotesk, тонкие rules и metadata из исходного языка. Переход после зелёного Thailand с контролируемым whitespace.

## 7. Архив / 2025

Компактный общий grid, три различающиеся route stories, по три фото на историю. CHINA / 2025 / BEIJING → SHANGHAI → SUZHOU → SANYA / 5 PEOPLE. MADAGASCAR / 2025 / 2 PEOPLE без неизвестного маршрута или городов. THAILAND / 2025 / ISLANDS → BANGKOK / SMALL COMPANY; без фиксированного количества. Тонкая dashed линия соединяет кадры и metadata, напоминает editorial travel trace, не карту авиаперелётов. Короткие phrases без заявлений о конкретных событиях. Координаты не добавляем: они не нужны для рассказа. Каждая история отличается композицией, единый grid связывает их.

## 8. NEXT ISSUE

Существующая концепция question-mark bridge после архива, означает первый будущий официальный выпуск TC. FIELD NOTES — прошлое, NEXT ISSUE — будущее клуба. NEXT ISSUE / DESTINATION ? / DATE ? / PEOPLE 6—9 / STATUS BUILDING. Не архивная поездка. CTA к сохранённой форме, без вымышленных дат или направления.

## 9. Дизайн

Сохраняем текущие Golos + Lora, headline scale, deep blue бренда, off-white, номера, тонкие rules, metadata, асимметрию, whitespace, navigation и motion. Преимущественно светлый фон; China — локальный тёмный контраст. Новой дизайн-системы нет. Все изменения CSS изолированы CSS modules test_4. Аккуратные tablet/mobile композиции и reduced motion.

## 10. Фото и стабильные слоты

Хорошие stock assets локально в public/test_4 с source/license manifest. Существующие исходные stock assets можно копировать/читать без изменений. Фото не выдаются за реальные снимки участников: небольшая заметка о временных иллюстрациях. Каждый отдельный rendered photo, включая Living Issue/hero/Point of View/Club, получает стабильный уникальный slot ID, explicit aspect ratio, overflow hidden, object-fit cover и responsive width. ID не привязан к array index, одинаковый asset в двух местах имеет два ID. Один ratio на всех breakpoint предпочтителен; cropper берёт ratio именно из слота. Размер JPEG не меняет сетку, отсутствие пустых полос/растяжения/overflow. Slot registry в локальном photo-slots — единственный источник ratios, fallback, alt, objectPosition.

## 11. EditableImage и crop

Проверены зависимости: подходящего cropper нет. Добавить одну поддерживаемую библиотеку react-easy-crop после проверки совместимости текущего React. EditableImage берёт ID/ratio/src/alt из slot registry, отображает frame и связывает ПКМ с редактором. Custom context menu открывается только при contextmenu фотографии. На тексте/остальной странице браузерный menu не предотвращается. В menu «Заменить фото» и «Вернуть исходное фото», сброс неактивен без замены. File input принимает JPG/JPEG/PNG/WEBP, проверяет MIME/decode, даёт понятную ошибку при неверном/повреждённом файле; выбор того же файла повторно работает.

Crop dialog в Travel Club palette, portal/native dialog с focus trap, Escape/Cancel, возвратом фокуса и блокировкой фоновой прокрутки. Фото под рамкой с точным ratio слота, drag reposition, доступный slider/buttons zoom in/out, visible crop, Cancel/Save, без фильтров/rotation/AI. Выбранный исходник не сохраняется до Save. Canvas экспортирует ровно cropped pixels в WebP/JPEG Blob, max edge примерно 2400px, высокое качество desktop без хранения 20MB оригинала. Save отключён пока crop не готов и во время сохранения. Ошибка обработки сохраняет открытый editor/старое фото. Cancel/Escape не меняет картинку. После Save frame и layout прежние, фото сразу обновляется.

## 12. Хранение и восстановление

IndexedDB, отдельная база test_4, object store с key slotId, Blob cropped image. Обновление UI после успешного transaction commit; load после refresh, stock fallback до загрузки. Не base64/localStorage, не backend upload. Reset удаляет запись, возвращает stock и сохраняется после reload. Object URLs освобождаются при замене/unmount. Ошибка quota/storage/read отображается понятно и не выдаёт несохранённое фото за сохранённое. IDB данные относятся только к этому браузеру/origin. Preview временного исходника не остаётся после Cancel. Новый выбор не допускает гонки со старым decode/crop. Пока dialog занят записью Save не повторяется.

## 13. Честная copy

FIELD NOTES — реальные путешествия команды с друзьями до публичного запуска. Не клиенты/проведённые туры/коммерческая организация TC. Россия как destination отсутствует (Москва только в заданной фразе про вылет). Madagascar не получает выдуманных городов/маршрута, Thailand ’25 не получает точного состава. NEXT ISSUE и demo-форма сохраняют честное обещание будущего. Краткий живой editorial tone.

## 14. Проверки

Playwright на 1440×900, 1280×800, 390×844: screenshots исходной и новой страниц, отсутствие horizontal overflow; открытие Living Issue с scroll и reduced motion; якоря/форма/навигация. Проверить Thailand, China, Archive, continuity typography, whitespace, размер кадров и переход цветов. Минимум один visual refinement pass с внесёнными исправлениями. Image editor e2e: ПКМ menu, picker, modal ratio, reposition/zoom, Save canvas, frame dimensions до/после, refresh persistence, reset/reload fallback, Cancel, invalid image, стандартный contextmenu вне фото. Hash manifest /test_2 и остальных исходных tracked файлов сравнить после изменений. npm lint/typecheck/Vitest/build и релевантные Playwright проходят; невозможные проверки явно указать. При локальном Docker frontend обновить только frontend для доступности localhost:3000, без backend/DB действий.

## 15. Отчёт

Коротко: созданные/изменённые файлы, доказательство неизменности test_2, устройство FIELD NOTES данных, цвета Thailand и причина, где менять copy/stock assets, EditableImage/cropper/IndexedDB, результаты lint/typecheck/build, 2–3 композиционных решения для обсуждения. Предположения: stock иллюстрации; сохранённая demo-форма; browser-local editor в тестовом route.

## Границы и швы

EditorialData владеет FIELD NOTES/архивом/текстом. PhotoSlots владеет стабильными ID, fallback и aspect ratio. Exposes `photoSlots: Record<string, {src, alt, aspectRatio, position?}>`.
EditableImage exposes `EditableImage({slotId, className?, sizes?, preload?, decorative?})`, className задаёт внешний размер frame, внутреннее фото fill/cover. ImageEditorProvider wraps весь test_4; общие menu/file input/dialog и storage скрыты внутри. Одно место управления состоянием вместо dialog на каждую фотографию. Компонент импортируется только в test_4.
PhotoStore exposes `loadPhoto(slotId): Promise<Blob|undefined>`, `savePhoto(slotId, blob): Promise<void>`, `resetPhoto(slotId): Promise<void>`; прячет IDB transactions. Crop export скрывает canvas и decode, вход image source/pixel area, выход Blob. Главный test seam — browser EditableImage публичные действия, без тестов внутренних implementation details.

## Вне рамок и открытые места

Отложенных требований нет. Backend, auth, other routes, real form delivery, Memory page и новые бизнес-функции вне задачи. Stock photos временные по явному требованию пользователя. Никаких credential/services не нужно.

## Покрытие

R01–R06 → §1; R07–R09 → §2; R10–R12 → §3; R13–R14 → §4; R15–R19 → §5; R20–R22 → §6; R23–R28 → §7; R29 → §8; R30–R31 → §9; R32–R34/R44 → §10; R35–R38/R41–R43 → §11; R39–R40 → §12; R45–R46 → §13; R47–R49 → §14; R50 → §15.
