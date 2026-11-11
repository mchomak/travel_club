# Travel Club

Travel Club — monorepo из трёх Next.js-приложений и общего backend. Каждый продукт имеет собственные маршруты, исходники, сборку и визуальные стили; API, авторизация и PostgreSQL остаются едиными.

## Приложения

| Приложение | Назначение | Локальный dev-порт | Код |
|---|---|---:|---|
| Website | Публичные страницы Travel Club | 3100 | `apps/website/` |
| Trip Constructor | Закрытое планирование поездок и смет | 3101 | `apps/trip-constructor/` |
| Interviews | Внутренние интервью и исследования | 3102 | `apps/interviews/` |

Локальный gateway принимает общий origin на порту `3000` по умолчанию. В нём `/` и публичные страницы направляются в Website, `/admin/**` и `/home` — в Constructor, `/research/**` — в Interviews, `/api/**` — в backend. Порт gateway можно изменить через `PORT` при локальном запуске или `GATEWAY_PORT` для Compose.

## Быстрый запуск через Docker Compose

Нужны Docker Desktop с Compose и Python для начальной подготовки локального `.env`.

```powershell
python scripts/init_env.py
docker compose config --quiet
docker compose up -d --build --wait
docker compose exec backend python -m app.bootstrap
```

`app.bootstrap` запускайте один раз для создания первого администратора. Не передавайте пароль аргументом команды. После запуска откройте `http://localhost:3000`; проверка API доступна по `http://localhost:8000/api/health`. Compose запускает gateway, три приложения, FastAPI и PostgreSQL. Обычная остановка: `docker compose down`. Команда `docker compose down -v` удаляет локальные данные PostgreSQL.

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

Constructor и Interviews используют общий FastAPI backend для авторизации и рабочих данных. Website может работать отдельно для просмотра публичных страниц; его демонстрационная форма не сохраняет ответы. Для общего локального origin запустите нужные app-серверы на их обычных портах и выполните `npm.cmd run dev:gateway`. Gateway по умолчанию слушает `3000`; например, в PowerShell его порт можно задать перед запуском через `$env:PORT = "3300"`. Не запускайте gateway-процесс на порту, уже занятом gateway из Compose.

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

Единый FastAPI backend находится в `backend/`, PostgreSQL — в Compose. Backend владеет авторизацией и общей cookie-сессией, поездками, картами и исследованиями. Единственный источник миграций — `backend/migrations/`; не создавайте отдельные базы или копии API для приложений. Основные пространства API: `/api/auth`, `/api/trips`, `/api/maps`, `/api/research`. Серверная логика расчёта поездок использует Decimal.

Локальный `.env` создаёт `python scripts/init_env.py` из `.env.example`, не перезаписывая существующий файл. App-level `.env.example` есть у всех трёх приложений: файл Website указывает, что переменные не обязательны, и документирует необязательный `BACKEND_URL` для API rewrite. В документации перечислены только названия переменных; не добавляйте реальные значения или секреты в Git. Корневой пример содержит `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `APP_ENV`, `ALLOWED_ORIGIN`, `RESEARCH_ORIGIN`, `ADDITIONAL_ALLOWED_ORIGINS`, `GATEWAY_PORT`, `COOKIE_SECURE`, `GEOAPIFY_API_KEY` и `GEOAPIFY_MAPS_API_KEY`. Для app runtime дополнительно встречаются `BACKEND_URL`, `NEXT_ASSET_PREFIX`, `NEXT_PUBLIC_CONSTRUCTOR_URL` и `NEXT_PUBLIC_INTERVIEWS_URL`.

## Архив экспериментальных страниц

Аннотированный Git-тег `archive/legacy-test-pages-01-19` создан локально до удаления старых тестовых страниц. GitHub Release не публиковался: архивный коммит содержит внутренние материалы, которые нельзя раскрывать. Не отправляйте этот тег на GitHub и не создавайте Release с ним. Список версий и безопасный порядок восстановления описаны в [docs/archive/LEGACY_TEST_PAGES.md](docs/archive/LEGACY_TEST_PAGES.md); причина и статус публикации зафиксированы в [docs/archive/LEGACY_RELEASE.md](docs/archive/LEGACY_RELEASE.md).

Старый root `frontend/` больше не является активным приложением: его tracked исходники удалены из рабочей архитектуры, а локальные ignored/untracked артефакты оставлены нетронутыми вне Git. Исторические маршруты и пути сохранены в локальном archive tag и документах архива. [REPOSITORY_INVENTORY.md](docs/architecture/REPOSITORY_INVENTORY.md) остаётся историческим снимком; актуальные границы описаны в [REPOSITORY_ARCHITECTURE.md](docs/architecture/REPOSITORY_ARCHITECTURE.md).

## Preview

`compose.deploy.yaml` описывает сборку из предварительно подготовленных Linux/amd64 образов. Gateway не публикует host-порт: preview ingress настраивается через host Nginx к gateway по адресу приватной Docker-сети. Порядок подготовки образов и runbook находятся в [docs/deployment-preview.md](docs/deployment-preview.md). Сам runbook не означает, что preview уже развёрнут.
