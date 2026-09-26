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

