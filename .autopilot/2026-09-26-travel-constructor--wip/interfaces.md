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

## Уточнение D01 для обоих калькуляторов

Для hotel allocation применяется HALF_UP equalShare с ограничением min(equalShare, floor_to_cent(total/(n−1))) при n > 1; остаток последней ночи total−equalShare×(n−1). Это предотвращает отрицательные дневные суммы при .02/4 и сохраняет точную сумму распределения. `actual_margin_percent` округляется HALF_UP до 4 знаков, денежные значения до 2. Нормативное уточнение и решение D01 записаны в spec/manifest.

## Из таска 01 — проверенные интерфейсы

Семантика rates при смене base: каждый PUT явно задаёт новые стоимости единицы foreign в текущей base. Backend требует полный набор необходимых положительных курсов и base=1, атомарно пересчитывает snapshots; он не пытается распознать намерение по совпадению чисел. UI при смене base сбрасывает прежние foreign rates и требует ввести их заново, в том числе для прежней base, если в ней остались статьи. Отдельного флага подтверждения курса нет.

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

## Таск 02 — промежуточная граница handoff-02-1 (ещё не принят)

`backend/app/pricing.py` выставляет `calculate_trip(TripInput) -> Calculation`. `backend/app/trips.py` реализует согласованные `/api/trips` CRUD/calculate/duplicate/preview. Frozen transport схемы сохранены. `VERSION_CONFLICT` и `DATE_REMOVAL_REQUIRED` возвращают 409. На этой границе root независимо выполнил `.venv/Scripts/pytest.exe -q` из backend: 12 passed (было 7), `npm.cmd test` из frontend: 5 passed (было 1). Остаток работ и принятые решения перечислены в `handoff-02-1.md`; review/commit T02 ещё впереди.

T02 зона расширена на `compose.yaml` только backend.build: `context: ./backend`, `additional_contexts: {shared: ./shared}`. Это позволяет Dockerfile скопировать общие financial fixtures в `/shared` для запуска pytest внутри образа, без расширения build context на локальные секреты.

## Из завершённой реализации таска 02 — передано на review

`calculate_trip(TripInput) -> Calculation` и все согласованные `/api/trips` CRUD/calculate/duplicate/preview действуют; wire-схемы сохранены. Validation details сохраняют `{field,message}`, сообщения русские. Итоговый набор: 19 shared financial vectors с HTTP/PostgreSQL и reopening, 35 backend tests (7 до таска, 12 на handoff), включая три независимых конкурентных пары PUT с единственным победителем. Host и Docker pytest35 PASS, Ruff/Compose config/diff-check PASS, Alembic check clean и revision `512ed4d25bb7` head. Backend пересобран и healthy на8000. T02 добавляет `app/validation.py`, `tests/test_trip_concurrency.py`; shared fixtures включены в Docker образом named build context. Новых схем/миграций не потребовалось.

## Таск 03 — промежуточная граница handoff-03-1 (ещё не принят)

`calculateTrip(TripInput): Calculation`; `DraftSession(document, SaveTrip)` сериализует сохранение; `tripApi` реализует REST, `tripInput(TripDocument): TripInput` ограничивает PUT редактируемыми полями. list/new/editor/preview уже работают с настоящим API. Root независимо повторил frontend unit: 5 passed и Playwright: 3 passed, включая составной финансовый сценарий/повторное открытие/preview/mobile. Остаток перечислен в `handoff-03-1.md`: приоритет серверной сводки после сохранения и уточнение ошибок дат/конфликта.

## T02 repair 1: согласованное чтение агрегата

Без изменений REST/DTO. Shared parent row locks защищают document/preview/list от смешения версий при concurrent PUT; writers не изменились. Три HTTP регрессии с независимыми PostgreSQL sessions сначала failed, затем passed. Root host full pytest38 PASS (было35); автор Docker38/Ruff/diff-check PASS, backend rebuilt healthy. Изменены только `app/trips.py` и `tests/test_trip_concurrency.py`; отдельный diff для независимого rereview в `repair-02-1/repair.diff`.

## Из завершённой реализации таска 03 — передано на review

