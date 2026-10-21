# AGENTS.md — Travel Club

Project-level instructions for Codex. Keep this file compact: task-specific requirements belong in the user's current prompt, while this file defines durable project context, engineering constraints, and working style.

## 1. Project context

Travel Club is a custom travel-service website with two layers:

1. **Public website** — the future customer-facing brand site. It will present the company, services, open group trips, request forms, and potentially payments. The visual direction may later use rich photography, video, motion, and 3D.
2. **Private admin area** — an internal tool used by the founders to build, price, save, and edit travel itineraries.

Current priority: **build the technical foundation and the private trip-constructor first**. Public pages may exist as lightweight placeholders until explicitly requested.

Core business products:
- itinerary planning;
- turnkey trip organization;
- accompanied group trips.

The trip-constructor is the shared calculation foundation for all three products.

## 2. Current product scope

The internal constructor should eventually support:
- trips with arbitrary start/end dates;
- multiple countries and cities in one trip;
- day-by-day and time-based itinerary planning;
- flights, trains/buses, transfers, hotels, excursions, activities, transport rental, insurance, and custom items;
- notes for the whole trip, each day, and each itinerary item;
- participant count;
- multiple currencies with manually entered exchange rates;
- automatic cost calculation;
- markup or target margin calculation;
- saved trips in PostgreSQL;
- reopening, editing, duplicating, archiving, and deleting trips;
- a client preview that hides internal pricing and notes;
- protected access through admin authentication.

Do not implement future business systems unless explicitly requested. Examples of out-of-scope features by default:
- real payment integration;
- automatic flight/hotel price APIs;
- booking engines;
- full CRM;
- accounting system;
- tax engine;
- complex employee roles;
- mobile app;
- production 3D experiences for the admin panel.

## 3. Preferred stack

Use this stack unless the existing repository already establishes a compatible alternative or the task explicitly changes it.

### Backend
- Python
- FastAPI
- SQLAlchemy 2
- Alembic
- PostgreSQL
- Pydantic
- pytest

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- a small, accessible component library when useful
- React Hook Form + schema validation where forms are non-trivial
- TanStack Query or an equivalent server-state solution when useful

### Infrastructure
- Docker
- Docker Compose for local development
- environment variables via `.env`
- committed `.env.example`

Use current stable, non-deprecated package versions. Avoid unnecessary dependencies.

## 4. Architecture principles

Build a **modular monolith**, not microservices.

Prefer clear boundaries between:
- UI;
- API;
- persistence;
- authentication;
- pricing/business logic.

Important invariants:
- PostgreSQL is the source of persisted business data.
- The backend is authoritative for financial calculations.
- Frontend calculations may be used for instant UX feedback, but must not diverge from backend rules.
- Money must not use binary floating point for authoritative calculations. Use `Decimal` in Python and `NUMERIC/DECIMAL` in PostgreSQL.
- Pricing formulas must live in a clear reusable domain/service layer, not be scattered through UI components.
- Avoid duplicating formulas across endpoints or screens.
- Prefer one flexible itinerary-item model with calculation modes over a separate hard-coded subsystem for every travel item type.

Design today's code so future additions are possible without speculative infrastructure. Extensible does not mean abstract everything now.

## 5. Trip cost model

A trip is composed of cost items. Each item has a calculation mode.

Supported calculation concepts include:

### Per person
`total = unit_price × participants × quantity`

### Fixed for the group
`total = unit_price × quantity`

### Capacity-based unit
For transfers, vehicles, guides with capacity, etc.:

`units = ceil(participants / capacity)`

`total = unit_price × units × quantity`

### Hotel / room per night
`rooms = ceil(guests / room_capacity)` unless manually overridden.

`total = room_price_per_night × rooms × nights`

### Per day
`total = unit_price × days × quantity`

### Per person per day
`total = unit_price × participants × days × quantity`

### Manual total
The user provides the final amount directly.

An item may use fewer participants than the trip total. Example: 5 travelers, but only 3 join an activity.

Never silently double-count multi-day items when producing day totals and trip totals.

## 6. Markup vs margin

Keep these concepts distinct in code and UI.

### Markup
Given cost `C` and markup `m`:

`price = C × (1 + m)`

### Target margin
Given cost `C` and target margin `r`:

`price = C / (1 - r)`

Always make the selected calculation mode explicit. Do not label an ambiguous input simply as "margin %" if it may mean markup.

## 7. Currency rules

The trip has a base currency.

Individual items may use other currencies. For MVP, exchange rates are entered manually per trip.

Persist enough data to reproduce a historical calculation:
- original amount;
- original currency;
- exchange rate used;
- normalized amount in the trip base currency.

Do not add an external FX API unless explicitly requested.

## 8. Authentication and security

The admin area is private.

Default assumptions:
- no public registration;
- one admin role is enough until requirements change;
- passwords are stored only as secure hashes;
- protect admin API routes server-side, not only in the frontend;
- use secure session/auth cookie settings in production;
- secrets never go into source control;
- validate untrusted input at API boundaries;
- do not expose internal stack traces to users.

Do not invent an enterprise identity architecture for an MVP.

## 9. UI/UX freedom

The user intentionally gives Codex creative freedom on UI/UX.

For the **admin trip-constructor**:
- optimize for clarity, speed, and low cognitive load;
- assume a non-technical user must understand it without training;
- prefer a visual itinerary/timeline over an Excel-like wall of columns;
- keep financial summaries easy to find;
- make common actions obvious;
- use sensible defaults based on item type;
- reveal advanced controls only when needed;
- use plain human language instead of database or engineering terminology;
- desktop is the primary workflow, but the UI must remain usable on tablet/mobile;
- avoid decorative complexity that slows daily work.

Do **not** treat layouts, component placement, exact visual style, spacing, or micro-interactions as fixed unless the current task specifies them. Make strong design decisions yourself and keep the result cohesive.

For the future **public website**:
- architecture should not block expressive editorial design, motion, photography, video, WebGL/Three.js/React Three Fiber, or immersive transitions;
- do not preload those heavy capabilities into the admin panel without a concrete need.

## 10. Work style

### Understand before changing
Before a meaningful implementation:
1. inspect the relevant repository files;
2. understand the existing structure and conventions;
3. identify the smallest coherent change;
4. define how the result will be verified.

For multi-step work, state a short implementation plan, then execute it. Do not repeatedly ask for confirmation on routine technical choices.

### Ask only when it matters
Do not block on minor decisions that can be safely inferred.

Make a reasonable choice and continue for:
- exact button labels;
- spacing;
- component library choices;
- ordinary folder structure details;
- common implementation details.

Ask or explicitly flag the issue when ambiguity could materially cause:
- data loss;
- wrong financial calculations;
- a security weakness;
- a major architectural rewrite;
- incompatible business behavior.

### Simplicity first
- Build only what the current task needs.
- Prefer straightforward code over clever abstractions.
- Do not add services, queues, caches, event buses, repositories, factories, or generic frameworks without a concrete reason.
- If a simpler implementation is equally correct and maintainable, use it.

### Surgical edits
When working in an existing codebase:
- do not refactor unrelated code;
- preserve existing conventions unless they conflict with the task;
- remove only dead code created by your own changes;
- mention unrelated problems instead of opportunistically rewriting them.

## 11. Data integrity

Financial and itinerary data are business-critical.

When changing:
- trip dates;
- participant count;
- currencies;
- item calculation modes;
- hotel dates;
- capacities;

ensure dependent totals are recalculated correctly.

Do not silently destroy populated days when a trip date range shrinks. Require an explicit destructive action or confirmation path in the product logic.

Database schema changes must use migrations.

## 12. Validation and error handling

Validate at both appropriate frontend UX boundaries and authoritative backend boundaries.

