# Travel Club

Travel Club — monorepo из трёх Next.js-приложений и общего backend. Каждый продукт имеет собственные маршруты, исходники, сборку и визуальные стили. Constructor и Interviews используют общий внутренний backend и базу; публичные заявки Website получают отдельный API-процесс, PostgreSQL и миграции.

## Приложения

| Приложение | Назначение | Локальный dev-порт | Код |
|---|---|---:|---|
| Website | Публичные страницы Travel Club | 3100 | `apps/website/` |
| Trip Constructor | Закрытое планирование поездок и смет | 3101 | `apps/trip-constructor/` |
| Interviews | Внутренние интервью и исследования | 3102 | `apps/interviews/` |

Локальный gateway принимает общий origin на порту `3000` по умолчанию. В нём `/` и публичные страницы направляются в Website, `/admin/**` и `/home` — в Constructor, `/research/**` — в Interviews, `/api/leads/**` — в изолированный Website leads API, остальные `/api/**` — во внутренний backend. Порт gateway можно изменить через `PORT` при локальном запуске или `GATEWAY_PORT` для Compose.

## Быстрый запуск через Docker Compose

Нужны Docker Desktop с Compose и Python для начальной подготовки локального `.env`.

```powershell
python scripts/init_env.py
docker compose config --quiet
docker compose --profile website-leads up -d --build --wait
docker compose --profile website-leads exec backend python -m app.bootstrap
```

`scripts/init_env.py` создаёт `.env` при его отсутствии и отдельный игнорируемый `.env.website` для изолированной базы заявок, сохраняя уже существующие файлы и значения. Профиль `website-leads` включает Website PostgreSQL, миграцию, отдельный leads API и worker уведомлений. `app.bootstrap` запускайте один раз для создания первого администратора. Не передавайте пароль аргументом команды. После запуска откройте `http://localhost:3000`; проверка внутреннего API доступна по `http://localhost:8000/api/health`. Останавливайте полный стек той же командой профиля: `docker compose --profile website-leads down`. Команда `docker compose --profile website-leads down -v` удаляет оба локальных тома PostgreSQL, включая заявки Website.

## Независимый запуск приложений

В каждом приложении есть свой `package-lock.json`. Установите зависимости нужного приложения из корня, затем запустите его root-командой:

```powershell
npm.cmd ci --prefix apps/website
npm.cmd run dev:website
```

```powershell
npm.cmd ci --prefix apps/trip-constructor
npm.cmd run dev:constructor
```

```powershell
npm.cmd ci --prefix apps/interviews
npm.cmd run dev:interviews
```

Constructor и Interviews используют общий FastAPI backend для авторизации и рабочих данных. Если Website запущен через `npm run dev:website`, настройте `WEBSITE_LEADS_API_URL=http://127.0.0.1:8001` в локальном env-файле Website и поднимите API через профиль `website-leads`; его host port доступен только на loopback. Compose Website использует service URL `http://website-api:8001`. Gateway направляет `/api/leads/**` на отдельный Website API и остальные API — в общий backend. Gateway по умолчанию слушает `3000`; например, в PowerShell его порт можно задать перед запуском через `$env:PORT = "3300"`. Не запускайте gateway-процесс на порту, уже занятом gateway из Compose. Публичная форма и настройка её хранилища описаны в [руководстве по системе заявок](docs/website/LEADS_SYSTEM.md).

## Сборка и проверки

Root-команды вызывают скрипты соответствующего приложения:

```powershell
npm.cmd run build:website
npm.cmd run build:constructor
npm.cmd run build:interviews
npm.cmd run build:all
npm.cmd run lint:all
npm.cmd run typecheck:all
npm.cmd run test:all
```

Отдельные Vitest-команды: `npm.cmd run test:website`, `npm.cmd run test:constructor`, `npm.cmd run test:interviews`; тесты gateway — `npm.cmd run test:gateway`. Полный перечень скриптов приведён в корневом `package.json` и package-файлах приложений.

Browser E2E Constructor и Interviews запускайте только против отдельного disposable Compose-проекта с тестовой PostgreSQL и gateway. Укажите `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3300` (порт замените на опубликованный loopback-порт тестового gateway) и имя backend-контейнера: `PLAYWRIGHT_TEST_BACKEND_CONTAINER` для Interviews, `PLAYWRIGHT_BACKEND_CONTAINER` для Constructor. Guard проверяет IPv4 loopback origin, контейнеры и Compose labels, наличие ровно одного gateway и PostgreSQL, совпадение проекта, сети и порта, реальный адрес PostgreSQL из backend-запроса `inet_server_addr()`, а также отдельный Compose-managed volume `${project}_postgres_data`, который не должен быть подключён к другим контейнерам. Любая неполная или несогласованная проверка останавливает запуск до сценариев. Compose-проект должен иметь отдельное имя с компонентом `test`, `e2e` или `check`; избегайте `prod`, `production` и `live`. Автоматического E2E Compose manifest пока нет, поэтому disposable-контур подготавливается отдельно. Не запускайте эти тесты против рабочей или preview базы. Подробности — в [архитектурном документе](docs/architecture/REPOSITORY_ARCHITECTURE.md).

## Дизайн-системы

Визуальные стили не разделяются между приложениями:

- Website: `apps/website/src/styles/travel-club-design-system.css` (утверждённые токены и Lato).
- Constructor: `apps/trip-constructor/src/design-system/tokens.css` и локальные стили.
- Interviews: `apps/interviews/src/styles/globals.css` и локальные стили.

