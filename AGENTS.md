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

Travel Club сейчас — закрытый конструктор поездок для администратора: маршрут по дням, календарь событий, ручные курсы, расчёт, сохранение и клиентский просмотр. Публичная главная `/` служит интерактивной витриной для выбора палитры и шрифтов; страницы услуг остаются лёгкими заглушками, работающей оплаты нет. Стек: FastAPI, SQLAlchemy 2, Alembic, PostgreSQL; Next.js 16, React 19, TypeScript, Tailwind; Docker Compose.

### Запуск и проверка (PowerShell, корень репозитория)

```powershell
python scripts/init_env.py
docker compose build
docker compose up -d --wait
docker compose exec backend python -m app.bootstrap
docker compose exec -T backend pytest -q
docker compose exec -T backend ruff check .
docker compose exec -T backend alembic current
docker compose exec -T backend alembic check
```

`init_env.py` создаёт игнорируемый `.env`, если его нет; bootstrap интерактивно создаёт первого администратора (его нет по умолчанию). Backend перед запуском API выполняет `alembic upgrade head`. Проверены Compose build/up, backend pytest (52 passed), Ruff и `alembic check` без новых операций. После изменения схемы проверять миграции на чистой временной БД.

```powershell
cd frontend
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:e2e
```

Проверены frontend unit (65 passed), Playwright (26 passed), lint, typecheck и production build. Playwright требует работающий сайт на `localhost:3000` и установленный Chromium (`npx.cmd playwright install chromium`). Браузерные сценарии — `frontend/e2e/`, включая `constructor.spec.ts`; приёмочные сценарии — `docs/acceptance.md`.

### Где менять код

- `compose.yaml`, `backend/Dockerfile`, `frontend/Dockerfile` — PostgreSQL, backend и frontend; backend-образ получает `shared/pricing-vectors.json` через named build context.
- `backend/app/main.py`, `auth.py`, `trips.py` — FastAPI, сессии, `/api/trips`: CRUD, расчёт, дублирование, клиентский просмотр, контроль версий и дат.
- `backend/app/schemas.py`, `validation.py`, `pricing.py` — DTO, проверки и окончательный Decimal-расчёт; `models.py`, `db.py`, `migrations/` — таблицы и Alembic. Поля расписания добавляет `8b97c412e6af_schedule_fields.py`, подвиды пунктов и длительности аэропорта — `f64a81e0c9d2_item_categories_airport_minutes.py`.
- `frontend/src/app/admin/`, `frontend/src/components/trips/trip-editor.tsx`, `trip-calendar.tsx`, `item-form.tsx`, `airport-block-form.tsx`, `editor-panels.tsx`, `ui.tsx` — закрытые экраны; `TripCalendar` показывает сетку и обрабатывает указатель, `TripEditor` владеет черновиком, выделенным днём, панелями и расчётом, `ItemForm` проверяет поля, `AirportBlockForm` меняет время приезда/выхода, `Modal` управляет панелью. Стили календаря и панели — `frontend/src/app/globals.css`.
- `frontend/src/app/page.tsx`, `frontend/src/components/public-home/home-experience.tsx`, `theme.ts`, `color-wheel.tsx`, `home.css`, `presets/recommended.json` — публичная главная, редактор цветов и шрифтов, цветовой круг и каталог рекомендованных вариантов; пользовательские пресеты хранятся в localStorage текущего браузера (`travel-club-home-presets-v1`), активная тема — в существующем ключе `travel-club-home-style-v1`. `frontend/public/images/` — локальные иллюстративные фото с источниками в `README.md`. Публичные заглушки используют `frontend/src/app/(public)/layout.tsx`.
- `frontend/src/app/test/page.tsx`, `frontend/src/components/test/` — изолированная редакционная витрина `/test`: `data.ts` хранит контент и цветовые токены выпусков, `editorial-home.tsx` — выбор выпуска и формата, `editorial.module.css` — scoped стили; локальные фото и WOFF2 Golos/Lora — `frontend/public/test/`. `lead.ts`/`lead-form.tsx` валидируют заявку через `SubmitLead`, по умолчанию demo без передачи и хранения данных; браузерные проверки — `frontend/e2e/test-home.spec.ts`.
- `frontend/src/lib/trip-ui.ts` — пять категорий событий, подвиды и отдельный список допрасходов. `calendar.ts` — `buildCalendarEntries`: разрезает события по дням, расставляет пересечения, интервалы отелей, отметки заезда/выезда и производные аэропортовые блоки; `calendar-interaction.ts` — выбор интервала и перенос события или отеля в пределах поездки. `contracts.ts`, `api.ts`, `trips.ts`, `draft-session.ts`, `pricing.ts`, `server-auth.ts` — DTO, запросы, черновик, предварительный расчёт и проверка входа.
- `backend/tests/`, `frontend/src/lib/*.test.ts`, `frontend/src/components/trips/*.test.tsx`, `frontend/e2e/`, `shared/pricing-vectors.json` — проверки API/БД, календаря и форм, браузерные сценарии и общие финансовые векторы.

### Поток данных и соглашения

