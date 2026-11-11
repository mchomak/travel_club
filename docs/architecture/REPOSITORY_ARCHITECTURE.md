# Архитектура репозитория Travel Club

Документ описывает текущую архитектуру: три независимых Next.js-приложения, общий внутренний backend, отдельный Website leads API, shared-origin gateway и два изолированных PostgreSQL-контура. Constructor и Interviews продолжают использовать общий backend и базу. Исходники старого `frontend/` и два скрипта `test9` удалены из активной структуры.

## Приложения и владельцы маршрутов

| Приложение | Локальный dev-порт | Собственные маршруты | Дизайн-система и стили |
|---|---:|---|---|
| Website | 3100 | `/`, `/formats`, `/services/route`, `/services/turnkey`, `/tours`, `/payment`, `/archive`, `/start`, `/thanks`, `/legal`, `/privacy`, `/personal-data` | `apps/website/src/styles/travel-club-design-system.css`, `src/app/globals.css`, локальные компоненты и CSS modules. Основной шрифт системы — Lato. |
| Trip Constructor | 3101 | `/home`, `/admin/login`, `/admin/trips`, `/admin/trips/new`, `/admin/trips/[id]`, `/admin/trips/[id]/builder`, `/admin/trips/[id]/preview`, `/admin/account` | `apps/trip-constructor/src/design-system/tokens.css`, `src/app/globals.css`, собственные компоненты и CSS modules. |
| Interviews | 3102 | `/`, `/admin/login`, `/research`, `/research/new`, `/research/[id]` | `apps/interviews/src/styles/globals.css` и локальные компоненты/CSS. Отдельная централизованная таблица токенов пока не выделена. |

Порты 3100–3102 заданы приложениями для локального dev/standalone. В обычном Docker Compose приложения доступны внутри сети; на host публикуются gateway, backend и PostgreSQL. Веб-приложения не импортируют визуальные компоненты, шрифты или токены друг друга.

У Website общий CSS-файл дизайн-системы загружается корневым layout, однако две текущие группы маршрутов пока используют отдельные оболочки: `(publication)` подключает `SiteShell`, а `(public)` — свой layout и CSS. Это текущее состояние, не подтверждение полной стандартизации всех публичных страниц. Отдельная динамическая страница `/archive/[slug]` или `/tours/[slug]` в приложении Website сейчас не обнаружена.

## Shared-origin gateway

`gateway/server.mjs` — небольшой Node HTTP reverse proxy, без общей UI-логики. Он сохраняет пути и направляет запросы так:

| Путь | Upstream |
|---|---|
| `/_app/website/_next/**` | Website |
| `/_app/constructor/_next/**` | Trip Constructor |
| `/_app/interviews/_next/**` | Interviews |
| `/api/leads/**` | Website-only FastAPI `website-api` (Compose profile `website-leads`) |
| Остальные `/api/**` | внутренний FastAPI backend |
| `/research/**` | Interviews |
| `/admin/**`, `/home` | Trip Constructor |
| Остальные маршруты | Website |

Локальный процесс gateway по умолчанию слушает `3000`; `PORT` имеет приоритет над `GATEWAY_PORT`. В `compose.yaml` gateway слушает внутренний `3000`, а его loopback host-порт выбирается `GATEWAY_PORT` (по умолчанию `3000`). Встроенные standalone-порты приложений не меняются этим параметром.

Общий origin позволяет приложениям использовать серверную сессию FastAPI и одну host-only cookie `travel_session`. Gateway не заменяет авторизацию: Backend и Next серверы выполняют собственные проверки доступа.

## Общий backend, API и данные

Backend — единый FastAPI-модуль в `backend/app/`. API namespaces:

- `/api/auth` — вход, текущая сессия, смена пароля и выход;
- `/api/trips` — поездки, расчёт, сохранение, редактирование и клиентский preview;
- `/api/maps` — конфигурация карты, поиск мест и маршруты;
- `/api/research` — респонденты, интервью, ответы и результаты.

Constructor использует auth, trips и maps; Interviews использует auth и research. Website отправляет `/api/leads` на отдельный процесс FastAPI `app.leads.main`, собранный из той же backend кодовой базы. Этот процесс получает только Website DB URL и собственные receipt/rate secrets; у него нет credentials внутренней PostgreSQL. Внутренний backend очищает Website credentials и обрабатывает остальные API namespaces.

