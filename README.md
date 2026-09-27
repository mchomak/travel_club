# Travel Club

Закрытый конструктор путешествий. Текущий фундамент: PostgreSQL, миграции всей модели,
серверная авторизация и отдельные публичная и административная оболочки.
Расчёты, CRUD поездок и редактор реализуются следующими этапами; сейчас `/admin/trips`
честно показывает подготовку конструктора.

## Локальный запуск

Нужны Docker с Compose и Python 3.11+ для однократной генерации локального `.env`.
Из корня проекта:

```powershell
python scripts/init_env.py
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

`init_env.py` создаёт случайный пароль только для локальной БД, не выводит его и
никогда не перезаписывает существующий `.env`. Файл игнорируется Git. Данные остаются
в named volume `travel_club_postgres_data`. Сохраняйте `.env` вместе с локальной базой:
изменение пароля в файле само по себе не меняет пароль уже инициализированной PostgreSQL.
Не запускайте `down -v`, если хотите сохранить данные.

Сайт: http://localhost:3000. Вход команды: http://localhost:3000/admin/login.
API health: http://localhost:8000/api/health. Все порты привязаны к loopback.
Миграции автоматически применяются перед стартом backend.

Создать своего администратора (пароль вводится скрыто, минимум 12 символов):

```powershell
docker compose exec backend python -m app.bootstrap
```

Администратора по умолчанию, публичной регистрации и реальных демонстрационных
пользователей нет. Пароли тестовых fixtures явно фиктивные, тесты откатывают изменения.

## Проверки

После запуска Compose эти команды работают в новом PowerShell без экспорта секретов:

```powershell
docker compose exec -T backend pytest -q
docker compose exec -T backend ruff check .
docker compose exec -T backend alembic current
docker compose exec -T backend alembic check
```

Тесты используют настоящую PostgreSQL и откатывают каждую тестовую транзакцию.
Frontend локально (Node.js 24 LTS):

```powershell
cd frontend
npm.cmd ci
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

Браузерные тесты ожидают работающий сайт на localhost:3000. `PLAYWRIGHT_BASE_URL`
позволяет задать другой адрес. Unit-тест проверяет сохранение введённых данных при
ошибке входа; браузерные тесты — серверный redirect, публичные страницы и мобильную ширину.

Для разработки backend: создайте `backend/.venv`, установите `backend/requirements.txt`,
запускайте из `backend` команды `python -m pytest`, `ruff check .`, `alembic upgrade head`,
`uvicorn app.main:app --reload --no-proxy-headers`. Настройки читают корневой `.env`.
Для frontend используйте `npm.cmd run dev`. Backend URL по умолчанию — `http://127.0.0.1:8000`.

## Структура и контракты

```text
backend/app/config.py       Настройки с проверкой production
backend/app/db.py           SQLAlchemy Session / get_db
backend/app/models.py       User, Session, LoginAttempt, Trip, TripDay, TripItem, TripCurrencyRate
backend/app/schemas.py      Строгие Pydantic DTO
backend/app/auth.py         login/logout/me, require_admin
backend/app/bootstrap.py    Локальный CLI создания администратора
backend/migrations/        Alembic initial schema
frontend/src/app/           Независимые public и admin layouts
frontend/src/lib/           API transport, server guard, TypeScript DTO
shared/pricing-vectors.json Общие контрольные входы/ожидаемые суммы для Python и TS
```

`TripInput` содержит `days`, `items`, `rates`; `TripUpdate` добавляет `version`.
`TripDocument` добавляет audit/UUID/version, snapshots каждой статьи и `calculation`.
`Calculation` содержит `items`, `days`, `by_type`, `general_total`, `cost_total`,
`cost_per_person`, `client_price`, `profit`, `actual_margin_percent`.
Все деньги, курсы, количества и проценты передаются JSON-строками.
`ClientPreview` — отдельный allowlist DTO без внутренних заметок и финансов;
`client_note` есть у поездки, дня и элемента. Время окончания раньше начала означает
следующий день. Дневное распределение будущего калькулятора зависит от
`calculation_mode=hotel`, а не от типа статьи.

Финансовые данные в SQL — `NUMERIC(20,2)`, курсы — `NUMERIC(20,8)`, количество —
`NUMERIC(14,4)`. День статьи связан составным FK с той же поездкой. Агрегаты не хранятся
JSON blob. Источник истины для финансов — backend; реализация формул будет в отдельном домене.

## Авторизация и эксплуатация

`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
Сессия действует 12 часов, в PostgreSQL хранится только SHA-256 digest случайного токена.
Пароли — Argon2id. Unsafe-запросы требуют `X-Requested-With: TravelClub` и допустимый
`Origin`, если он есть. Next proxy обеспечивает same-origin запросы; произвольному
`X-Forwarded-For` backend не доверяет. Лимит — 5 попыток на логин и 20 на адрес за 15 минут,
общий для всех workers; за Next proxy адрес общий, поэтому IP-лимит является дополнительным
общим ограничением кабинета, а не идентификацией отдельного браузера.

Для production нужны HTTPS reverse proxy, `APP_ENV=production`, `COOKIE_SECURE=true`,
точный HTTPS `ALLOWED_ORIGIN`, отдельный надёжный пароль БД и резервные копии.
Приложение отклоняет production-конфигурацию с insecure cookie или HTTP origin.
Cookie HttpOnly/SameSite=Lax; все приватные страницы проверяют сессию на сервере,
а каждый будущий private API обязан подключать `require_admin` независимо от frontend.
Compose — локальная среда, не готовый production deployment.

Зависимости сверены с PyPI/npm и зафиксированы в requirements и npm lock.
Публичные страницы пока обозначают будущие разделы; платёжных интеграций, внешних FX/booking
API, CRM и регистрации нет.