UI вызывает типизированный `/api` через same-origin rewrite Next (`frontend/next.config.ts`) → FastAPI/Pydantic → SQLAlchemy/PostgreSQL. Финансовый источник истины — `backend/app/pricing.py:calculate_trip(TripInput)`; `frontend/src/lib/pricing.ts:calculateTrip` показывает предварительную смету, сохранённый документ содержит серверную. Деньги, курсы, количества и проценты в JSON — строки; backend считает через Decimal, хранит NUMERIC и снимки исходной суммы, курса и суммы в базовой валюте. Семь режимов стоимости, наценка и целевая маржинальность разделены; многодневные расходы нельзя дублировать в итогах дней.

На главной пять цветовых ролей и отдельные шрифты заголовков/текста меняются через CSS-переменные корня `.travel-home`. HEX-поля и маркеры круга синхронизированы; выбранный вариант валидируется и хранится только в браузере в `localStorage` (`travel-club-home-style-v1`). Круг меняет оттенок и насыщенность, ползунок — светлоту.

Поездка хранится в `trips`, `trip_days`, `trip_items`, `trip_currency_rates`. `TripUpdate.version` защищает от параллельной перезаписи; сокращение диапазона с заполненными днями или связанным конечным днём требует подтверждения. `DraftSession` удерживает несохранённые изменения и последовательно сохраняет новые редакции. Клиентский preview отдаёт только разрешённые поля без внутренних цен и заметок.

День имеет свободный `status`; пункт может иметь `end_day_id`, `external_url`, время начала/окончания; отель — даты и необязательные `check_in_time`/`check_out_time`. Конечный день должен принадлежать той же поездке; при его указании проверяется порядок дат и времени. URL должен быть полным http/https. Форма нового ночного события предлагает следующий день в пределах поездки; ручной выбор конечного дня сохраняется. Времена — местные часы города без пересчёта часовых поясов. Сетка показывает пункты с началом и окончанием, отели — отдельными полосами и необязательными отметками часов; пункты без времени и общие расходы остаются в списке. Интервал отеля заканчивается в дату выезда, которая не оплачивается. Календарь показывает 7/3/1 дня по ширине экрана: щелчок по пустой ячейке создаёт часовой интервал, протягивание выбирает четверти часа, перетаскивание переносит событие с сохранением длительности или отель с сохранением числа ночей; перенос за границы поездки отклоняется. Для переноса касанием есть отдельный переключатель. Создание из сетки открывает панель с обязательным выбором типа; обычное добавление уже задаёт тип. Изменения существующих пунктов проходят через `session.change` и автосохранение; панель целиком выезжает справа и уходит обратно за 220 мс, оставаясь смонтированной до конца закрытия.

Основные категории добавления: перелёт, транспорт, проживание, еда, впечатления. Подвиды транспорта: автобус, поезд, такси, аренда, водный транспорт; еды: ресторан, кафе, бар, уличная еда; впечатлений: экскурсия, активность. Под календарём отдельные допрасходы без времени: страховка, SIM-карта, связь, визовый и сервисный сборы, другое. Старые типы `train_bus`, `rental`, `excursion`, `insurance` остаются читаемыми; страховка из нового списка создаётся как `other` с подвидом `insurance`. Выбор подвида и длительности аэропорта хранится в пункте поездки и проходит через `tripInput(TripDocument)` при повторном сохранении.

У перелёта с часами вылета и прилёта календарь выводит связанные с ним блоки «Приезд в аэропорт» и «Выход из аэропорта»: по умолчанию 180 минут до вылета и 60 минут после прилёта. Это производные отображения по `itemId`, а не отдельные пункты или затраты: перенос и удаление рейса автоматически меняют или убирают блоки. По нажатию на блок можно изменить дату и время его свободного края в пределах 0–24 часов от рейса; длительность сохраняется в `airport_before_minutes` или `airport_after_minutes` самого рейса, ноль скрывает блок. Ночные интервалы режутся по дням и показываются только в пределах дат поездки. Время остаётся местным, без преобразования часовых поясов.

Заголовок дня показывает число и сумму **видимых событий** по `Calculation.items[].normalized_amount`; многодневный пункт может показываться в нескольких днях, поэтому эти суммы нельзя складывать как себестоимость поездки. Итог поездки и дневная смета остаются данными `Calculation`.

`requireAdmin()` проверяет приватные страницы через `/api/auth/me`; каждый admin API route отдельно требует сессию. Cookie `travel_session` — HttpOnly, SameSite=Lax, Secure в production; БД хранит digest токена, пароль — Argon2id hash. Изменяющие запросы требуют `X-Requested-With: TravelClub` и допустимый Origin; вход ограничен по логину и IP.

### Окружение и подводные камни

Имена из `.env.example`: `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_HOST`, `APP_ENV`, `ALLOWED_ORIGIN`, `COOKIE_SECURE`; код дополнительно читает `POSTGRES_PORT`, Next — `BACKEND_URL`, Playwright — `PLAYWRIGHT_BASE_URL`. Значения и локальный `.env` не сохранять в документации. На Windows запускать npm как `npm.cmd`; для локального старта нужны Python и Docker Desktop/Compose. Compose публикует 3000/8000/5432 только на loopback; PostgreSQL живёт в named volume, `docker compose down -v` удалит данные. Изменение пароля в `.env` не меняет пароль уже созданной БД. Backend должен дождаться healthy PostgreSQL. При изменении `shared/pricing-vectors.json` пересобрать backend-образ.
После изменения `frontend/public/images/` пересобрать frontend-образ: standalone runner получает `public/` отдельным `COPY` из builder.
<!-- autopilot:end -->