Important examples:
- start date must not be after end date;
- capacity must be positive;
- participants must be positive where applicable;
- percentages must be in a valid range;
- required exchange rates must exist before authoritative conversion;
- hotel checkout must be after check-in;
- invalid financial operations must fail explicitly rather than producing misleading totals.

User-facing errors should be understandable and actionable.

## 13. Testing priorities

Tests should focus on business risk, not line-count coverage.

High priority:
- financial formulas;
- Decimal rounding behavior;
- capacity boundaries (`4` vs `5` passengers, etc.);
- hotel room count and night calculation;
- markup and target-margin formulas;
- currency normalization;
- recalculation after participant/date/rate changes;
- authentication protection;
- destructive date changes;
- persistence and reopening of trips.

For bug fixes, reproduce the bug with a test when practical, then fix it.

Do not claim a financial result is correct without executing the relevant tests or deterministic calculation.

## 14. Verification before completion

Before saying a task is complete, run the relevant checks available in the repository, such as:
- backend tests;
- frontend tests if present;
- linting;
- type checking;
- production frontend build;
- database migrations from a clean database when schema work changed;
- Docker/Compose startup when infrastructure changed.

If a check cannot be run, say exactly which one and why.

Do not report success based only on visual inspection when the change is objectively testable.

## 15. Definition of done

A change is done when:
- it fulfills the requested behavior;
- it does not knowingly break existing behavior;
- relevant business rules are covered by tests where practical;
- financial logic is deterministic and centralized;
- migrations exist for schema changes;
- auth/security rules remain enforced;
- the project builds or runs using the documented workflow;
- documentation is updated when setup or behavior changed;
- no secrets, debug leftovers, temporary mocks, or unexplained TODOs remain from the change.

## 16. Keep project context lean

This file contains durable rules only.

Do not duplicate the full business plan or current implementation prompt here. The current user request is authoritative for feature-specific requirements.

Priority order when instructions conflict:
1. the user's explicit current task;
2. project-specific technical requirements in the repository;
3. this `AGENTS.md`;
4. general conventions.

When the current task introduces a durable architectural rule that will matter across future work, update this file only if explicitly asked or if the repository workflow clearly expects it.

<!-- autopilot:start -->
## Рабочая карта проекта

Travel Club — закрытый конструктор поездок: маршрут, календарь, ручные курсы, расчёт, сохранение и клиентский просмотр. Стек: FastAPI, SQLAlchemy 2, Alembic, PostgreSQL; Next.js 16, React 19, TypeScript, Tailwind; Docker Compose. Публичная `/` — витрина палитр и шрифтов; `/test` и `/test_2` — редакционные эксперименты, `/test_3` — экспериментальный анонс Shanghai, `/test_4` — FIELD NOTES и локальный фоторедактор, `/test_5` — тот же сайт с приближением из правой страницы журнала. Публичные формы демонстрационные.

### Запуск и проверка (PowerShell)

Из корня репозитория:

```powershell
python scripts/init_env.py
docker compose up -d --build --wait
docker compose exec backend python -m app.bootstrap
docker compose exec -T backend pytest -q
docker compose exec -T backend ruff check .
```

`init_env.py` создаёт локальный `.env` из `.env.example`, не перезаписывая существующий; `bootstrap` интерактивно создаёт первого администратора. Backend при запуске применяет миграции.

Для frontend из корня:

```powershell
cd frontend
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test -- --run --testTimeout=15000
npm.cmd run build
npm.cmd exec playwright test e2e/test-4-editorial.spec.ts e2e/test-4-photo-editor.spec.ts e2e/living-issue.spec.ts -- --workers=3
npm.cmd exec playwright test e2e/test-5-camera.spec.ts e2e/test-5-photo-editor.spec.ts e2e/test-4-editorial.spec.ts e2e/test-4-photo-editor.spec.ts e2e/living-issue.spec.ts e2e/design-system.spec.ts e2e/design-system-responsive-type.spec.ts -- --workers=3 --output=test-results/test-5-opening-stability/production
```

Playwright требует работающий сайт и Chromium: `npx.cmd playwright install chromium`; адрес по умолчанию `http://localhost:3000`, другой задаётся через `PLAYWRIGHT_BASE_URL`. Все браузерные сценарии: `npm.cmd run test:e2e`.

Проверено 7 октября 2026 для `/test_4`: lint, typecheck и build прошли; Vitest — 67 passed в 14 файлах; указанные Playwright-сценарии — 15 passed (2 editorial, 4 photo editor, 9 living issue). Из корня `docker compose up -d --no-deps --build --wait frontend` успешно пересобрал и запустил только frontend; backend/admin проверки в этой итерации не повторялись. Новых env-переменных нет.

Первая проверка 8 октября 2026 для `/test_5`, до обновления живого hero: lint, typecheck и production build прошли; Vitest — 67 passed в 14 файлах; последний Playwright-набор выше на `http://localhost:3000` — 30 passed, включая камеру, фоторедактор и регрессии `/test_4`. `docker compose up -d --no-deps --build --wait frontend` пересобрал frontend, сервис healthy. Новых env-переменных и зависимостей нет.

После обновления живого hero, до исправления разворота: production Playwright — 43 passed (1.1 минуты); camera + photo editor на dev3001 — 17 passed.

После исправления разворота и стабилизации камеры 8 октября 2026: lint/typecheck и `npm.cmd run build` прошли; `npm.cmd test -- --run --testTimeout=15000` — 73 passed в 16 файлах. Production Playwright-набор из 7 файлов выше на `http://localhost:3000` — 45 passed (1.4 минуты), включая регрессии `/test_4` и Design System. `docker compose up -d --no-deps --build --wait frontend` пересобрал frontend, сервис healthy. Новых зависимостей и env-переменных нет.

### Основные пути

- `compose.yaml`, `backend/Dockerfile`, `frontend/Dockerfile` — локальные PostgreSQL, API и сайт. `backend/app/`, `backend/migrations/`, `backend/tests/` — backend; финансовый источник истины — `backend/app/pricing.py`, общие примеры — `shared/pricing-vectors.json`.
- `frontend/src/app/admin/`, `frontend/src/lib/` — закрытые экраны, API и предварительный расчёт. `frontend/src/app/page.tsx` — главная; `frontend/src/app/test/page.tsx`, `frontend/src/app/test_2/page.tsx`, `frontend/src/app/test_3/page.tsx` и одноимённые каталоги компонентов — публичные эксперименты.
- `frontend/src/app/test_4/page.tsx` оборачивает локальные `LivingIssue` и `EditorialHome` в `ImageEditorProvider`. Все компоненты версии находятся в `frontend/src/components/test_4/`; их рабочая карта — `README.md` в этом каталоге.
- В `/test_4` `data.ts` содержит `copy`, продукты, `fieldNotes` и `archiveStories`; `issue-content.ts` — вступление China ’26. `field-notes.tsx` рисует происхождение клуба, Thailand/China ’26, архив ’25 и NEXT ISSUE. FIELD NOTES — поездки друзей до запуска; NEXT ISSUE — будущая официальная поездка. `editorial.module.css` оформляет страницу; `living-issue.tsx` и `living-issue.module.css` сохраняют открытие журнала нативной прокруткой/rAF и статичный reduced motion.
- `photo-slots.ts` — 30 стабильных ID с fallback/src/alt/aspectRatio/position. Для постоянной замены менять слот и alt; ratio одинаков на desktop/mobile. Девять новых JPEG лежат в `frontend/public/test_4/`; `manifest.json` и `README.md` там фиксируют источники, авторов, размеры и лицензии. Stock-фото иллюстративные.
- `editable-image.tsx`, `image-editor.tsx` и `image-editor.module.css` — ПКМ/кнопка «Фото», замена и сброс, общий crop-dialog. `react-easy-crop` 6.2.4 использует ratio слота; `crop-photo.ts` экспортирует WebP до 2400 px по длинной стороне; `photo-store.ts` сохраняет Blob по slotId в IndexedDB `travel-club-test-4-photos`.
- `frontend/src/app/test_5/page.tsx` оборачивает один живой `EditorialHome` в локальные `LivingIssue` и `ImageEditorProvider`; компоненты и краткая карта — `frontend/src/components/test_5/README.md`. Тексты, стили и 30 photo-slots локальны, assets общие с прежними версиями.
- В `/test_5` публикация имеет размер `min(88vw, 1360px)` × `min(82svh, 760px)`; на компактном breakpoint — `88vw` × `min(78svh, 660px)`. `LivingIssue` измеряет листы и live homepage через `ResizeObserver`, выравнивает срез сайта с правой страницей и раскрывает его до полной ширины через камеру и clip CSS-переменные; `data-page-hero` задаёт границу hero для мобильного кадра. `TIMELINE` задаёт путь 1.25 высоты viewport внутри сцены 225svh; passive native scroll обновляет target, rAF догоняет его с `SMOOTHING.responseMs = 65` и останавливается в покое. На границах 0/1 камера синхронизируется сразу; после приближения transform/clip снимаются, обратная прокрутка сохраняет тот же DOM и состояния. Layout при scroll не читается.
- На desktop `/test_5` левая редакционная страница — печатная обратная сторона обложки (`coverBack`): раскрывается на её шарнире до 180° и остаётся в развороте. Во время открытия единственный живой `siteSurface` использует `position: fixed` и координаты viewport; внешний `site` резервирует измеренную untransformed высоту всего содержимого (`--site-height`), чтобы native wheel не сдвигал страницу между rAF. В конце `siteSurface` возвращается в `position: relative`, transform/clip снимаются; DOM формы и редактора сохраняется.

