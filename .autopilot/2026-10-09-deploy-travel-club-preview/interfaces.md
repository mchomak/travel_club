# Контракты запуска и правила исполнителей

## Границы, решённые в спецификации

| Модуль | Владеет | Выставляет | Прячет |
|---|---|---|---|
| `backend/app/auth.py` | проверка текущего пароля, обновление Argon2-хэша, завершение остальных сессий | `POST /api/auth/password` принимает текущий и новый пароль; `204` при успехе | структуру Argon2, запросы и транзакцию SQLAlchemy |
| `frontend/src/app/admin/(private)/account` | форма смены пароля и её состояния | страницу `/admin/account` | детали запроса, CSRF и cookie |
| `frontend/src/lib/api.ts` | типизированный клиентский вызов | `authApi.changePassword(currentPassword, newPassword)` | базовый URL и заголовки запросов |
| Docker Compose проект `travel_club` | отдельные frontend/backend images, база и её volume, внутренние сети и loopback ingress | frontend на host loopback, backend/postgres внутри Compose | чужие Docker-проекты и volumes |
| Host Nginx + Certbot | public TCP/80 для challenge и выбранный проверенный HTTPS-порт, TLS, проксирование | HTTPS reverse proxy на frontend | секретный ключ сертификата, каталог challenge и пути к upstream |

## Контекст репозитория

- Проектный контракт находится в `AGENTS.md`: Python + FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL; Next.js 16 + React 19 + TypeScript + Tailwind; Docker Compose. Не обновлять зависимости без запроса.
- Не менять существующие формулы, миграции данных поездок, публичные экспериментальные страницы, compose-проект локальной разработки, чужие Docker-контейнеры/volumes или файлы `.env`.
- Финансовая логика и публичные формы не входят в этот запуск. Текущая cookie session auth и глобальная CSRF-проверка authoritative.
- Секретов сервера или администратора исполнителям не требуется. Не открывать `.env`, не записывать SSH/DB/admin credentials в файлы, args, fixtures или логи.
- Все кодовые изменения оставлять незакоммиченными: пользователь требует один общий commit всего рабочего дерева. Не создавать ticket-specific commits и не переписывать историю.
- Не добавлять пакеты. Если требуемый инструмент/зависимость отсутствует, вернуть `BLOCKED` и назвать, чего нет.

## Проверки проекта

- Backend из корня: `docker compose exec -T backend pytest -q` и `docker compose exec -T backend ruff check .`.
- Frontend из `frontend/`: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test -- --run --testTimeout=15000`, `npm.cmd run build`.
- Deployment configs: `docker compose -f compose.deploy.yaml config` (без вывода `.env`), проверить binding/ports и отсутствие `build` в source-free файле; Nginx конфигурацию проверять через `nginx -t` до reload.
- Исполнитель запускает только проверки, относящиеся к его таску, и возвращает сводку команд/результат без сырых длинных логов.

## Работа между тасками

Таски 01–03 имеют непересекающиеся зоны и идут волной 1 параллельно. API смены пароля — JSON, текущая cookie-сессия остаётся валидной, остальные сессии этого пользователя инвалидируются после commit. Compose deployment должен быть source-free и запускаться с заранее загруженными images. Host ingress обслуживает только публичный frontend; порт 443 и чужие контейнеры не менять. HTTPS-порт и origin задаются по проверенным фактическим данным сервера, а не вшиваются в приложение.

## Результат повторной проверки таска 02 — 2026-10-09

- `backend/requirements.txt` напрямую фиксирует зависимости; отдельного lock-файла нет. Чистая сборка `docker buildx build --no-cache --platform linux/amd64 ... ./backend` прошла на Python 3.14 и установила Mako 1.4.3. Ошибка с Mako 0.7.3 / `use_2to3` не воспроизвелась, поэтому dependency set не менялся.
- `travel-club-backend:preview` собран и доступен локально как `linux/amd64`; `docker image save` успешно создал проверочный tar во временной папке. Deployment Compose перечисляет команды сохранения обоих image tags.
- `docker compose -f compose.deploy.yaml --env-file <test-env> config --format json` прошёл: исходников/build contexts нет, опубликован только `127.0.0.1:3000`, API и PostgreSQL без host ports, сеть внутренняя, volume именованный `travel_club_deploy_postgres_data`.
- Backend migrations и `pytest -q` на временном отдельном PostgreSQL прошли: 54 теста. Временный контейнер/сеть удалены; локальный application Compose и его volumes не запускались и не менялись.
- `.env.example` содержит `replace-locally`, совпадающий с маркером `scripts/init_env.py`; реальный `.env` не читался и не изменялся.

## Результат таска 01 — 2026-10-09

- Backend выставляет `POST /api/auth/password` с `current_password` и `new_password`; успех — `204`, неверный текущий пароль — `400`, без сессии — `401`, длина нового пароля вне 12–1024 — `422`. Успешная транзакция сохраняет Argon2-хэш, оставляет текущую сессию и удаляет остальные сессии пользователя; глобальная CSRF-проверка действует.
- Frontend выставляет `authApi.changePassword(currentPassword, newPassword)` и закрытую страницу `/admin/account` с формой смены пароля; приватная навигация показывает «Аккаунт».
- Проверки: `backend/tests/test_auth.py` — 10 passed; целевой Ruff — passed; account form Vitest — 3 passed; целевой ESLint и `npm.cmd run typecheck` — passed. Новых зависимостей нет.