Не добавляйте общие UI-компоненты, шрифты, токены или CSS-переменные в общий пакет. Нейтральный shared-код ограничен технической логикой; текущий репозиторий включает `gateway/`, единый `backend/`, и `shared/pricing-vectors.json`. Подробнее: [docs/design-system.md](docs/design-system.md).

## Backend, данные и переменные окружения

Внутренний FastAPI backend находится в `backend/`, его PostgreSQL и миграции используются Constructor и Interviews. Website leads API собирается из той же кодовой базы, но запускается отдельно как `app.leads.main` без credentials внутренней базы. Его отдельная PostgreSQL и миграции доступны через профиль Compose `website-leads`; эта изоляция относится только к сохранённым заявкам. Основные пространства API: `/api/auth`, `/api/trips`, `/api/maps`, `/api/research`; `/api/leads` направляется в leads-only процесс. Серверная логика расчёта поездок использует Decimal.

Локальные `.env` и `.env.website` создаются `python scripts/init_env.py`, который не заменяет существующие значения. Root пример перечисляет `TELEGRAM_BOT_TOKEN`, `TELEGRAM_LEADS_CHAT_ID`, `WEBSITE_ALLOWED_ORIGINS`, `GATEWAY_TRUSTED_PROXY_CIDRS` и `WEBSITE_TRUSTED_PROXY_CIDRS`; `.env.website.example` задаёт шаблон независимых DB credentials и signing secrets. `apps/website/.env.example` документирует необязательный `BACKEND_URL`. В документации перечислены только имена переменных и безопасные шаблоны; не добавляйте реальные значения или секреты в Git. Для полного списка и команд настройки см. [docs/website/LEADS_SYSTEM.md](docs/website/LEADS_SYSTEM.md).

## Архив экспериментальных страниц

Аннотированный Git-тег `archive/legacy-test-pages-01-19` создан локально до удаления старых тестовых страниц. GitHub Release не публиковался: архивный коммит содержит внутренние материалы, которые нельзя раскрывать. Не отправляйте этот тег на GitHub и не создавайте Release с ним. Список версий и безопасный порядок восстановления описаны в [docs/archive/LEGACY_TEST_PAGES.md](docs/archive/LEGACY_TEST_PAGES.md); причина и статус публикации зафиксированы в [docs/archive/LEGACY_RELEASE.md](docs/archive/LEGACY_RELEASE.md).

Старый root `frontend/` больше не является активным приложением: его tracked исходники удалены из рабочей архитектуры, а локальные ignored/untracked артефакты оставлены нетронутыми вне Git. Исторические маршруты и пути сохранены в локальном archive tag и документах архива. [REPOSITORY_INVENTORY.md](docs/architecture/REPOSITORY_INVENTORY.md) остаётся историческим снимком; актуальные границы описаны в [REPOSITORY_ARCHITECTURE.md](docs/architecture/REPOSITORY_ARCHITECTURE.md).

## Preview

### Развёртывание всех сервисов на сервере

`compose.deploy.yaml` запускает Website, Trip Constructor, Interviews, общий FastAPI backend и PostgreSQL для Constructor/Interviews. С профилем `website-leads` добавляются отдельная PostgreSQL для публичных заявок Website, её миграция, leads-only API и worker уведомлений. Оба хранилища остаются независимыми.

Серверный Compose использует заранее собранные Linux/amd64 образы; `docker compose` сам их не собирает. Общий порядок релиза:

1. Собрать образы и передать их на сервер вместе с `compose.deploy.yaml` по процедуре из [полного runbook](docs/deployment-preview.md).
2. На сервере подготовить `.env` и `.env.website` с отдельными сильными секретами и паролями. Указать фактический публичный HTTPS origin, разрешённый Website origin и проверенные адреса reverse proxy. Не переносить секреты в Git или параметры команд.
3. Загрузить шесть переданных образов, проверить конфигурацию и запустить полный стек вместе с Website leads:

   ```bash
   docker load --input travel-club-website-amd64.tar
   docker load --input travel-club-trip-constructor-amd64.tar
   docker load --input travel-club-interviews-amd64.tar
   docker load --input travel-club-gateway-amd64.tar
   docker load --input travel-club-backend-amd64.tar
   docker load --input travel-club-website-postgres-amd64.tar
   docker compose -p travel_club -f compose.deploy.yaml --profile website-leads config --quiet
   docker compose -p travel_club -f compose.deploy.yaml --profile website-leads up -d
   docker compose -p travel_club -f compose.deploy.yaml --profile website-leads ps
   ```

4. Убедиться, что обе базы здоровы, внутренняя миграция backend завершилась, а `website-migrate` успешно применил миграции. Создать первого администратора командой `docker compose -p travel_club -f compose.deploy.yaml exec backend python -m app.bootstrap` только при первичной настройке.
5. Настроить TLS reverse proxy по runbook на общий gateway `172.19.0.4:3000`. Gateway не публикует порт на host; внутренние приложения, backend и PostgreSQL также не должны открываться напрямую в интернет. Перед запуском проверить, что Docker subnet `172.19.0.0/16` не пересекается с сетями сервера.
6. Проверить маршруты `/`, `/admin/`, `/research/`, `/api/health` и `/api/leads/health`, затем настроить отдельные резервные копии двух PostgreSQL. Проверять отправку заявки на production следует только после утверждения формы и по согласованной команде.

Runbook описывает подготовку образов, настройки reverse proxy/TLS, значения origin и proxy CIDR, health checks, bootstrap, резервное копирование и границы отката. Это инструкция для оператора; она сама по себе не подтверждает, что сервер уже развёрнут.