### Design System Playground

- Локальный playground открывается по `http://localhost:3000/design-system`; точка входа — `frontend/src/app/design-system/page.tsx`. Его UI изолирован в `frontend/src/components/design-system/`: `playground-shell.tsx` управляет состоянием и контролами, `playground-preview.tsx` отображает preview, `playground.module.css` содержит стили, `tokens.ts` — типы, неизменяемые `BASE_TOKENS` и функции preview/CSS/JSON/draft. В `BASE_TOKENS` лежат цвета, роли типографики, spacing, layout и frame tokens; шрифтовые семьи — TC Golos и TC Lora.
- Live CSS-переменные применяются только к корню preview; не выносить их в глобальные стили и не добавлять playground в общую навигацию. Draft — best-effort browser localStorage, без записи файлов или сервера. При изменении responsive type scale проверять viewport 390px и 320px.
- Проверенные команды 8 октября 2026: из корня `docker compose up -d --no-deps --build --wait frontend`; затем открыть `/design-system`. Из `frontend/`: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test -- --run --testTimeout=15000`, `npm.cmd run build`, `npm.cmd exec playwright test e2e/design-system.spec.ts e2e/design-system-responsive-type.spec.ts -- --workers=3`. Playwright проверялся на production frontend по умолчанию на `http://localhost:3000`.

### Подводные камни

- `/test_4` изолирован от прежних версий: тексты, компоненты и CSS локальны. Общие фото/шрифты читаются из `frontend/public/test/` и `frontend/public/test_2/`; demo-валидация/адаптер — из `frontend/src/components/test/lead.ts`. Не менять их ради новой версии. Memory убран из рендера `/test_4`.
- Замены фото существуют только в текущем браузере и origin; другой порт имеет своё хранилище. Backend upload отсутствует. Сброс возвращает fallback; отмена/Escape сохраняют прежний кадр. Для общего постоянного результата менять исходный слот/asset в репозитории.
- В `/test_2` и `/test_4` `#start` ведёт к hero после журнала, `#story` — к форме. NEXT ISSUE в `/test_4` выбирает групповой формат.
- В `/test_5` прямой `#start` и reduced motion сразу показывают сайт; кнопка «К сайту» использует `site.offsetTop`, затем фокусирует `#start`, чтобы transform не смещал якорь. До конца открытия сайт inert, после — inert сцена. `#story` ведёт к demo-форме. Фото заменяются через ПКМ/«Фото» и сохраняются по slotId в отдельной IndexedDB `travel-club-test-5-photos`; данные `/test_4` не используются.
- На Windows использовать `npm.cmd`. После изменения `frontend/public/` пересобрать frontend: standalone-образ копирует assets при сборке. `.env` локальный; `docker compose down -v` удалит данные PostgreSQL.

### Preview deployment and account

- `compose.deploy.yaml` is source-free and references prebuilt `linux/amd64` tags `travel-club-frontend:preview` and `travel-club-backend:preview`; its opening comments list local buildx and `docker save` commands for both image tarballs. The runbook expects those tags to be loaded before Compose starts. Only the frontend binds to loopback (`127.0.0.1:3000`); API and PostgreSQL stay on the internal network, with PostgreSQL data in `travel_club_deploy_postgres_data`. Server `.env` supplies secrets and `ALLOWED_ORIGIN` from the verified runtime IP and HTTPS port; never commit the address or secrets.
- `docs/deployment-preview.md` documents host Nginx/Certbot TLS ingress. The public origin is formed at runtime from a confirmed IP and an approved HTTPS port (`8443`, `9443`, or `10443`). A short-lived Let's Encrypt IP certificate (about six days) requires automatic renewal; `deploy/certbot/nginx-deploy-hook.sh` validates Nginx and gracefully reloads it, and `deploy/nginx/render.py` renders the host configs. The runbook describes the procedure and does not prove that a VPS deployment has happened.
- Password changes use protected `POST /api/auth/password` and the private `/admin/account` page. On success, the backend keeps the current session and revokes the user's other sessions.
- Local checks on 2026-10-09: clean `linux/amd64` backend image build (Mako 1.4.3); backend suite on an isolated database 54 passed (auth 10 passed), Ruff passed; account form 3 passed, targeted ESLint/typecheck and Next.js production build passed; deploy Compose config/isolation, Nginx renderer, and shell syntax checks passed. Local `nginx -t` could not run because Nginx is unavailable; run it on the host before reload.

Обновлять только текст между маркерами, проверяя команды и пути по репозиторию.
### Публичные редакционные страницы — 13 октября 2026

