# Travel Club — результат

## Готовые страницы
`/formats`, `/archive`, `/start`, `/thanks`, `/legal`, `/privacy`, `/personal-data`; branded 404 через стандартный root `not-found.tsx`. Локальный frontend обновлён на http://localhost:3000. Все страницы связаны общей навигацией и возвращают на `/test_5`.

## Архитектура и файлы
- Новые routes находятся в `frontend/src/app/(publication)/`; общий layout использует `SiteShell`. Новый root `frontend/src/app/not-found.tsx` использует ту же оболочку.
- Новые компоненты, стили и полный inventory — `frontend/src/components/public-site/README.md`. Созданы SiteShell (header/footer), EditorialLabel, PageIntro, CTA, EditorialImage, LegalNavigation, LegalDocument, Formats, Archive и StartForm.
- Существующие product файлы изменены только в навигации: `test_5/data.ts`, `editorial-home.tsx`, `field-notes.tsx`. В `e2e/test-5-camera.spec.ts` обновлены destinations и ожидание стабильной камеры перед проверкой прежних координат. Память дополнена внутри markers в `AGENTS.md`.
- Источник примитивов и размеров — неизменённый `components/design-system/tokens.ts::BASE_TOKENS`. `public-site/site-tokens.ts` преобразует его в scoped `--pub-*`; primitive serif/sans → semantic h1/h2/h3/body/meta и другие роли → минимальные aliases. Шрифты подключены локально в `fonts.css`.
- Responsive typography и единственный необходимый page override — `--pub-type-legal-title-size` в общей `publication.module.css`: mobile legal title ограничен `min(H1, 8.5vw)` для целых длинных слов. Отдельных page font систем нет. Serif/H1/body/Cloud propagation проверена через BASE → adapter → реальные DOM роли.

## Поведение и визуальные решения
- Formats — три разных журнальных разворота с конкретным составом услуг, процессом и contextual CTA. Archive — хронологический фотоиндекс с крупными годами и кадрами разных размеров; renderer выводит все годы и записи FIELD NOTE/ISSUE из данных.
- На homepage «Форматы»/«Архив» ведут на новые routes; primary CTA — `/start`, product CTA передают формат; документы — `/legal`, `/privacy`, `/personal-data`. Настоящие якоря содержания сохранены. Living Issue, copy, layout, CSS и photo editor не переписывались.
- `/start?format=route|complete|group` выбирает формат. Контакт обязателен, остальные поля можно оставить пустыми; проверяются контакт, положительное целое участников и длины. После корректного заполнения — `/thanks`. Поля существуют только в React: API, POST, storage и personal data в URL отсутствуют. SSR отключает submit до hydration; без JavaScript клик и Enter не отправляют форму, показано пояснение.
- Legal templates честно в подготовке, юридический текст не выдуман. Thanks подтверждает демонстрацию. 404 возвращает настоящий HTTP 404 и даёт ссылки домой/в архив.
- Архивные фотографии иллюстративные. Detail pages Thailand/China ’26 и China/Madagascar/Thailand ’25 отсутствуют; сломанных ссылок на них нет. Field Notes — поездки друзей до публичного запуска, не проведённые коммерческие туры.

## Проверено
- ESLint и TypeScript — passed; затронутые файлы проверены ещё раз после privacy regression.
- Vitest — **80 passed / 19 files**; production build — passed.
- Production Playwright — **100 passed (1.7m), exit 0**: 53 новых сценария и 47 регрессий `/test_5`, `/test_4`, Living Issue и Playground. Последний результат — `browser-privacy-final.log`.
- Все новые страницы и 404: 1440 / 1280 / 768 / 390 px; формы и юридические заголовки дополнительно 320 px. Проверены изображения, alt, overflow, nav, keyboard/focus, reduced motion, query, отсутствие отправки/хранилищ и JS ошибок.
- Визуальная проверка каждой страницы на desktop/mobile; refinement исправил radio dimensions и длинные legal headings, сохранив общие токены. Screenshots: `frontend/test-results/publication/`; traces: `frontend/test-results/publication-final-stable/`.
- Независимая слепая G4: продуктовых missing/partial не найдено. Live main flow, HTTP 404, 32 viewport/page комбинации, отсутствие POST/storage и scoped token propagation проверены отдельным браузером. Ограничение legal H1 учтено при дополнительной проверке токенов. Privacy follow-up — 9/9: no-JS click/Enter, disabled submit и видимый noscript, normal-JS group → thanks, отсутствие personal requests/storage.
- Три пользовательских изменения Playground сохранили исходные SHA256. Backend/database/admin исходники не менялись; новых зависимостей, assets и env нет.

## Решения и отклонения
Использованы существующие BASE_TOKENS и contact validation; форма оставлена честным прототипом, legal и detail pages не выдуманы. Новых возможностей сверх брифа нет.

Docker Desktop остановился во время приёмки; восстановлен CLI restart без удаления данных. После запуска существующих сервисов проверка выполнена на работающем production frontend. Два test-only ожидания уточнены: изображения ждут фактической загрузки в viewport, камера — завершения движения; исходные assertions сохранены.

D01: финальная privacy-проверка выявила native GET без JavaScript; dummy запрос перехвачен до передачи. Исправление проверено независимым браузером и итоговым production-прогоном. Поиск текста `<noscript>` в browser regression использует CSS locator: обычный Playwright text engine исключает этот элемент, хотя он видим при отключённом JavaScript. Открытых продуктовых замечаний нет.
