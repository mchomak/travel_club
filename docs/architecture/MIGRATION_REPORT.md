# Отчёт о реорганизации Travel Club

Дата отчёта: 11 ноября 2026. Это состояние рабочей ветки `refactor/repository-architecture`; изменения подготовлены для review и не объединены в `master`.

## Исходная архитектура

До миграции три продукта жили в одном Next.js 16 приложении `frontend/`: общие маршруты, один корневой layout и глобальный CSS сочетали публичный Website, Trip Constructor и Interviews. Дизайн-системы, экспериментальные страницы, бизнес-компоненты, browser tests и настройки приложения находились в одном дереве зависимостей. FastAPI, PostgreSQL, Alembic и авторизация уже были общими и оставались таковыми.

До любых удалений проверены текущие маршруты и связи компонентов. Первичная таблица маршрутов и зависимостей сохранена в историческом [снимке инвентаризации](REPOSITORY_INVENTORY.md); её пути относятся к исходной структуре, а решения `Move / Keep / Archive` описывают план миграции.

## Итоговая архитектура

В `apps/` находятся три независимых Next.js-приложения со своими `package.json`, lockfile, настройками, маршрутами, ресурсами, тестами и глобальными стилями. Корневой `package.json` содержит команды-обёртки, npm workspaces не используются. Нет межпродуктовых импортов UI, CSS, шрифтов или токенов. Общие backend, база данных и API не дублировались; новые миграции базы для разделения приложений не добавлялись.

| Приложение | Основные маршруты | Владелец стилей | Локальный порт |
|---|---|---|---:|
| Website | `/`, `/formats`, `/services/route`, `/services/turnkey`, `/tours`, `/payment`, `/archive`, `/start`, `/thanks`, `/legal`, `/privacy`, `/personal-data` | `apps/website/src/styles/travel-club-design-system.css`, app-local global CSS и компоненты; утверждённые токены используют Lato | 3100 |
| Trip Constructor | `/home`, `/admin/login`, `/admin/account`, `/admin/trips`, `/admin/trips/new`, `/admin/trips/[id]`, `/admin/trips/[id]/builder`, `/admin/trips/[id]/preview` | `apps/trip-constructor/src/design-system/tokens.css` и app-local CSS | 3101 |
| Interviews | `/`, `/admin/login`, `/research`, `/research/new`, `/research/[id]` | `apps/interviews/src/styles/globals.css` и app-local CSS; отдельный централизованный файл токенов пока не выделен | 3102 |

Единый локальный gateway слушает порт 3000 по умолчанию. Он направляет публичные URL в Website, `/admin/**` и `/home` в Constructor, `/research/**` в Interviews, `/api/**` в FastAPI. Next-статика изолирована префиксами `/_app/website/_next/**`, `/_app/constructor/_next/**` и `/_app/interviews/_next/**`. Самостоятельный dev не требует запускать два других приложения; Constructor и Interviews требуют существующий backend для авторизации и рабочих данных.

Текущие route groups Website `(publication)` и `(public)` пока используют разные layout/CSS. Это отражено в app README; общая публичная оболочка Website относится к следующему этапу стандартизации и не является завершённым результатом этой миграции. Фактических `/archive/[slug]` и `/tours/[slug]` страниц в приложении нет.

## Backend, API, данные и конфигурация

Один backend расположен в `backend/app/`, один источник Alembic migrations — `backend/migrations/`, одна PostgreSQL остаётся общей для Constructor и Interviews. Namespaces `/api/auth`, `/api/trips`, `/api/maps` и `/api/research` сохранены; backend остаётся источником истины авторизации, данных и расчётов. Финансовые расчёты используют существующий Decimal-контракт. Gateway не подменяет серверную авторизацию. API handlers не копировались между frontend-приложениями.

Технические общие части: backend/API, `gateway/`, миграции и контрольные векторы `shared/pricing-vectors.json`. Shared UI, общие шрифты, CSS или design tokens не добавлялись. Для каждого приложения есть свой `.env.example`; root `.env.example` и существующий loader сохранены. Переменные backend и секреты не дублируются без необходимости. Документация перечисляет только имена параметров, значения здесь не приводятся.

## Экспериментальные маршруты и архив