- Маршруты `/formats`, `/archive`, `/start`, `/thanks`, `/legal`, `/privacy`, `/personal-data` лежат в `frontend/src/app/(publication)/`; route group не меняет URL. Общий `layout.tsx` использует `frontend/src/components/public-site/site-shell.tsx` (единственные header/main/footer); неизвестный URL оформляет `frontend/src/app/not-found.tsx`, отдельного `/404` нет. Главная — `/test_5`.
- Рабочая карта и API компонентов — `frontend/src/components/public-site/README.md`. В этом каталоге `primitives.tsx` даёт PageIntro/CTA/EditorialImage, `formats.tsx`, `archive.tsx`, `start-form.tsx` — содержимое страниц; фотографии используют существующие assets.
- Центральная база — `BASE_TOKENS` в `frontend/src/components/design-system/tokens.ts`; `public-site/site-tokens.ts` преобразует её в `--pub-*` только на `[data-publication-root]`. Playground draft не применяется. Изменять primitive цвета/type/spacing/layout/frames в BASE, semantic aliases и overrides — в adapter или `publication.module.css`, не копировать значения по страницам.
- Общая семья H1/H2/H3 идёт через `--pub-font-editorial` из `BASE_TOKENS.typography.h3.family`; h1/h2 сохраняют свои размеры/вес. Adapter использует desktopSize/mobileSize (fluid 390→1440), не Playground responsiveScale. `public-site/fonts.css` загружает TC Golos/TC Lora из `frontend/public/test/fonts/`.
- `publication.module.css` централизует mobile type ≤760px, metadata ≥.75rem и legal-title override `min(var(--pub-type-h1-size), 8.5vw)`; при изменении юридических заголовков проверять целые слова на 390/320px. `editorial-pages.module.css` и `start-form.module.css` задают композицию страниц.
- Переходы `/test_5` настроены в `frontend/src/components/test_5/{data.ts,editorial-home.tsx,field-notes.tsx}`: форматы → `/formats`, выпуски → `/archive`, разговор → `/start`, документы → `/legal`; настоящие локальные якоря и Living Issue сохранены. Продуктовые CTA передают `format=route|complete|group`.
- `/start` — прототип: query неизвестный/повторённый/отсутствующий даёт route; только контакт обязателен (`frontend/src/components/test/lead.ts`), заполненное количество людей — положительное целое. Ошибка фокусирует первое поле, успешная проверка ведёт на `/thanks`. Данные только в React state, без отправки/сохранения; `/thanks` сообщает это явно. На SSR и до hydration submit отключён через `useSyncExternalStore`; без JavaScript `noscript` объясняет причину, click/Enter не отправляют ответы через native GET. Сохранять этот privacy guard; Playwright проверяет сообщение через CSS `noscript p` (getByText игнорирует noscript).
- `public-site/archive-data.ts` содержит пять Field Notes друзей до запуска; официальных Issues и detail routes пока нет, фотографии иллюстративные. `/privacy` и `/personal-data` — планы недействующих документов в подготовке; `/legal` не создаёт ссылок на будущие оферту/реквизиты/договор/оплату/возврат.
- Radio в `public-site/start-form.module.css` явно сбрасывает width/height/min-height/padding: глобальный `input` в `frontend/src/app/globals.css` иначе делает native radio полноширинным полем высотой 48px. Сохранять scoped override.
- Проверено 13 октября 2026 из `frontend/`: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test -- --run --testTimeout=15000` (80 passed, 19 файлов), `npm.cmd run build`. Из корня `docker compose up -d --no-deps --build --wait frontend` пересобрал frontend, сервис running, exit 0; backend/PostgreSQL healthy. Новых зависимостей/env нет.
- Production browser 13 октября 2026 на `http://localhost:3000`: 100 passed (53 новых, 47 regression), 1.7 минуты, exit 0; screenshots — `frontend/test-results/publication/`, traces — `frontend/test-results/publication-final-stable/`.
- Проверенная команда из `frontend/`: `npm.cmd exec playwright test e2e/publication-pages.spec.ts e2e/publication-form.spec.ts e2e/publication-legal.spec.ts e2e/test-5-camera.spec.ts e2e/test-5-photo-editor.spec.ts e2e/test-4-editorial.spec.ts e2e/test-4-photo-editor.spec.ts e2e/living-issue.spec.ts e2e/design-system.spec.ts e2e/design-system-responsive-type.spec.ts -- --workers=3 --output=test-results/publication-final-stable`.

### Living Issue WebGL — 14 октября 2026

- `/test_6` — изолированная лаборатория без передачи в сайт/scroll-интеграции, API и хранения; вход `frontend/src/app/test_6/page.tsx`, локальный `icon.svg` устраняет favicon 404 только здесь. Рабочая карта и фактические проверки — `frontend/src/components/test_6/README.md` и `verification.md`; backend/финансовые расчёты не менялись, новых env нет.
- В `frontend/src/components/test_6/` `laboratory.tsx` держит HTML-контролы, `scene.ts` — direct Three 0.186.1 и ресурсы, `artwork.ts` — девять CanvasTextures из существующих фото/шрифтов; `@types/three` 0.186.0. Общее `BASE_TOKENS` читается без изменений.
- `deformation.ts` считает CPU-геометрию с постоянной длиной рядов и закреплённым корешком; сцена добавляет две поверхности, обратные UV и закрытые кромки, сетку 56×16 desktop/32×16 compact. Defaults `bend=2.05`, `curl=.9`, `stiffness=.24`, `lift=.35`; внутренние `spineConstraint=.12`, `outerEdgeInfluence=.15`. Деформируется только активный лист.
- `timeline.ts`: hold .22s, обложка .64s, три перелистывания; `flipDuration=.68`, `delay=.14`, всего 3.46s до TARGET. `parameters.ts` задаёт PerspectiveCamera distance9.1/FOV32/pitch18/yaw−8/roll−2, key(−2,1,12), softness4; fitting оставляет место поднятому листу, DPR ограничен 1.5/1.25.
- Контролы: Replay, Pause/Play, Final State, Reset, Sequence progress; tuning камеры/журнала/листа/света/времени и debug. Seek ставит паузу; изменение времени сохраняет долю sequence и pause state. Reduced motion сразу TARGET; скрытая вкладка замораживает clock без catch-up; TARGET останавливает RAF, controls/resize рисуют по требованию. Dispose снимает listeners/observer/RAF и освобождает GPU/texture/canvas; context loss показывает retry.
- Проверено 14 октября из `frontend/`: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test -- --run --testTimeout=15000` (88 passed, 21 файл), `npm.cmd run build`; `npm.cmd exec playwright test e2e/test-6-scene.spec.ts -- --workers=1 --output=test-results/test-6-scene` — 10 passed. Из корня `docker compose up -d --no-deps --build --wait frontend` прошёл, production работает на `http://localhost:3000`.
- Production: `npm.cmd exec playwright test e2e/test-6-scene.spec.ts e2e/test-5-camera.spec.ts e2e/test-5-photo-editor.spec.ts -- --workers=1 --output=test-results/test-6-regression` — 31 passed (10 lab +21 regression); фактический Chromium после icon repair — без console/page/resource ошибок, TARGET сохраняет frame count в покое.
- Производительность из `verification.md`: RTX4060/Direct3D11 при 1440×900/DPR1 около120 drawFPS, SwiftShader около16–17; viewport390 проверен на desktop, это не гарантия скорости телефона/слабого ноутбука. Прототип — процедурная геометрия, не физическая симуляция бумаги.

- В обычном Chromium остаются два предупреждения Next о preload CSS общей `app/not-found.tsx` (также воспроизводятся на `/test_5`); ошибки/предупреждения Three и сетевые ошибки устранены. Общая граница не менялась ради лаборатории.

### Living Issue → живой сайт `/test_7` — 14 октября 2026