Constructor и Interviews используют существующий общий PostgreSQL и миграции `backend/migrations/`. Заявки Website хранятся в отдельном экземпляре PostgreSQL service `website-postgres`, в базе `travel_club_website` и независимом volume `website_postgres_data`. Сервис не публикует порт. Его bootstrap создаёт отдельные cluster-admin, migration и runtime роли; runtime получает минимальные grants на четыре рабочие таблицы и последовательность номера заявки. Для базы используется отдельная цепочка `backend/website_alembic.ini` и `backend/website_migrations/`. Эта изоляция — явное исключение для пользовательских заявок; она не разделяет базы поездок и исследований и не меняет их API. Финансовые расчёты поездок остаются в общем backend и используют `Decimal`.

Нейтральные общие части сейчас ограничены backend/API, `gateway/`, миграциями, `shared/pricing-vectors.json` (контрольные векторы расчётов) и `shared/website-products.json` (единый каталог Website для формы и API). Идентификаторы каталога нельзя удалять или переименовывать после сохранения заявок; товар снимается с публикации через `available: false` с сохранением ID и подписи. Общих пакетов `shared-ui`, `shared-design-system`, шрифтов или CSS-токенов нет.

## Структура и команды

```text
apps/
  website/             Next.js Website + собственные assets и дизайн-система
  trip-constructor/    Next.js Trip Constructor + собственные токены и стили
  interviews/          Next.js Interviews + собственные стили
backend/               FastAPI, SQLAlchemy, Alembic и API
shared/                Нейтральные контрольные векторы расчётов
gateway/               Локальный/preview reverse proxy
infra/local/           Docker build definitions для Next apps и gateway
compose.yaml           Локальный полный стек
compose.deploy.yaml    Preview-контур без опубликованных host-портов
docs/                  Архитектура, архив, инструкции и QA материалы
```

У каждого приложения собственные `package.json` и `package-lock.json`; общий root `package.json` предоставляет команды-обёртки. NPM workspaces не настроены. Независимые команды:

```powershell
npm.cmd run dev:website
npm.cmd run dev:constructor
npm.cmd run dev:interviews
npm.cmd run dev:gateway
npm.cmd run build:website
npm.cmd run build:constructor
npm.cmd run build:interviews
npm.cmd run build:all
npm.cmd run lint:all
npm.cmd run typecheck:all
npm.cmd run test:all
```

Команда отдельной сборки запускает только приложение-владельца. `build:all`, `lint:all`, `typecheck:all` и `test:all` последовательно запускают все app checks; `test:all` также включает тесты gateway. Скрипты конкретного приложения смотрите в его package-файле. Для backend доступны `pytest` и Ruff внутри Compose-контейнера.

## Переменные окружения

Не храните реальные значения в Git и не копируйте секреты между слоями без необходимости. `scripts/init_env.py` создаёт корневой `.env` и `.env.website`, сохраняя существующие значения. Только для изолированных PostgreSQL integration checks можно передать `--website-check`, чтобы создать дополнительный `.env.website.check`; обычный запуск не создаёт тестовые секреты. Lead-сервисы Compose активируются профилем `website-leads`; их env-файлы optional, поэтому прежний стек без профиля продолжает запускаться без `.env.website`. Gateway настроен на URL `website-api`; без профиля этот процесс выключен. Для реальной отправки заявок используйте `docker compose --profile website-leads up -d --build --wait`.

`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `APP_ENV`, `ALLOWED_ORIGIN`, `RESEARCH_ORIGIN`, `ADDITIONAL_ALLOWED_ORIGINS`, `GATEWAY_PORT`, `GATEWAY_TRUSTED_PROXY_CIDRS`, `COOKIE_SECURE`, `GEOAPIFY_API_KEY`, `GEOAPIFY_MAPS_API_KEY`. Website leads используют `WEBSITE_DATABASE_URL`, `WEBSITE_MIGRATION_DATABASE_URL`, `WEBSITE_RECEIPT_SECRET`, `WEBSITE_RATE_LIMIT_SECRET`, `WEBSITE_ALLOWED_ORIGINS`, `WEBSITE_TRUSTED_PROXY_CIDRS`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_LEADS_CHAT_ID` и отдельные bootstrap passwords в `.env.website`.

`apps/website/.env.example` documents optional `BACKEND_URL`; `apps/trip-constructor/.env.example` lists `BACKEND_URL` and `NEXT_PUBLIC_INTERVIEWS_URL`; `apps/interviews/.env.example` lists `BACKEND_URL`, `NEXT_ASSET_PREFIX`, and `NEXT_PUBLIC_CONSTRUCTOR_URL`. DB credentials for leads belong only to their isolated API, migration, worker, and PostgreSQL processes. Gateway accepts `HOSTNAME`, `PORT`/`GATEWAY_PORT`, upstream variables `WEBSITE_UPSTREAM`, `CONSTRUCTOR_UPSTREAM`, `INTERVIEWS_UPSTREAM`, `BACKEND_UPSTREAM`, `WEBSITE_LEADS_UPSTREAM`, and `GATEWAY_TRUSTED_PROXY_CIDRS`. For leads only, the gateway replaces client forwarding headers with the socket peer address unless that immediate peer belongs to the configured trusted-proxy CIDRs; it then selects the first untrusted address from the right side of the forwarded chain. E2E uses `PLAYWRIGHT_BASE_URL`, `PLAYWRIGHT_BACKEND_CONTAINER`, and `PLAYWRIGHT_TEST_BACKEND_CONTAINER`.