Перед очисткой создан аннотированный локальный тег `archive/legacy-test-pages-01-19`, указывающий на commit `7d3b1dd43cf6fddd48699a3e44bd4d817c124326`. В рабочем дереве удалены 620 tracked файлов старого `frontend/` и два неиспользуемых скрипта `test9`. Неотслеживаемые и игнорируемые локальные файлы не удалялись. Коды, ресурсы и исторические URL доступны для адресного чтения/восстановления из тега по инструкциям в [LEGACY_TEST_PAGES.md](../archive/LEGACY_TEST_PAGES.md).

В исходном дереве буквального `/test_1` не было: первую редакционную версию представлял `/test`. Маршруты `/test_2`–`/test_21` были сохранены в архивном commit; активные тестовые маршруты удалены из приложений. `/test_20` был экспериментом Design Settings и не имел выявленных действующих ссылок; `/test_21` стал основой Website главной `/` и не оставлен как активная индексируемая копия.

**Тег остаётся локальным. GitHub Release не создан и публикация тега запрещена:** архивный commit содержит внутренние материалы CustDev. Редактирование текста release не скрывает материалы, уже входящие в commit. Подготовлена только внутренняя запись о статусе в [LEGACY_RELEASE.md](../archive/LEGACY_RELEASE.md), а не безопасный публичный release. Не выполнять push тега.

## Запуск и сборки

Из корня репозитория в PowerShell:

```powershell
python scripts/init_env.py
docker compose config --quiet
docker compose up -d --build --wait
docker compose exec backend python -m app.bootstrap
```

`app.bootstrap` нужен один раз для создания администратора. Независимые app-команды используют `npm.cmd run dev:website`, `dev:constructor`, `dev:interviews`; общий origin — `npm.cmd run dev:gateway`. Для изолированной установки зависимостей используйте `npm.cmd ci --prefix apps/<app>`.

Общие проверки: `npm.cmd run lint:all`, `npm.cmd run typecheck:all`, `npm.cmd run test:all`, `npm.cmd run build:all`. Независимые production builds: `npm.cmd run build:website`, `build:constructor`, `build:interviews`. Backend: `docker compose exec -T backend pytest -q` и `docker compose exec -T backend ruff check .`. Полный список и дополнительные ограничения запуска находятся в [README.md](../../README.md).

## Результаты проверок

Root-команды `lint:all`, `typecheck:all`, `test:all` и `build:all` завершились успешно. Unit suite: Website — 8 тестов, Constructor — 173, Interviews — 51, gateway — 6. В изолированном Docker Compose-контуре backend suite завершился с 190 passed; Ruff прошёл, Alembic head проверен. Все пять локальных Docker images собирались; изолированный Compose-контур стал healthy. После этого Website build и typecheck повторно прошли; production server приложения запускался отдельно на `127.0.0.1:3110`.

| Проверка | Website | Constructor | Interviews |
|---|---|---|---|
| Независимый запуск | PASS — production server запущен отдельно на `127.0.0.1:3110`; стандартные dev/Compose порты остаются 3100/3000 | PASS — standalone production smoke на `127.0.0.1:3411`: login 200, защищённые `/home` и `/admin/trips/new` перенаправляют 307 на login, CSS 200 | PASS — standalone production smoke на `127.0.0.1:3412`: login 200, защищённый `/research/new` перенаправляет 307 на login, CSS 200 |
| Build | PASS — отдельный и общий `build:all` | PASS — отдельный и общий `build:all` | PASS — отдельный и общий `build:all` |
| Lint | PASS — `lint:all` | PASS — `lint:all` | PASS — `lint:all` |
| Typecheck | PASS — `typecheck:all` | PASS — `typecheck:all` | PASS — `typecheck:all` |
| Маршруты | PASS — 12 публичных маршрутов в 5 ширинах; бывшие `/test` и `/test_1`–`/test_21` возвращают 404 | PASS — существующие private routes проверены browser E2E через gateway | PASS — существующие research routes проверены browser E2E через gateway |
| Функциональность | PASS — standalone production Playwright privacy/navigation suite 7/7; форма остаётся демонстрационной, более ранние gateway-сценарии проверили demo-submit и редактор фото | PASS — Constructor E2E 50 passed после переноса; проверки редактора, сохранения и карты через gateway | PASS — перенесённый E2E suite 7 passed; исходные 3 сценария ранее проходили на изолированном Compose |
| Изоляция CSS | PASS — изменение токена Website не меняло два других приложения; токен восстановлен | PASS — изменение токена Constructor не меняло Website/Interviews; токен восстановлен | PASS — изменение токена Interviews не меняло Website/Constructor; токен восстановлен |
| Дизайн-система | PASS — своя система, Lato, активные страницы сверены с утверждёнными токенами | PASS — собственные токены и глобальные стили | PASS — собственные глобальные стили; визуальные импорты из соседних приложений отсутствуют |