- Вход — `frontend/src/app/test_7/page.tsx`; локальная сцена и координатор — `frontend/src/components/test_7/`. Корневой `test-6-settings.json` зафиксирован точной копией `preset.json` в этом каталоге для frontend-only Docker context; маршрут preset не изменяет.
- `MagazineHandoff` принимает один живой `EditorialHome` внутри `ImageEditorProvider` из `test_5`: DOM сайта и состояние редактора сохраняются; фото используют общую с `/test_5` IndexedDB `travel-club-test-5-photos` на том же origin.
- `scene.ts` рисует прозрачный WebGL canvas: depth-tested shader вырезает правую страницу, `ShadowMaterial` сохраняет тени; `projection.ts` проецирует настоящий DOM сайта через `matrix3d` по четырём углам листа, без скриншота/дубликата homepage.
- `magazine-handoff.tsx`: opening → ready (TARGET) → focus → site; во время intro камера по общему clock плавно приближается от distance11.5 к preset distance7 (quintic easing с responsive safety fitting). После TARGET native scroll на 1.25 высоты viewport приближает камеру к правой странице, rAF сглаживает за 65ms. На границе сайт возвращается в native flow, transform/clip снимаются; обратная прокрутка возвращает проекцию того же DOM на финальной дистанции без повтора intro.
- До TARGET блокируются overflow/wheel/touch/scroll-клавиши; до конца focus сайт inert, затем inert сцена. Cleanup восстанавливает overflow/history.scrollRestoration и освобождает listeners/RAF/GPU; скрытая вкладка останавливает intro без catch-up, TARGET рисуется по требованию.
- «К сайту», вход с hash, reduced motion, ошибка загрузки/WebGL и context loss сразу открывают сайт, снимая блокировку; hash разрешается через ID с безопасным decode и fallback на `#start`. Без JavaScript noscript показывает сайт.
- Проверено 14 октября из `frontend/`: `npm.cmd run lint`, `npm.cmd run typecheck`; `npm.cmd test -- --run --testTimeout=15000` — 94 passed, 21 файл. `$env:PLAYWRIGHT_BASE_URL='http://localhost:3001'; npm.cmd exec playwright test e2e/test-7-handoff.spec.ts -- --workers=1 --output=test-results/test-7-stable` — 10 passed.
- Production-сборка/запуск из корня: `docker compose up -d --no-deps --build --wait frontend`; успешно пересобрал и запустил `/test_7` 15 октября. Production-набор `npm.cmd exec playwright test e2e/test-7-handoff.spec.ts e2e/test-6-scene.spec.ts e2e/test-5-camera.spec.ts e2e/test-5-photo-editor.spec.ts -- --workers=2 --output=test-results/test-7-production` — 46 passed (1.9m). Новых зависимостей и env-переменных нет.
### Карта выбранного дня в конструкторе — 17 октября 2026

- `frontend/src/components/trips/trip-editor.tsx` передаёт текущий draft и выбранный день в `DayRouteMap` сразу под календарём; границы, режимы и порядок меняются через общий `change` → `DraftSession`, сохраняются обычным PUT поездки.
- `frontend/src/lib/contracts.ts` и `backend/app/schemas.py` задают `MapPlace` (имя, адрес, координаты, provider, optional provider_place_id/source_url), `TravelMode=drive|walk|transit`; текстовое `location` не заменяет привязку координат.
- Item хранит nullable `map_place`/`map_end_place`, день — nullable `map_start`/`map_end` и `map_leg_modes`; JSONB в `backend/app/models.py`, миграция `backend/migrations/versions/c93f62a1b7d8_trip_map_places.py`. Legacy frontend fixtures допускают отсутствие новых свойств; DTO подставляет null/пустой список.
- Режимы привязаны к направленной паре ключей `item:{uuid}:start|end` либо `day:start|end`; backend отвергает самопары/дубликаты/невалидные ключи, сохраняет синтаксически корректные устаревшие preferences. `backend/app/trips.py` при duplicate обновляет UUID существующих item-ключей вместе с IDs дней/элементов.
- `frontend/src/lib/trips.ts` обязан переносить map-поля в `tripInput`: это граница read → edit → save → reload; `frontend/src/lib/draft-session.ts` сохраняет новые правки, сделанные во время незавершённого save.
- `frontend/src/lib/day-route.ts`: чистый `buildDayRoute(trip,dayId)` возвращает nodes/legs/start/end/warnings; использует календарные даты/legacy overnight-правила из `frontend/src/lib/calendar.ts`, без provider calls и финансовых формул.
- Границы: ручная точка → ночное прибытие/отправление → отель предыдущей/следующей ночи. Несколько равноправных кандидатов дают ambiguous и требуют выбора; «Автоматически» сбрасывает ручную границу. События со временем сортируются по времени, остальные — position/UUID.
- Ночной день отправления заканчивается в `map_place` аэропорта/станции отправления; день прибытия начинается в `map_end_place`. Flight/train_bus/transfer образуют scheduled legs, могут ссылаться на off-day endpoints; карта рисует только nodes текущего дня.
- Только connection legs запрашиваются у провайдера и входят в `summarizeDayRoute`; scheduled переезды показывают местные даты/часы отдельно, без пересчёта часовых поясов. UI выводит planner warnings о пересечениях расписания.
- Узел без координат разрывает связность: соседние известные точки не соединяются через него. Недоступность маршрута остаётся null/«Нет данных» и неполным итогом; нулевая длина допустима для совпадающих координат, а не вместо неизвестного пути.
- `frontend/src/components/trips/day-route-map.tsx` получает все три оценки каждого connection, рисует геометрию выбранного режима и сохраняет предпочтение; подписи/оценки находятся под картой. Старые ответы после смены дня игнорируются.
- `frontend/src/components/trips/location-picker.tsx` встроен в `frontend/src/components/trips/item-form.tsx`: поиск, Google URL, ручные координаты, клик/drag пина дают кандидата; запись только после подтверждения. Generation guard не даёт старому resolve-link перезаписать новый ввод.
- `frontend/src/components/trips/map-canvas.tsx` импортирует Leaflet только в effect (leaflet 1.9.4, @types/leaflet 1.9.22); labels/popup создаются через textContent. GeoJSON использует [longitude,latitude], Leaflet — [latitude,longitude]; attribution видим, ошибка tiles сохраняет точки и предлагает retry.
- Initial mobile fit и desktop → mobile resize проверены: `ResizeObserver` сначала вызывает invalidateSize, затем повторяет fitBounds всех markers и выбранной geometry с padding 28; одного invalidateSize недостаточно. Cleanup удаляет карту/observer.
- `frontend/src/lib/maps-client.ts`: общая session cache по координатам+режиму, TTL 5 минут, максимум 400 записей, concurrency 3; retry удаляет запись, rejected promise не кешируется. `frontend/src/lib/use-maps-config.ts` разделяет config promise на 30 секунд с явным retry.
- `backend/app/maps.py` подключён через `backend/app/main.py`; все `/api/maps/*` требуют Admin: GET config/search/reverse, POST resolve-link/route. Config отдаёт только maps_key/search_enabled/routing_enabled; provider payload и серверный ключ наружу не выходят, provider URL редактируется в httpx logs.
- `GEOAPIFY_API_KEY` — только backend secret, `GEOAPIFY_MAPS_API_KEY` — browser tile key из authenticated runtime config; оба передаются в `compose.yaml` и `compose.deploy.yaml`. NEXT_PUBLIC-переменных для ключей нет; без ключей доступны сохранение ручных мест и offline-разбор полных Google URL, не фиктивная карта.
- Google selected pin/query разбирается отдельно от viewport: @lat,lon/ll не считаются местом. Short URL: allowlist, public DNS pinning с TLS/SNI, до трёх redirects, без HTML scraping; неподдержанная ссылка требует поиска/ручного пина.
- Transit сначала использует transit; только пустой маршрут запускает approximated_transit, ошибки quota/network/auth не запускают fallback. Все transit-оценки приблизительные, без гарантии расписания на дату поездки; профиль bus не применяется.
- Runtime/origin/egress и ключи описаны в `docs/geoapify-setup.md`: после смены env нужен backend recreate, restart не перечитывает env; frontend rebuild для смены ключа не нужен. Deploy Compose даёт только backend сеть maps_egress, БД остаётся во внутренней app, новых exposed ports нет.
- Лимит credits общий для ключей проекта; tiles, geocoding и три оценки участка расходуют его вместе. Кеш не обещает укладывание в квоту; Statistics и качество реальных маршрутов, включая Китай, проверяются после подключения ключей.
- Проверено 17 октября из корня: `docker compose exec -T backend pytest -q` — 106 passed; `docker compose exec -T backend ruff check .` — passed. Clean/downgrade/seeded legacy upgrade миграции проверены на изолированной БД; последующих schema changes нет.
- Проверено из `frontend/`: `npm.cmd run lint`, `npm.cmd run typecheck`; `npm.cmd test -- --run --testTimeout=15000` — 119 passed / 26 files. Maps tests: `backend/tests/test_maps.py`, `frontend/src/lib/day-route.test.ts`, `frontend/src/lib/maps-client.test.ts` и map/picker/editor tests в `frontend/src/components/trips/`.
- Production build/запуск из корня: `docker compose up -d --no-deps --build --wait frontend` — exit 0, frontend healthy. Из `frontend/`: `npm.cmd exec playwright test e2e/constructor.spec.ts e2e/trip-map.spec.ts -- --workers=1` — 29 passed (22+7), 1.4 min; актуальный resize repair включён.
- `docs/qa/trip-day-maps/README.md` описывает реальные Leaflet DOM/CRUD/auth проверки, initial 390/320 и resize bounds, keyless/error/stale-response сценарии и screenshots; provider/tile fixtures существуют только в тестах. Длинный admin-логин может расширять общую шапку на 320px — отдельное существующее ограничение.
- Live Geoapify tiles/search/routing/transit, China coverage, реальные browser-origin/backend-egress ограничения и расход credits пока не проверены: ключей нет; локальные тесты не подтверждают эти свойства и не означают выполненный deploy.
### Интерактивный журнал `/test_10` — 18 октября 2026

