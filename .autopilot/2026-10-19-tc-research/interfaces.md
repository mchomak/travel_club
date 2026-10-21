# Границы, зафиксированные спецификацией

## Приложение и данные

- Отдельные страницы `/research`, `/research/new`, `/research/{id}` внутри существующего Next.js. Общая навигация публичного сайта не меняется.
- API только под `/api/research`; FastAPI, SQLAlchemy 2, Pydantic, Alembic, PostgreSQL. Таблицы `research_respondents`, `research_interviews`, `research_answers`.
- Банк, сценарии, screening и правила классификации — JSON под `backend/app/research_data/`. Банк хранит 82 вопроса и 17 гипотез из `Travel_Club_CustDev.docx`. Сценарий сохраняет массив кодов, а интервью — неизменяемые snapshot-вопросы.
- Backend — источник истины для записи и классификации. Финальные категории: `trips_experienced`, `trips_beginner`, `travel_design`, `travel_ready`. X отключён конфигурацией до появления настоящих условий.
- Статусы `draft`, `in_progress`, `completed`; на каждой паре `interview_id + question_code` один ответ с целым revision/CAS. Изменение screening не переписывает начатый сценарий или ответы.

## Граница защиты

- Страница вызывает текущий `requireAdmin()`; каждый API-маршрут использует существующий `Admin` session dependency. Никаких новых учётных записей.
- Проверка Origin принимает `ALLOWED_ORIGIN` и опциональный `RESEARCH_ORIGIN`; пустое значение ничего не меняет. HTTPS завершает Nginx. Renderer сохраняет прежний runtime IP как default и дополнительно принимает безопасно проверенный доменный `--server-name`.
- Экспорт доступен только авторизованному администратору и формирует полный снимок, независимо от списка/фильтров.

## Предполагаемая структура модулей

- `backend/app/research_data/`: вопросы/гипотезы, сценарии, анкета, правила.
- `backend/app/research_bank.py` и `research_domain.py`: загрузка/валидация JSON и чистая рекомендация.
- `backend/app/research.py`, `research_export.py`, новые модели/DTO и Alembic revision: API, транзакции и экспорт.
- `frontend/src/app/research/`, `frontend/src/components/research/`, `frontend/src/lib/research.ts`: закрытый исследовательский workflow, без импорта из публичных страниц.
- `docs/tc-research/`: запуск, JSON, VPS/HTTPS, `pg_dump`/`pg_restore`; existing `docs/research/` is user-owned map research and stays untouched.

## Рабочая среда и проверки

- Код: изолированная git-worktree `C:\Users\McHomak\Projects\travel_club\.worktrees\tc-research`, ветка `codex/tc-research`. Не изменять существующие незакоммиченные файлы и не затрагивать страницы `/test_*`.
- Установки backend: `cd backend; python -m pytest tests/test_research_bank.py -q` (для полного набора `python -m pytest -q`); lint `ruff check .`.
- Frontend: из `frontend/` — `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test -- --run --testTimeout=15000`; e2e через `npm.cmd exec playwright test e2e/research.spec.ts -- --workers=1` на работающем приложении.
- Полный стек: `docker compose up -d --build --wait`, затем `docker compose exec -T backend pytest -q`, `docker compose exec -T backend ruff check .`; локальную проверку вести на отдельном Compose project/БД, не очищать пользовательскую БД.
- Renderer: `python -m pytest deploy/tests/test_nginx_render.py -q` из корня репозитория; прежний IP путь должен остаться обратносуместимым.
- Добавить только необходимую зависимость `openpyxl==3.1.5`; версия проверена по PyPI и уже присутствует в рабочем Python. Если установленный в целевом окружении инструмент или браузер отсутствует — вернуть `BLOCKED` с причиной, не подменять зависимости.

## Тестовая дисциплина и ограничения

- Каждый ticket сначала добавляет тесты, запускает их с ожидаемым падением, затем пишет реализацию и повторяет покрывающий набор.
- Не устанавливать новые frontend-пакеты без необходимости. Не менять публичный сайт, финансовый код, auth flow или пользовательские правки. Не сохранять ответы без подтверждения PostgreSQL и не терять локальный текст при 409/сетевой ошибке.
- Не запускать live deploy, менять DNS или выдавать несуществующий домен за настроенный.

## Tickets 08–10 (2026-10-20)

- `ScreeningField.control` также поддерживает `textarea`; screening UI рендерит JSON-поле через общий контрол и сохраняет его в том же объекте `screening_answers`.
- Карточка респондента строит историю только из API detail и сохранённого `question_snapshot`. Недоступный или структурно неполный текущий config не скрывает snapshot, текст вопроса, подсказки, пустые и заполненные ответы. Только config-зависимые действия получают недоступное состояние и объяснение.
- Проверки ticket 10 добавили явные ветки для пустых `scenarios`/`screening.fields` и для неполного config с selectable bank question; incomplete config не добавляет новый вопрос в snapshot.
- Ограничение, найденное craft review: кнопка запуска draft-интервью должна быть отключена, если сценарии отсутствуют. Это follow-up Ticket 11.

## Ticket 11 ? safe interview start

- A draft interview may start only when the current API configuration has `validation_issues: []` and the selected category has a usable scenario entry: supported category code, non-empty label, `question_codes` array, and every listed code exists in the current bank. An empty `question_codes` array is allowed; interviewers can append questions after starting.
- Missing/failed config loading, an empty scenario list, an invalid config, or no matching selected category leaves Start disabled with a short explanation. The start handler repeats the guard; historical snapshots and answers remain readable independently of current config.