В standalone production smoke Constructor на `127.0.0.1:3411` проверены login (`200`), закрытые `/home` и `/admin/trips/new` (оба `307` на login без сессии), и CSS (`200`). В standalone production smoke Interviews на `127.0.0.1:3412` проверены login (`200`), закрытый `/research/new` (`307` на login без сессии), и CSS (`200`). Это проверки загрузки приложения и доступа без авторизованной сессии; авторизованные функциональные browser сценарии проверялись через gateway. Оба standalone server процесса после smoke остановлены.

В актуальной standalone production-проверке Website сервер слушал только `127.0.0.1:3110`; Playwright privacy/navigation suite прошёл **7/7**. Favicon metadata использует существующий SVG. Ранее через gateway выполнена маршрутная матрица: 12 URL на размерах 375×812, 430×932, 768×1024, 1280×800 и 1440×900 — 60 сочетаний страницы и viewport. На ней проверены отсутствие горизонтального overflow, загрузка шрифта и изображений, отсутствие ошибок консоли и ссылок на старые тестовые маршруты. Отдельные gateway browser-сценарии проверили переход `/start` → `/thanks` и локальное сохранение/сброс фотографии. Личные ответы не должны попадать в запросы, URL, storage, cookies или console.

Изоляция токенов проверялась обратимым изменением отдельного токена каждого приложения и наблюдением двух соседних приложений; исходные значения затем возвращены. Это подтверждает независимость сборок/стилей в проверенном сценарии, а не универсальную гарантию от любого будущего импорта.

Independent acceptance проверила только безопасные GET-маршруты и не повторяла browser E2E, которые создают/меняют тестовые данные. Browser E2E Constructor и Interviews запускались только на выделенном disposable Compose-контуре. Их global setup теперь проверяет loopback gateway, backend/PostgreSQL в одном test project, фактический `inet_server_addr()` и project-owned PostgreSQL volume, который не может быть смонтирован дополнительным контейнером.

## Ограничения и ручные действия

- Живое качество внешних карт, тайлов, геокодирования и маршрутизации Geoapify не подтверждено: browser сценарии используют детерминированные ответы, а полноценный запрос требует настроенного внешнего провайдера. Работа интерфейса карты и внутреннего API проверялась отдельно; внешняя доступность не заявляется.
- Отдельного Compose manifest для E2E контура нет. Перед следующими destructive browser сценариями оператор должен запустить disposable проект и указать `PLAYWRIGHT_BASE_URL` и правильное имя backend-контейнера. Guard проверяет цель перед запуском.
- Preview runbook и Compose конфигурация обновлены под пять образов и единый gateway; фактический VPS deployment, production ingress и сторонние сервисы не выполнялись и не проверялись.
- Website пока имеет две оболочки для двух route groups. Унификация Header/Navigation/Footer всех публичных страниц остаётся отдельным следующим этапом.
- Не считать Release созданным: пользовательские CustDev-материалы запрещено раскрывать, тег не отправлять в удалённый репозиторий.
- В предыдущем QA-выводе могли оказаться значения backend credentials. Значения не повторяются. Следует подтвердить ручную ротацию переменных `POSTGRES_PASSWORD`, `GEOAPIFY_API_KEY` и `GEOAPIFY_MAPS_API_KEY` в локальном/runtime secret store; изменение или чтение `.env` не выполнялось в этом отчёте.

## Что осталось вручную

1. Подтвердить ротацию перечисленных credentials и обновить их только в соответствующих локальных/runtime secret stores.
2. Сохранить архивный тег исключительно локально, если нужно восстановление; не публиковать tag/Release с текущим commit.
3. Для live-проверки карты отдельно предоставить тестовые Geoapify credentials в закрытом окружении и повторить только внешние provider checks.
4. После review ветки выполнить отдельную Website-задачу по общей публичной оболочке, не выдавая её за часть завершённой миграции.

Примечание: тексты и количества тестов в таблице относятся к проверкам, перечисленным выше. Они не означают, что независимый acceptance agent повторил все E2E-сценарии или что production deployment был выполнен.