- Вход — `frontend/src/app/test_10/page.tsx` (noindex); локальные UI, данные и стили — `frontend/src/components/test_10/`. `magazine-experience.tsx` управляет вступлением, тремя разворотами и навигацией; `spreads.tsx` экспортирует `MagazineSpread({ index, side? })`, `data.ts` — Hero + Formats, Next Issue, Thailand ’26. Ссылки ведут на существующие `/formats`, `/start`, `/start?format=group`, `/archive`.
- Это desktop-эксперимент от 1100 × 700 px; ниже показывается объяснение со ссылкой на `/test_8`. `magazine.module.css`: разворот 1.6, ширина `min(1250px, calc(100vw - 112px), calc((100svh - 120px) * 1.6))`, без прокрутки страницы. Основной текст ≥14px, метаданные ≥11px; проверять 1280×768 и 1440×900.
- Цвета и шрифты приходят из `public-site/site-tokens.ts` через `createSiteVariables()` и `public-site/fonts.css`: TC Golos / TC Lora. SVG-логотип — `/test_9/TC_Logo_Editorial_Signature_Cream.svg`; не заменять его текстовой имитацией.
- `magazine-intro.tsx` переиспользует сцену и `preset.json` из `test_7` с `variant: "fast"`. Необязательный последний аргумент `SpreadSceneOptions` в `test_7/scene.ts` (`frame`, `targetLeft`) добавляет проекцию целого разворота; без него сохраняется прежняя передача правой страницы. `ResizeObserver` измеряет frame, `pageMatrix` совмещает живой DOM с четырьмя углами WebGL; на TARGET transform снимается, сцена/GPU освобождаются.
- `capture-page.ts` снимает только уже отрисованный левый лист первого разворота: ждёт шрифты/изображения, встраивает computed styles, локальные картинки и четыре font-файла `/test/fonts/` в SVG foreignObject → canvas 2×. Эта текстура используется на обороте последнего перелистываемого листа, чтобы он совпал с живым DOM; ошибка capture/WebGL открывает читаемый журнал.
- После вступления листание — CSS rotateY длительностью 450ms, с блокировкой повторных команд; кнопки по краям, Previous/Next, оглавление и ←/→ используют одну навигацию. Временные копии `inert`/`aria-hidden`; при смене листа фокус из книги переносится в nav. Reduced motion пропускает вступление и анимацию; skip, потеря WebGL и уменьшение окна освобождают сцену.
- `?spread=1|2|3` открывает нужный разворот без вступления; неизвестный/повторённый параметр нормализуется в `spread=1`, остальные query сохраняются. `pushState` и `popstate` поддерживают Back/Forward без повторного вступления; без параметра запускается intro.
- `frontend/public/test_10/` содержит пять новых локальных WebP с Pexels; `manifest.json` и `README.md` фиксируют источники/авторов/лицензию и иллюстративное назначение. Фото не выдаются за команду/участников поездки; изображение Next Issue не объявляет направление. После изменения public assets пересобрать frontend.
- Проверено 18 октября из `frontend/`: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`; `npm.cmd test -- --run --testTimeout=15000` — 119 passed / 26 files. Из корня `docker compose up -d --no-deps --build --wait frontend` — healthy. Production `http://localhost:3000`: `npm.cmd exec playwright test e2e/test-10-magazine.spec.ts e2e/test-7-handoff.spec.ts e2e/test-8-concept.spec.ts -- --workers=1 --output=test-results/test-10-production` — 23 passed (6 + 11 + 6); естественное вступление завершилось с ошибкой углов <1px и удалением canvas. Матрица 24 кадров (1280/1440/1728/1920 × 768/900 × 3 разворота) — без переполнения документа/листов/контента и битых изображений; `docs/qa/test-10/final-matrix.json`, `final-{1..3}-{width}x{height}.png`, `contact-sheet.jpg`. `/test_8` до/после совпал попиксельно при 1440×900 после decode фото; его исходники и прежние dirty-файлы сохранены. Из общего кода изменена только opt-in конфигурация `test_7/scene.ts`; новых зависимостей/env/backend-изменений нет.

### Редакционный журнал «Между строк» `/test_11` — 19 октября 2026

