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

<!-- autopilot:end -->