Transport/REST/calculateTrip/DraftSession интерфейсы сохранены. Saved summary всегда использует server Calculation. Сокращение дат перечисляет затронутые дни, отмена сохраняет данные; hotel-range error предлагает восстановить прежние даты без потери других правок. После подтверждения conflict reload нет второго beforeunload. Финальные проверки автора: unit5, Playwright7 (2 до таска, 3 на handoff), lint/typecheck/production build и Docker build/restart PASS. Четыре дополнительные browser регрессии выполнены red→green. Изменения finishing: `components/trips/trip-editor.tsx`, `e2e/constructor.spec.ts`.

## T03 repair 1 — защита локальных форм

`TripForm`, `DayForm`, `RatesForm` принимают опциональный `onDirtyChange(dirty: boolean)`; editor учитывает их флаги наряду с DraftSession и ItemForm при beforeunload. New-trip имеет собственную защиту. Save/Cancel/Revert сбрасывают предупреждение. Из RatesForm можно удалить курс, не используемый статьями; для валют сохранённых статей курс остаётся обязательным. Browser fixture использует одну временную session cookie на worker, чтобы регрессии проверяли UI, не срабатывая на штатный login throttle. Автор: unit5, Playwright12 (было7), lint/typecheck/build и Docker frontend rebuild/restart PASS. Wire/REST/financial formulas не менялись.

## T03 repair 2 — выход и фактическая dirty-форма пункта

New-trip logout action проверяет несохранённый ввод до прекращения session; cancel оставляет данные и `/auth/me` доступным. `ItemForm` принимает опциональный `onDirtyChange(dirty: boolean)`; открытие без изменения или полный revert не вызывает предупреждения, реальный edit вызывает, Save/Cancel сбрасывают. API/financial rules прежние. Автор подтвердил red→green browser regressions, frontend unit5, Playwright14 (было12), lint/typecheck/build и Docker rebuild/restart PASS; changed frontend/e2e/constructor.spec.ts и components/trips/{item-form,new-trip,trip-editor}.

## Таск 04 — промежуточная граница handoff-04-1 (ещё не принят)

После NFKC/strip/casefold login проверяется по длине до SQL/`login_attempts`; слишком длинный нормализованный логин возвращает 422. `Calculation` DTO теперь требует все четыре `groups` и девять `by_type`, как TypeScript `Record`; wire shape не менялся. Backend тест списка поездок выбирает созданный им trip по id, не по первой позиции, поскольку все администраторы видят общий список. Дополнительные browser сценарии: ошибка сети/повтор, независимая копия/архив/удаление/logout; основной сценарий две страны/города, семь формул и 5→9 участников. `docs/acceptance.md` сопоставляет 27 критериев с тестами, README обновлён. Отдельная временная БД мигрирована до `512ed4d25bb7` head и удалена. Root независимо повторил backend40, frontend unit5 и Playwright16 — PASS, `git diff --check`/Compose config PASS. Backend Docker rebuilt healthy, frontend production-сервис работал при browser tests. Полная Compose сборка пока не подтверждена из-за TLS handshake timeout Docker Hub на metadata базового Python image; остаток в `handoff-04-1.md`.

## Из завершённой реализации таска 04 — передано на review

Полный `docker compose build` и `docker compose up -d --wait` прошли без override; backend/postgres healthy, frontend running. Браузерная проверка повторного открытия теперь явно сверяет оба города и сохранённый FX snapshot. `README.md` содержит текущие Windows/Docker/admin/bootstrap/test/backup команды; `docs/acceptance.md` связывает все 27 критериев с фактическими browser/API проверками, сетевой caveat от временной ошибки реестра удалён. Автор после финальной правки подтвердил backend pytest40, frontend unit5, Playwright16, Ruff/ESLint/typecheck/production build, Alembic current/check и clean disposable migration, Compose config/diff-check, HTTP health/login — PASS. Root выполнит независимый прогон и reviewer проверит содержание перед коммитом.

## T04 repair 1 — доказательство нескольких трансферов

`frontend/e2e/constructor.spec.ts` теперь сохраняет два разных transfer, после reopen браузер показывает две карточки, API подтверждает разные UUID/позиции 0/1/суммы 8 000+12 000=20 000 и равенство day/trip totals 20 000 без double count. `docs/acceptance.md` criterion 9 привязан к этому тесту. Product REST/DTO/pricing код не менялся. При полном повторном прогоне обнаружился revoked shared auth cookie после logout; тестовый сценарий получает отдельную session, без ослабления auth. Автор: Playwright17, backend40, unit5, ESLint/typecheck/diff-check PASS; production/Compose build прошли перед test-only repair.