- Вход — `frontend/src/app/test_11/page.tsx` (noindex); UI, данные и CSS изолированы в `frontend/src/components/test_11/`, карта — его `README.md`. `spreads.tsx` экспортирует `MagazineCover()`, `MagazineSpread({ index, side?, animate?, reveal? })` и `RevealPhase`; `side=left|right`, `index=0–5`. `data.ts` задаёт шесть разворотов: Hero + Formats, Next Issue, Thailand ’26, China ’26, Archive ’25, Point of View + Start.
- Desktop от 1100 × 700 px, ниже — ссылка на `/test_8`. `magazine.module.css` задаёт oxblood/plum окружение, aspect ratio 1.6 и ширину `min(calc(100vw - 72px), calc((100svh - 64px) * 1.6))`, без прокрутки документа. Цветовые переменные — через `frontend/src/components/public-site/site-tokens.ts`, TC Golos / TC Lora — через соседний `fonts.css`; SVG-логотипы — `frontend/public/test_9/`.
- `magazine-intro.tsx` ждёт активации distant cover без таймера; прозрачная кнопка на viewport поддерживает Enter/Space и ранний клик. Локальный `intro-scene.ts` читает helpers/fast preset из `test_7`: восемь декоративных листов и камера ведут к живому развороту; листы не являются главами. «Обложка» сохраняет индекс. На TARGET ресурсы освобождаются; skip, resize, reduced motion и capture/WebGL failure открывают читаемый fallback, скрытая вкладка приостанавливает часы.
- `reading-turn.tsx` экспортирует `ReadingTurn({ from, to, direction, onPrepared, onComplete })`: source остаётся видимым до готовности настоящих source-static/target-pending текстур; watchdog capture — 6 s, ошибка даёт CSS fallback на 1000 ms. Общий `capture-page.ts` ждёт fonts/decode, встраивает assets и шрифты в SVG foreignObject → canvas 2×; logical inset корня сбрасывается, alpha отклоняет пустую текстуру. Abort защищает от запоздалых capture после завершения/unmount.
- `reading-turn-engine.ts` экспортирует `createReadingTurn(host, source, target, direction, complete): () => void`; read-only `test_7/deformation.ts` даёт curved mesh 64×16 сегментов / 2210 вершин с настоящими лицевой/оборотной текстурами и тенью. Ортографическая камера, движение 1000 ms после capture; скрытая вкладка приостанавливает WebGL clock и CSS leaf/shadow. Resize/reduced motion/context loss безопасно завершают переход; disposer снимает rAF/listeners и освобождает geometry/materials/textures/shadow/renderer/canvas. В спокойном чтении canvas/rAF отсутствуют.
- `RevealPhase = static | pending | enter`: default static — печатный финал; pending с первого paint сохраняет якоря и скрывает отложенные слои; enter раскрывает их из той же позы примерно за 2.4–3.0 s. Parent ставит pending целевому DOM, обороту листа и intro-проекции, static уходящей странице; после движения — enter без вспышки финала. Hero — строки/кадр, Next — ирис, Thailand — буквы/полосы, China — вертикальный кадр/текст, Archive — отпечатки, финал — принципы/шаги. Reduced motion сразу показывает финал.
- `magazine-experience.tsx` владеет индексом, turn lock, фокусом и history; навигация/статус/query используют `SPREADS.length`. `?spread=1–6` пропускает intro, неизвестное/повторённое значение нормализуется в 1 с сохранением остальных query. Края, оглавление и ←/→ используют один переход; модифицированные стрелки и поля ввода не перехватываются. Копии inert/aria-hidden; Back/Forward прерывают переход с cleanup и показывают выбранную главу.
- China ’26 — четверо из Москвы, двое местных друзей в Пекине, далее Шанхай; Archive ’25 — Китай/Мадагаскар/Таиланд, личные поездки до клуба; Point of View — три принципа и начало разговора. Источник фактов — прежние `test_8/concept-home.tsx` и `public-site/archive-data.ts`. Семь локальных WebP, включая новые `beijing-hutong.webp` и `madagascar-baobabs.webp`, описаны в `frontend/public/test_11/README.md` и `manifest.json`; фото иллюстративные, Next Issue в подготовке. CTA ведут на существующие `/start`, `/formats`, `/start?format=group`, `/archive`; `/start` не отправляет и не сохраняет ответы. После public assets нужен rebuild; capture — `frontend/scripts/capture-test-11.mjs`, evidence — `docs/qa/test-11/`.
- Проверено 19 октября из `frontend/`: `npm.cmd run lint`, `npm.cmd run typecheck`; `npm.cmd test -- --run --testTimeout=15000` — 119 passed / 26 файлов. Production: `npm.cmd exec playwright test e2e/test-11-magazine.spec.ts e2e/test-11-reveal.spec.ts e2e/test-11-visual.spec.ts e2e/test-10-magazine.spec.ts e2e/test-7-handoff.spec.ts e2e/test-8-concept.spec.ts -- --workers=1 --output=test-results/test-11-completion-final-stable` — 48 passed (25 текущих + 23 legacy), exit 0. После push из корня `docker compose up -d --no-deps --build --wait frontend` — exit 0, HTTP 200. `docs/qa/test-11/completion-acceptance.md` содержит 33 production PNG, bounds 12 страниц в трёх размерах, cleanup/idle, G4 PASS и сохранность 30 SHA256. Зависший ответ старого Next optimizer 1080 WebP восстановился после restart frontend; затем весь suite прошёл. Причина runtime остаётся выводом по наблюдениям, исходники прежних маршрутов не менялись.
- Правки `/test_11` по комментариям 19 октября: `PHOTOS.hero` → `hero-mountain.webp` (Muharrem Alper / Pexels), `PHOTOS.thailandCover` → `thailand-bright.webp` (Anastasia Yudin / Pexels); источники/лицензии в `frontend/public/test_11/{README.md,manifest.json}`. `coast` обложки и `nature` архива сохранены. `heroFog` — реальный DOM со blurred photo/градиентами, чтобы туман сохранялся в capture при перелистывании; над светлым небом используется Navy SVG.
- Услуги и три коротких принципа — локальный `test_11/data.ts`; финальный CTA следует после «Разговор → Предложение → Согласование». `/start` по-прежнему демонстрационный: отправки и сохранения нет. Слоган hero из двух строк: reduced-motion reset должен перекрывать специфичность pending-правил; проверять видимость внутри clipping ancestors, а не только bounds страницы.
- `test_11/reading-turn.tsx`: общий 6 s watchdog остаётся активным до готовности CSS fallback; при зависших capture/decode открывает живой целевой разворот и снимает navigation lock. Regression с реальным удержанным HTTP-ответом находится в `frontend/e2e/test-11-handoff.spec.ts`; геометрия новых строк/CTA — в `test-11-comments.spec.ts`. Проверять 1100×700 и 1314×1244 помимо стандартных desktop размеров.

### Журнал `/test_12` — 20 октября 2026

- Вход — `frontend/src/app/test_12/page.tsx` (noindex); локальные UI, данные и CSS — `frontend/src/components/test_12/`, карта — его `README.md`. Семь глав / 14 страниц, обложка отдельно: Услуги (Hero + Formats), О нас, Первая поездка (Next Issue), Таиланд (Thailand ’26), Китай (China ’26), Архив (Archive ’25), Начать (Point of View + Start). Desktop от 1100 × 700 px, ниже — ссылка на `/test_8`.
- `data.ts` хранит `SPREADS`, `FORMATS`, `PHOTOS`, `FOUNDER_PHOTOS`, архив и принципы. Два настоящих портрета пока отсутствуют: `FOUNDER_PHOTOS.vasilisa` / `.ramil` имеют `src: null`, `spreads.tsx` показывает подписанные места для фото. Для замены задать реальные `src`, `alt`, `position`; композиция переключится автоматически. Василиса и Рамиль представлены равноправными сооснователями. Цены Travel Design / Travel Ready относятся к услугам клуба, расходы поездки указаны отдельно.
- `magazine-experience.tsx` управляет индексом, history, turn lock и навигацией; count берётся из `SPREADS.length`, подпись — `navLabel ?? title`. `?spread=1–7` открывает чтение без intro; неверное/повторённое значение нормализуется в 1. Локальные intro/capture/reading engines используют read-only helpers/preset/геометрию `test_7`; shared tokens/fonts — `design-system` и `public-site`, фото — `frontend/public/test_11/`, SVG — `frontend/public/test_9/`, шрифты — `frontend/public/test/fonts/`. Общие исходники/assets сохраняются read-only.
- Изолированный production preview — `http://localhost:3013/test_12`, контейнер `travel-club-test12-preview`, bind `127.0.0.1:3013`; dev — порт 3012. Существующий runtime на 3000 не менялся.
- Проверено координатором 20 октября: из `frontend/` `npm.cmd ci --no-audit --no-fund`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test -- --run --testTimeout=15000` — 113 passed / 26 файлов; из корня worktree `docker build -t travel-club-test12:preview ./frontend` — production Next build, 36 routes. На `PLAYWRIGHT_BASE_URL=http://localhost:3013` команда `npm.cmd exec playwright test e2e/test-12-magazine.spec.ts e2e/test-11-magazine.spec.ts e2e/test-11-reveal.spec.ts e2e/test-11-comments.spec.ts -- --workers=1 --output=test-results/test-12-production` дала 36 passed (13 новых и 23 регрессии), exit 0. Production capture — 39 PNG, 15 сравнений контрольных глав без расхождений; отчёт — `docs/qa/test-12/`.

### Журнал `/test_13` — 21 октября 2026

