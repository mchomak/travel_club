# Карта дня — локальная приёмка

Дата: 17 октября 2026. Среда: Windows, локальные Docker Compose PostgreSQL/FastAPI/production Next.js, Chromium Playwright, `http://localhost:3000`. Удалённого развёртывания и публикации не было.

## Воспроизведение

Из корня репозитория:

```powershell
docker compose up -d --no-deps --build --wait frontend
```

Из `frontend/`:

```powershell
npm.cmd exec playwright test e2e/constructor.spec.ts e2e/trip-map.spec.ts -- --workers=1
```

`trip-map.spec.ts` создаёт случайного администратора с коротким уникальным логином, выполняет настоящий вход и CRUD через локальный API. После прогона удаляются только этот пользователь, его поездки и его login attempts. Существующие записи, PostgreSQL volumes и окружение не удаляются. Файлы `.env` не читаются.

## Что проверяют семь сценариев

- Настоящий Leaflet DOM: нумерованные markers, popup, polylines и attribution. Секция следует за календарём, три собственные оценки участка находятся под картой; выбор режима работает клавиатурой. Save → reload → UI duplicate сохраняет места, границы и режим, в копии обновляются item UUID. Пробел в местах разрывает линию; переключение дня удаляет старую геометрию.
- Реальные keyless `/api/maps/config` и offline `/api/maps/resolve-link`: ручные координаты и Google selected-point URL в публичном ItemForm, отдельное место окончания, подтверждение, save/reload, текстовый план без выдуманной подложки.
- ItemForm с детерминированными search и short-link ответами: выбор и подтверждение кандидата, клик и перетаскивание настоящего Leaflet пина, удаление привязки; всё внутри одной панели без вложенных dialogs.
- Ночное отправление заканчивает локальный день в аэропорту отправления; следующий начинается в аэропорту прибытия. Запланированный перелёт не превращается в автомобильный маршрут. Смена отеля, равноправные отели, ручной выбор и своё место, сброс «Автоматически», сохраняемый порядок событий без времени.
- 429, `unavailable`, 502 и ошибка config: нет ложных нулевых расстояний, неполный итог, понятные сообщения и восстановление через повтор.
- Удержанный старый transit-ответ после переключения дня не заменяет новый маршрут и его оценки.
- Ошибка тайлов объясняет недоступную подложку, не удаляет координаты/markers и восстанавливается через повтор.

Перехваты существуют только внутри e2e: `/api/maps/config`, search/route/resolve-link и raster tiles. Приложение не содержит тестовых маршрутов или ответов. Подложка на снимках — намеренно нейтральная сетка, не реальная география; Leaflet, обработчики пинов, bounds, линии и DOM настоящие. Browser key — заведомо невалидный literal `TEST_ONLY_MAPS_KEY_NOT_VALID`; действительных ключей в снимках нет.

## Снимки

- [Desktop 1440](route-1440.png), [390 px](route-390.png), [320 px](route-320.png): карта и карточки после изменения ширины.
- Первое построение карты после загрузки на [390 px](route-initial-390.png) и [320 px](route-initial-320.png) также сохраняет все markers внутри bounds.
- [Без ключа, 320 px](keyless-320.png): текстовый план и сохранённые координаты.
- [Контролируемые ошибки провайдера](provider-errors.png).

## Обнаруженные ограничения

В первой production-проверке desktop → 390/320 resize оставлял markers за границей карты. Автор карты исправил повторный fit bounds после ResizeObserver; browser regression проверяет фактические bounding boxes всех markers.

Существующая шапка кабинета при длинном логине на 320 px расширяет документ: `frontend/src/app/admin/(private)/layout.tsx:15–16`, flex строки «Кабинет команды» и логина/выхода. Воспроизведение: логин вида `fixture-trip-map-<timestamp>-<8hex>`, viewport 320; наблюдались `document.scrollWidth=367`, правая граница кнопки выхода 367.47 px. Даже 15-символьный случайный hex-логин может дать 321 px в зависимости от ширины букв. Это не вызвано картой и не исправлялось в этой задаче. Случайный логин map-тестов имеет 9 символов; для него отдельно проверяется ширина всего документа 390/320 и bounds карты.

Live Geoapify tiles/search/routing/transit quality, покрытие Китая, Statistics/расход credits, реальные ограничения browser origin и backend public egress IP **не проверены**: ключей нет. Короткие ссылки в браузере проверены fixture-ответом; реальная безопасность URL/redirect/provider HTTP проверяется отдельными backend-тестами, а не этим браузерным intercept. Скорость на реальном телефоне не измерялась.

Подготовка ключей и локальный recreate описаны в [Geoapify setup](../../geoapify-setup.md); решение и runtime env — [ADR 0019](../../adr/0019-geoapify-day-map-provider.md). Названия `GEOAPIFY_API_KEY` / `GEOAPIFY_MAPS_API_KEY`, DTO config и ограничения соответствуют реализации; настройка реального аккаунта остаётся отдельным шагом.

## Выполненные проверки

- `docker compose up -d --no-deps --build --wait frontend` — exit 0, production Next.js build завершён, frontend healthy; повторено после reviewed fit-bounds repair `9ddd172`.
- `npm.cmd exec playwright test e2e/trip-map.spec.ts -- --workers=1` — 7 passed, 29.9 s; новых map-сценариев до этой задачи не было.
- Финальный `npm.cmd exec playwright test e2e/constructor.spec.ts e2e/trip-map.spec.ts -- --workers=1` — **29 passed, 1.4 min, exit 0**: 22 существующих constructor-сценария и 7 новых map-сценариев. Все семь map-тестов проверяют отсутствие `pageerror`; успешный responsive-путь проверяет весь документ и фактические bounds markers на 1440/390/320, а также первое построение на 390/320. Ожидаемые 429/502/503 network diagnostics относятся только к специально перехваченным error fixtures.
- `npm.cmd exec eslint -- e2e/trip-map.spec.ts e2e/constructor.spec.ts` и `npm.cmd run typecheck` — exit 0 после e2e-изменений.
- Родительский root отдельно подтвердил финальные frontend lint/typecheck и Vitest: 119 passed / 26 files (до map UI было 105; до fit-bounds repair — 117). По его переданному evidence: backend 106 / maps 47, Ruff green; чистая миграция, downgrade и upgrade seeded legacy DB проверены в task01. Эти suites не повторялись браузерным исполнителем.

Старый constructor-сценарий уточнён ровно в одном месте: `getByLabel('Ссылка', { exact: true })` для прежнего external URL. Появление отдельных полей «Ссылка Google Maps» сделало прежний substring-селектор неоднозначным; поведение приложения не менялось.
