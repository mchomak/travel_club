# Интерфейсы, определённые спецификацией

## Контракт backend → frontend

GET /api/research/config остаётся единственной точкой чтения конфигурации. В объекте scenarios поле expanded_modules имеет форму:

{ code: string, label: string, question_codes: string[], hypothesis_ids: string[], scenario_codes: ResearchCategory[] }[]

Доступные scenario_codes: trips_experienced, trips_beginner, travel_design, travel_ready. Каталог состоит из десяти модулей A, B, C, D, E, G, H, I, J, L. Его категории и question/hypothesis codes строго сверяются с .autopilot/2026-10-26-research-interview-questions--wip/spec.md. Банк содержит 140 вопросов, 28 гипотез. Любая ссылка должна валидироваться backend-ом. Базовые scenario question_codes, screening и classification/scoring не меняются.

## Границы модулей

| Модуль | Владеет | Выставляет | Скрывает |
|---|---|---|---|
| Backend Research data + validate_configuration() | Полный банк, версии, четыре сценария, expanded modules и ссылки | Существующий /api/research/config, валидатор | Чтение JSON и детали проверок |
| respondent-detail.tsx + Research API types | Выбор модуля для активного интервью и поиск вопросов | Native accessible module selector и существующий append API | Категорийную фильтрацию, состояние picker |

Снимки существующих интервью неизменны; добавленные вопросы сохраняются существующим endpoint-ом. Новых endpoint-ов и схемы БД нет. Исторические ответы не переписываются.

## Правила проекта и проверка

- Стек: FastAPI/Python, Next.js 16, React 19, TypeScript, Tailwind; зависимости не добавлять без необходимости.
- Источник текстов: TC — Research — Audience, JTBD & CustDev — v2.2 Expanded Interviews.docx; текущие 82 вопроса совпадают. Сверять каждый модуль и вопрос с источником, не сочинять ответы и тексты.
- Модульная crosswalk-матрица для N-вопросов выведена из назначения, гипотез и связанных кодов вопросов DOCX и явно является assumption; baseline route arrays сверяются по DOCX и не меняются, кроме правки реального расхождения.
- frontend/AGENTS.md требует до изменения UI читать guide установленной версии Next.js. Guide прочитан: frontend/node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md. Guide говорит добавлять state/event handlers в Client Components; respondent-detail.tsx уже Client Component, новый boundary не нужен.
- Backend: cd backend; python -m pytest -q tests/test_research_bank.py; валидация в Docker: docker compose run --rm --no-deps backend python -m app.research_bank validate.
- Frontend (PowerShell): cd frontend; npm.cmd run lint; npm.cmd run typecheck; npm.cmd test -- --run --testTimeout=15000; npm.cmd run build. Research browser check: npm.cmd exec playwright test e2e/research.spec.ts -- --workers=1 при работающем сайте и доступном Chromium.
- Финальный локальный запуск: из корня docker compose up -d --build --wait; проверить docker compose ps, страницу сайта и /api/research/config. Не запускать docker compose down -v и не терять PostgreSQL volume.
- Без новых/отсутствующих пакетов: не устанавливать зависимости; сообщить BLOCKED с причиной.

## Построено тикетом 01 — серверный банк и версии

- GET /api/research/config отдаёт вопросы и гипотезы из редакции 2.2, а также scenarios.expanded_modules: [{code,label,question_codes,hypothesis_ids,scenario_codes}].
- Расширенный вопрос содержит module_code; при append этот код входит в question_snapshot и остаётся доступным для группировки. У базовых вопросов поле необязательно.
- Четыре scenario_codes: trips_experienced, trips_beginner, travel_design, travel_ready. Валидатор проверяет ссылки, 140 вопросов, 28 гипотез и 10 модулей; базовые маршруты не изменены.
- Backend проверено: Research API + bank — 42 passed; config validator — valid. Полный backend suite: 176 passed, 1 existing-looking trip read/write synchronization test failed; требуется повторная проверка перед финальным выводом.

## Построено тикетом 02 — фильтр модулей в интервью

- ResearchConfig.scenarios.expanded_modules имеет общий тип ResearchExpandedModule с code, label, question_codes, hypothesis_ids и scenario_codes.
- Picker открывает тематические модули по interview.scenario_code; выбор модуля ограничивает вопросы его кодами и скрывает уже добавленные. Общий банк и поиск сохраняются. N-группа вопросов подписана «Расширенный банк CustDev».
- Четыре категории, отсутствие модулей и некорректная конфигурация покрыты компонентными тестами. Для null/старых fixtures допустим пустой expanded_modules как legacy fallback.
- Проверка UI: 244/244 Vitest, lint, typecheck и production build прошли. Compose пересобран; PostgreSQL/backend healthy, frontend на localhost:3000 отвечает 200. API config защищён auth (401 без сессии); authenticated API test tests/test_research_api.py::test_authenticated_configuration_endpoint_exposes_editable_questionnaire прошёл на backend image: 140 вопросов и 10 модулей. Container validator подтвердил 140 вопросов, 28 гипотез и 4 сценария.