- Изолированный noindex-маршрут — `frontend/src/app/test_13/page.tsx`, локальная реализация — `frontend/src/components/test_13/`. Семь глав / 14 страниц и query `?spread=1–7` сохранены; desktop от 1100 × 700 px, ниже и без JavaScript — ссылка на `/test_8`.
- Motion сосредоточен в четырёх файлах: `spreads.tsx`, `spreads.module.css`, `magazine-experience.tsx`, `magazine.module.css`. Шесть приёмов: маска native-заголовков, каскад текстовых групп, прорисовка разделителей, Lucide-иконки, hover/focus ссылок и единый индикатор оглавления. Текст не разбивается на символы.
- Единственный триггер enter — прежние `introComplete` / `ReadingTurn.onComplete`; последний ждёт landed, decode живых target img и два rAF. Secondary motion не удерживает navigation lock. `RevealPhase = static | pending | enter`; static/capture и reduced motion оставляют читаемый финал.
- Индикатор оглавления измеряет существующий `shownIndex` через `useLayoutEffect`, `ResizeObserver`, scroll и fonts.ready; до landing показывает source, после — destination. CSS transition 260 ms; отдельного навигационного индекса и постоянного rAF нет, observer/listener снимаются при cleanup.
- `data.ts`, `magazine-intro.tsx`, `intro-scene.ts`, `reading-turn.tsx`, `reading-turn-engine.ts`, `capture-page.ts` совпадают с TEST_12 по SHA256. Старые фото-reveal, assets, shared helpers/tokens и контрольные `/test_12`, `/test_11`, `/test_10` используются read-only; для этой версии менять только локальные TEST_13 файлы.
- Новые annotations `data-editorial`, `data-step`, `data-draw`, `data-text-legacy` относятся к тексту; не ставить cascade на предка фотографии. При CSS-правках проверять реальную видимость заголовков и resting/hover underline: reset обязан перекрывать исходные pending/enter selectors, геометрия ссылки не должна сдвигаться.
- Локальный production preview — `http://localhost:3114/test_13`, контейнер `travel-club-test13-preview`, bind `127.0.0.1:3114`; dev — `http://localhost:3113`. Production build из корня worktree: `docker build -t travel-club-test13-preview:local ./frontend`; существующие runtime на 3000 и control на 3013 не перезапускаются.
- Проверено координатором: из `frontend/` `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test -- --run --testTimeout=15000` — 113 passed / 26 файлов; Docker production build прошёл, preview отвечает HTTP 200. После финальной CSS-правки production Playwright — 36 passed / 1.1 min: `$env:PLAYWRIGHT_BASE_URL='http://localhost:3114'; npm.cmd exec playwright test e2e/test-13-motion.spec.ts e2e/test-12-magazine.spec.ts e2e/test-12-review-comments.spec.ts e2e/test-11-reveal.spec.ts e2e/test-10-magazine.spec.ts -- --workers=2`.
- Новый браузерный набор — `frontend/e2e/test-13-motion.spec.ts`; capture — `docs/qa/test-13/motion-capture.mjs`, независимая приёмка — `docs/qa/test-13/blind-acceptance.md`. Новых зависимостей и env-переменных нет.


- Правки TEST_13 21 октября: `pending` скрывает новый анимируемый текст, иконки и линии в live DOM и capture до `enter`; static/reduced остаются видимыми. REVEAL 1000/1200 ms, CASCADE 650 ms с шагом 160 ms, до 1.93 s. Кнопка открытия под обложкой; nav hover 44→50 px в зарезервированном слоте 52 px. Проверки: 39 production Playwright + 113 Vitest; `docs/qa/test-13/refinement.md`.

### TC Research — закрытый модуль интервью

- Маршруты `/research`, `/research/new`, `/research/[id]` находятся в `frontend/src/app/research/`; общий `layout.tsx` вызывает существующий `requireAdmin()`. Интерфейс — `frontend/src/components/research/`, типизированный API и browser draft-ответы — `frontend/src/lib/research.ts`. Модуль использует существующую учётную запись Travel Club, отдельной регистрации и паролей Research нет; публичная навигация не менялась.
- FastAPI router `backend/app/research.py` обслуживает только `/api/research` и требует существующую admin session на каждом endpoint. `backend/app/research_domain.py` рассчитывает объяснимую рекомендацию категории; `backend/app/research_bank.py` загружает и валидирует JSON из `backend/app/research_data/`. Модели добавлены в `backend/app/models.py`, схема — Alembic-миграциями в `backend/migrations/versions/`. Таблицы: `research_respondents`, `research_interviews`, `research_answers`.
- Четыре категории: `trips_experienced`, `trips_beginner`, `travel_design`, `travel_ready`. Скрининг рекомендует сценарий с объяснением и оценкой силы сигнала; интервьюер может выбрать итоговую категорию вручную. Состояния интервью — `draft`, `in_progress`, `completed`; смена screening не переписывает начатый сценарий или ответы. При создании интервью сохраняются снимок текстов вопросов и версии банка/сценария; на пару `interview_id + question_code` приходится один ответ с revision/CAS-защитой. Набросок ответа в браузере хранится в localStorage до подтверждённого сохранения backend.
- Банк `questions.json` содержит 82 вопроса и 17 гипотез; соседние `scenarios.json`, `screening.json`, `classification.json` задают сценарии, анкету и правила. `docs/tc-research/json-data.md` описывает версионирование и проверку командой `python -m app.research_bank validate` в собранном backend-образе. Новая конфигурация применяется к новым интервью, уже сохранённые snapshots остаются прежними. Опциональный модуль B добавляется интервьюером; conditional X-вопросы и предложения отключены, пока нет реальных цен и условий (`offers.enabled=false`).
- Авторизованный `/api/research/export.xlsx` формирует полный экспорт, независимый от текущего фильтра списка. `backend/app/research_export.py` создаёт листы Respondents, Interviews, Answers, Questions и Hypotheses; экспорт — рабочая выгрузка, не backup PostgreSQL.
- Локальный запуск, вход существующим администратором и остановка без удаления данных описаны в `docs/tc-research/README.md`. HTTPS-поддомен, renderer/Nginx, отдельный `RESEARCH_ORIGIN` и обновление только backend после изменения env описаны в `docs/tc-research/deployment.md`; сохранять основной `ALLOWED_ORIGIN`. Документ описывает процедуру: DNS, VPS и сертификат для TC Research пока не настроены. Резервная копия и пробное восстановление в отдельную БД — `docs/tc-research/backup.md`; XLSX не заменяет custom-format `pg_dump`.
- Draft interview start requires a valid current config and a usable scenario for the selected category; every `question_codes` entry must exist in the bank (an empty array is valid). Missing or invalid config disables Start with an explanation, and the handler repeats the guard; saved snapshots and answers remain readable independently of current config.
- Проверки завершённого TC Research: backend pytest — 149 passed в изолированном Compose project, Ruff passed; frontend lint и typecheck прошли, Vitest — 130 passed, Next.js production build прошёл.
- Завершённые интервью хранят неизменяемые версии в `research_interview_versions`: миграция `a2f7c91b4d60` backfill-ит version 1, завершение создаёт начальный снимок, явное сохранение — следующий. Снимки включают профиль, screening, вопросы и ответы; изменения screening/category и новые снимки сохраняются атомарно. Старые версии доступны только для чтения, autosave завершённого интервью не меняет историю.
- Безопасная цель после входа реализована в `frontend/src/lib/return-target.ts`; proxy сохраняет относительный путь и query protected-страницы, а прямой вход ведёт на защищённый `/home` с каталогом страниц.
- Проверено 22 октября 2026: frontend Vitest — 161 passed / 38 файлов; lint, typecheck, production build (38 маршрутов) прошли. Изолированный Compose: backend pytest — 156 passed, Ruff и единственная Alembic head `a2f7c91b4d60` прошли; `research.spec.ts` — 3 passed, фильтры — 1 passed. Alembic сообщает один deprecation warning об отсутствующем `path_separator`.
<!-- autopilot:end -->
