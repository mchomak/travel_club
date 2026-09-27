# Общий контракт Travel Club

## Правила
- Прочитать до первого изменения. Пользовательский AGENTS.md обязателен, внешние части не редактировать.
- Стек и поведение заданы spec; ниже границы скопированы дословно.
- Таск 01 владеет установкой зависимостей и всей shared схемой; после него missing dependency возвращать BLOCKED с именем, не устанавливать молча.
- Все пути относительны C:/Users/McHomak/Projects/travel_club. PowerShell. UTF8 использовать явно; для Python скриптов с русским текстом предпочтительно файлы, не pipe с системной кодировкой.
- Только orchestrator меняет этот файл и state/manifest. Исполнители не коммитят и не создают ветки/worktrees: disjoint zones в общей рабочей копии, commits после независимого review.
- Тестовые команды уточняет T01; план: docker compose exec backend pytest; frontend npm.cmd test / run lint / run typecheck / run build. Один backend файл: pytest tests/<file>.py.
- Не трогать чужие контейнеры. Docker project travel_club, порты 3000/8000/5432 свободны при подготовке. Dashboard 8765 зарезервирован.
- Секреты не запрашивать/печатать/коммитить. Действительный user admin отсутствует; bootstrap локальной командой с getpass. Test credentials явно фиктивные либо генерируются в памяти.
- Нормативные исправления G2: распределение по mode=hotel, preview client_note trip/day/item, end_time раньше start означает следующий день. Отдельные restore и client_price_per_person не обязательны.

## Границы, решённые в спецификации

Все пути `/api`, Next same-origin proxy в backend. `GET /health` без секрета; `POST /auth/login {login,password}`, `POST /auth/logout`, `GET /auth/me -> {id,login}`. `GET /trips -> TripSummary[]`; `POST /trips` начальные trip fields → TripDocument; `GET /trips/{id}` → TripDocument; `PUT /trips/{id}?confirm_date_removal=false` полная editable TripInput + version → TripDocument; `DELETE /trips/{id}` →204; `POST /trips/{id}/duplicate` → TripDocument; status через PUT; `POST /trips/calculate` валидируемый TripInput → Calculation; `GET /trips/{id}/preview` → ClientPreview. Дни/элементы/порядок/перенос/курсы CRUD атомарно внутри PUT без формального размножения endpoint. Отсутствующий trip 404, validation 422 с человеческим message, date loss и version conflict 409 с кодом и данными для UI. Никаких traceback клиенту.

| Модуль | Владеет | Выставляет | Прячет |
|---|---|---|---|
| Pricing | семью формулами, FX, округлением, распределением, сводкой | calculate_trip(TripInput) -> Calculation | Decimal арифметику и порядок округления |
| Trip service | агрегатом PostgreSQL и инвариантами дат/версий/копирования | перечисленные REST CRUD endpoints | ORM, транзакции, snapshots |
| Auth | пользователями и сессиями | login/logout/me, require_admin | Argon2id, токены, throttling |
| Frontend API | сетевым обменом и сериализацией | типизированный client для REST, TripDocument | transport, CSRF header, ошибки |
| Editor | локальным черновиком и autosave | экраны editor/list/preview | формы, dirty/version handling |
| Preview calculator | мгновенным предварительным выводом | calculateTrip(TripInput) -> Calculation | decimal.js, те же правила; контрольные векторы обязательны |

Швы тестов: чистый calculate_trip и тот же контракт через calculateTrip; HTTP API с реальной PostgreSQL; браузерные пользовательские сценарии.

## Из таска 01 — проверенные интерфейсы

- `backend/app/schemas.py`: TripCreate, TripInput(days,items,rates), TripUpdate(+version), TripDocument(+id,version,created_by,created_at,updated_at,items:ItemDocument[],calculation), Calculation, ClientPreview.
- `frontend/src/lib/contracts.ts`: те же transport types; деньги/количество/курсы/проценты — JSON строки.
- `Calculation`: items[{id,original_amount,rate_used,normalized_amount}], days[{day_id,date,groups,total}], by_type, general_total, cost_total, cost_per_person, client_price, profit, actual_margin_percent.
- `app.db`: get_db()->Generator[Session], SessionLocal; `app.auth`: require_admin(request,db)->User и Admin annotated dependency.
- `/api/auth/login` POST {login,password}->UserInfo{id,login}; `/api/auth/logout` POST->204; `/api/auth/me` GET->UserInfo.
- Cookie `travel_session`; unsafe header `X-Requested-With: TravelClub`.
- `frontend/src/lib/api.ts`: apiRequest<T>(path,options?:RequestInit):Promise<T>; authApi.login/logout/me; ApiError(status,code,message,details).
- `frontend/src/lib/server-auth.ts`: requireAdmin():Promise<UserInfo>.
- Env names: POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, APP_ENV, ALLOWED_ORIGIN, COOKIE_SECURE; frontend BACKEND_URL. Root .env ignored; `scripts/init_env.py` создаёт локальную конфигурацию без вывода секрета и не должен перезаписывать существующую.
- Pricing functions и trip routes создаёт T02, frontend calculateTrip/editor — T03; отсутствующие пока endpoints не являются mock.
- Проверки из новых процессов: `docker compose exec -T backend pytest -q` (7 passed), `.venv/Scripts/ruff.exe check .` из backend; `npm.cmd test` из frontend (1 passed), lint/typecheck/build PASS. `npm.cmd run test:e2e` (2 passed) проверил запущенный Docker сайт. Alembic revision `512ed4d25bb7` head, schema check clean; все три Compose сервиса запущены.
- Docker proxy использует build-time `BACKEND_URL=http://backend:8000`. npm lockfile проверен через Linux npm ci, используется BuildKit cache/prefer-offline/maxsockets5 из-за нестабильной сети.
- При reverse proxy лимит по IP общий для кабинета; отдельный лимит по login продолжает действовать. Не доверять произвольному X-Forwarded-For.