Не открывайте и не публикуйте локальный `.env`; файлы `.env.example` перечисляют только имена и безопасные шаблонные значения. Политика игнорирования задаётся корневым `.gitignore` и локальными ignore-правилами.

## E2E и изоляция базы

Browser E2E может создавать администраторов, поездки, респондентов и ответы. Запускайте его только на выделенной тестовой базе и gateway отдельного Compose-проекта. Пример root origin для обоих приложений — `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3300`; guard строго требует IPv4 loopback `127.0.0.1`, корневой origin без path/query/hash/credentials и порт, совпадающий с loopback host binding выбранного gateway.

Interviews требует `PLAYWRIGHT_BASE_URL` и явное имя тестового backend-контейнера в `PLAYWRIGHT_TEST_BACKEND_CONTAINER`. Global setup проверяет Compose service `backend`, project marker `test`/`e2e`/`check` (без `prod`/`production`/`live`), ровно один работающий gateway в том же проекте и точное совпадение `PLAYWRIGHT_BASE_URL` с его IPv4 loopback port binding.

Constructor требует `PLAYWRIGHT_BASE_URL` и явное имя тестового backend-контейнера в `PLAYWRIGHT_BACKEND_CONTAINER`. Global setup применяет те же проверки проекта, сервисов backend/gateway/PostgreSQL, same-project принадлежности и строгого IPv4 loopback port match. До запуска сценариев guard выполняет безопасный запрос к фактическому backend-соединению и требует, чтобы `inet_server_addr()` совпадал с адресом PostgreSQL выбранного Compose-проекта в общей сети. Затем он проверяет единственный Docker volume каталога PostgreSQL: volume должен называться `${project}_postgres_data`, иметь Compose labels выбранного проекта и не быть подключённым к другим контейнерам. Отсутствующие или несовпадающие метаданные приводят к отказу.

Website E2E проверяет публичный сайт и может запускаться отдельно. Для Constructor и Interviews `test:e2e` требует поднятый app/gateway/backend/PostgreSQL-контур и Chromium. В репозитории нет отдельного Compose manifest, автоматически поднимающего такой E2E-контур, поэтому оператор предварительно создаёт отдельный disposable Compose project с gateway, backend и PostgreSQL. Имя проекта должно содержать маркер `test`, `e2e` или `check`, а каталог PostgreSQL — использовать именно принадлежащий этому проекту named volume `postgres_data`. Guard подтверждает границы тестового контура до выполнения сценариев, но не заменяет отдельную тестовую инфраструктуру: никогда не запускайте browser E2E против обычной developer или preview базы.

## Preview и развертывание

`compose.deploy.yaml` использует заранее собранные Linux/amd64 образы Website, Constructor, Interviews, gateway и backend. Preview gateway не публикует host-порты; он подключён к приватной Docker-сети с адресом `172.19.0.4`, куда host Nginx направляет трафик. Внешняя схема использует единый HTTPS origin и тот же path router. Runbook: [docs/deployment-preview.md](../deployment-preview.md). Этот файл описывает подготовку и проверки; он не подтверждает состоявшийся deployment.

## Архив и состояние cleanup

`docs/architecture/REPOSITORY_INVENTORY.md` сохраняется как историческая инвентаризация исходного репозитория, а не как текущая карта файлов. Старые маршруты `test_1`–`test_20`, бывшие пути приложения и зависимости остаются описаны в архивных документах для восстановления из Git tag; активными маршрутами трёх приложений они не являются.

Проверенный cleanup удалил из активной архитектуры 620 tracked файлов старого `frontend/` и два `test9`-скрипта. Ignored/untracked локальные данные оставлены нетронутыми; они не представляют собой приложение и не входят в исходную структуру.

Отдельного E2E Compose manifest нет: для browser E2E оператор поднимает отдельный Compose-проект с тестовой БД, работающим gateway и указанным loopback host-port. Это текущее требование к E2E-контуру; unit/build checks приложений запускаются отдельно.

Website текущие `(publication)` и `(public)` route groups используют разные layout components; фактическое состояние зафиксировано в `docs/design-system.md` и `apps/website/README.md`.
