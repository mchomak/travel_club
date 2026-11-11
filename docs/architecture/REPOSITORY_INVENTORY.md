# Инвентаризация Travel Club до реорганизации

Дата обследования: 2026-11-11. Это снимок текущей архитектуры для планирования миграции; решения «Move / Keep / Archive» ниже являются рекомендациями, а не выполненной миграцией. Проверка исходников относится к исходному коммиту `7d3b1dd43cf6fddd48699a3e44bd4d817c124326` и текущей рабочей копии до изменений приложений. Маршруты сверены с `frontend/src/app`; импорты — с их `page.tsx`, layout и тематическими компонентами.

## Текущая форма проекта

В репозитории один frontend Next.js 16 в `frontend/`, один backend FastAPI в `backend/`, общий модуль `shared/` и один PostgreSQL. Frontend пока не является workspace: у него один `frontend/package.json`, один Next config и один корневой app layout. Корневой layout загружает глобальный `frontend/src/app/globals.css` для всех URL. В Next нет API route handlers; `/api/*` проксируется через rewrite на FastAPI.

Три продуктовые границы существуют функционально, но пока не физически:

- Website: `/`, публичные страницы из `(publication)` и `(public)`, главная собрана из `components/test_21`.
- Trip Constructor: `/admin/login`, `/admin/account`, `/admin/trips/**`, связанные `components/trips` и библиотеки расчётов/карт.
- Interviews: `/research/**`, `components/research`, `/api/research/**` и данные/схемы в backend.

Административная авторизация, FastAPI, PostgreSQL, Alembic и Compose пока общие для Constructor и Interviews. Отдельного действующего набора интервью в Next.js route group вне `/research` не обнаружено.

## Реестр маршрутов и компонентов

`(publication)` и `(public)` — имена route groups Next.js и не входят в URL. Все перечисленные ниже URL существуют в обследованном дереве. Для динамических маршрутов указываются реальные шаблоны; дополнительные `/archive/[slug]` и `/tours/[slug]` сейчас отсутствуют.

| Маршрут / компонент | Текущий файл | Принадлежность | Основные зависимости | Предварительное решение |
|---|---|---|---|---|
| `/` | `frontend/src/app/page.tsx` | Website | `components/test_21/test-twenty-one-experience.tsx`, локальная главная и редактор фото | Move в `apps/website` как главную и переименовать из test-имён |
| `/test_21` | `frontend/src/app/test_21/page.tsx` | Website, технический alias | Та же `TestTwentyOneExperience`; metadata запрещает индексацию | Временно оставить noindex alias или убрать после переходной проверки |
| `/formats` | `frontend/src/app/(publication)/formats/page.tsx` | Website | `components/public-site/formats.tsx`, `SiteShell`, publication tokens/CSS | Move |
| `/archive` | `frontend/src/app/(publication)/archive/page.tsx` | Website | `components/public-site/archive.tsx`, архивные данные/изображения | Move; detail route пока не существует |
| `/start` | `frontend/src/app/(publication)/start/page.tsx` | Website | `components/public-site/start-form.tsx`, schema/валидация из `components/test/lead.ts`, query `format` | Move; форма демонстрационная и не отправляет данные |
| `/thanks` | `frontend/src/app/(publication)/thanks/page.tsx` | Website | public-site primitives и publication CSS | Move; сохраняет объяснение демонстрационного поведения |
| `/legal` | `frontend/src/app/(publication)/legal/page.tsx` | Website | `legal-document`, primitives, publication CSS | Move |
| `/privacy` | `frontend/src/app/(publication)/privacy/page.tsx` | Website | `legal-document` | Move; содержание обозначено как в подготовке |
| `/personal-data` | `frontend/src/app/(publication)/personal-data/page.tsx` | Website | `legal-document` | Move; содержание обозначено как в подготовке |
| `/payment` | `frontend/src/app/(public)/payment/page.tsx` | Website | `PublicPlaceholder`, `(public)/layout.tsx` | Move; активная информационная заглушка |
| `/services/route` | `frontend/src/app/(public)/services/route/page.tsx` | Website | `PublicPlaceholder`, `(public)/layout.tsx` | Move; активная заглушка услуги |
| `/services/turnkey` | `frontend/src/app/(public)/services/turnkey/page.tsx` | Website | `PublicPlaceholder`, `(public)/layout.tsx` | Move; активная заглушка услуги |
| `/tours` | `frontend/src/app/(public)/tours/page.tsx` | Website | `PublicPlaceholder`, `(public)/layout.tsx` | Move; активная заглушка списка |
| `/tours/[slug]`, `/archive/[slug]` | Нет файлов | Website, запрошенное возможное будущее | Реализация не обнаружена | Не создавать автоматически в рамках переноса |
| `/not-found` boundary | `frontend/src/app/not-found.tsx` | Общая техническая граница; по содержанию публичная | Next root app | Перенести/воспроизвести в каждом Next-приложении по назначению |
| `/admin/login` | `frontend/src/app/admin/login/page.tsx` | Constructor; вход также обслуживает общую admin-сессию | `LoginForm`, safe return target, `/api/auth/*` | Move в Constructor; согласовать возврат с Interviews |
| `/admin/account` | `frontend/src/app/admin/(private)/account/page.tsx` | Constructor / общий администратор | защищённый layout, change-password form, backend auth API | Move в Constructor; проверить сессию и logout-поведение |
| `/admin/trips` | `frontend/src/app/admin/(private)/trips/page.tsx` | Constructor | `components/trips/trip-list`, `TripProvider`, trips API | Move |
| `/admin/trips/new` | `frontend/src/app/admin/(private)/trips/new/page.tsx` | Constructor | `components/trips/new-trip`, API и доменная валидация | Move |
| `/admin/trips/[id]` | `frontend/src/app/admin/(private)/trips/[id]/page.tsx` | Constructor | `components/trips/trip-editor`, trip domain/API | Move |
| `/admin/trips/[id]/builder` | `frontend/src/app/admin/(private)/trips/[id]/builder/page.tsx` | Constructor | `TripEditor`, query `step=1..6` | Move вместе с URL-состоянием мастера |
| `/admin/trips/[id]/preview` | `frontend/src/app/admin/(private)/trips/[id]/preview/page.tsx` | Constructor | `TripPreview`, клиентское представление поездки | Move |
| Private trips layout | `frontend/src/app/admin/(private)/layout.tsx` | Constructor | `requireAdmin`, `TripProvider`, навигация, logout | Move; auth-контракт общий с backend |
| `/research` | `frontend/src/app/research/page.tsx` | Interviews | `RespondentListPage`, `components/research`, `/api/research` | Move в `apps/interviews` |
| `/research/new` | `frontend/src/app/research/new/page.tsx` | Interviews | `RespondentNewPage`, screening form/API | Move |
| `/research/[id]` | `frontend/src/app/research/[id]/page.tsx` | Interviews | respondent detail, interview/session APIs, autosave | Move |
| Research layout | `frontend/src/app/research/layout.tsx` | Interviews | `requireAdmin`, TC Research shell, history tracker | Move; сохранить защиту страницы и history guard |
| `/home` | `frontend/src/app/home/page.tsx` | Неоднозначно: общий внутренний launcher | `requireAdmin`; каталог Website, Constructor, Interviews, дизайн-плейграунда и экспериментов | Не переносить автоматически; решить: launcher отдельного shell или удалить только после замены связей |
| `/design-system` | `frontend/src/app/design-system/page.tsx` | Неоднозначно: Website tooling / источник публичных токенов | `playground-shell`, `BASE_TOKENS`, browser localStorage draft | Изучить и разделить: редактор Website относится к Website, его токены не становятся общими |
| `/test` (исторически test_1) | `frontend/src/app/test/page.tsx` | Website experiment | `components/test/editorial-home.tsx` и локальная demo validation; README называет это первой редакционной главной | Archive; точного URL `/test_1` нет |
| `/test_2` | `frontend/src/app/test_2/page.tsx` | Website experiment | `components/test_2`, editorial page + Living Issue и форма | Archive |
| `/test_3` | `frontend/src/app/test_3/page.tsx` | Website experiment | `components/test_3/shanghai-landing.tsx`, локальные assets | Archive; Shanghai / Open Call prototype |
| `/test_4` | `frontend/src/app/test_4/page.tsx` | Website experiment | `components/test_4`, FIELD NOTES, Living Issue, IndexedDB photo editor | Archive; уникальные компоненты нужно проверить на reuse |
| `/test_5` | `frontend/src/app/test_5/page.tsx` | Website experiment | `components/test_5`, Living Issue/camera/editor | Archive |
| `/test_6` | `frontend/src/app/test_6/page.tsx` | Website experiment | `components/test_6`, WebGL scene laboratory | Archive; noindex |
| `/test_7` | `frontend/src/app/test_7/page.tsx` | Website experiment | `test_5` homepage/editor + `test_7` MagazineHandoff | Archive; shared imports учитывать до очистки |
| `/test_8` | `frontend/src/app/test_8/page.tsx` | Website experiment | `test_7` handoff + `test_8` homepage/editor | Archive |
| `/test_9` | `frontend/src/app/test_9/page.tsx` | Website experiment | `test_9` hero exploration/variants; фото-слоты используют test_5 | Archive |
| `/test_10` | `frontend/src/app/test_10/page.tsx` | Website experiment | `test_10` magazine experience, shared scene preset; query spread | Archive; noindex |
| `/test_11` | `frontend/src/app/test_11/page.tsx` | Website experiment | `test_11/data`, 6-spread magazine | Archive |
| `/test_12` | `frontend/src/app/test_12/page.tsx` | Website experiment | `test_12/data`, 7-spread magazine | Archive |
| `/test_13` | `frontend/src/app/test_13/page.tsx` | Website experiment | `test_13/data`, 7-spread magazine; downstream readers import its content | Archive route; `SPREADS` content has active imports from tests 15–18 and must be preserved/moved if reused |
| `/test_14` | `frontend/src/app/test_14/page.tsx` | Website experiment | `test_14/data`, visual candidate based on magazine mechanics | Archive |
| `/test_15` | `frontend/src/app/test_15/page.tsx` | Website experiment | Continuous issue; `test_13` data and mobile issue content | Archive |
| `/test_16` | `frontend/src/app/test_16/page.tsx` | Website experiment | Chapter reader; `SPREADS` from test_13 and mobile issue content | Archive |
| `/test_17` | `frontend/src/app/test_17/page.tsx` | Website experiment | Chapter index/reader; `SPREADS` from test_13 | Archive |
| `/test_18` | `frontend/src/app/test_18/page.tsx` | Website experiment | Pocket reader, page data and TC fonts | Archive |
| `/test_19` | `frontend/src/app/test_19/page.tsx` | Website experiment | `test_19` homepage/editor with local photo state/assets | Archive; no downstream imports reported |
| `/test_20` | `frontend/src/app/test_20/page.tsx` | Website experiment | `test_20` ConceptHome, DesignSettings, `site-tokens`, BASE tokens, editor/assets | Archive route. Panel has no detected active imports elsewhere; preserve active test_20 assets used by test_21 |
| `test_21` | No `test_21`-numbered history cleanup; route shown above | Website production foundation | Main route uses same experience; its shared visual helpers/assets are still named `test_21`/`test_20` | Promote component names and retain/move transitive assets |
| `/test_1` | Нет файла | Не установлен как активный URL | Исторический test_1, вероятно, доступен под `/test` | Не считать отдельным маршрутом; документировать соответствие с оговоркой |

### Эксперименты и общие ресурсы

Роуты экспериментов не соответствуют независимым самодостаточным каталогам. Обнаружены прямые связи: `test_7` импортирует homepage/editor из `test_5`; `test_8` использует handoff из `test_7`; `test_15`–`test_18` используют контент `test_13`; `test_8`/`test_9` используют фото-слоты `test_5`; magazine-версии используют общую сцену/пресеты. Удаление `components/test_*` по номеру может сломать даже production `/`.

Главная `/` зависит от ресурсов `public/test_20` (включая `travel-club-navy.svg` и `china-pattern.svg`), а также изображений в `public/test/` и `public/test_9/`. Используемые пути в `test_21/photo-slots.ts`; основной код фото-редактора имеет собственное IndexedDB `travel-club-test-21-photos`. Ресурсы можно архивировать/удалять только после анализа импорта и отдельного подтверждения, что они больше не используются приложением Website.

## UI и дизайн-системы

- `frontend/src/app/globals.css` глобально загружается одним корневым layout для всех маршрутов; в ней есть общие стили и правила админки. Физическое разделение маршрутов само по себе не устраняет CSS-зависимость.
- Главная Website `/` использует `frontend/src/styles/travel-club-design-system.css`: в нём Lato и локальные токены для главной. CSS `test_21/concept.module.css` подключён к этим правилам.
- Остальные публичные страницы используют `components/public-site/site-tokens.ts`, `publication.module.css`, `fonts.css` и `BASE_TOKENS` из `components/design-system/tokens.ts`. В `BASE_TOKENS` шрифты TC Golos и TC Lora; `fonts.css` загружает эти семейства из `/test/fonts/`.
- Поэтому сейчас Website не имеет одной применяемой системы шрифтов: главная — Lato, публикационные страницы — Golos/Lora. В пользовательском задании Lato назван обязательным для всего Website; отдельно указано сохранить утверждённое оформление. Это расхождение нужно разрешить до изменения шрифтов. Инвентаризация не меняет типографику.
- Публичный `site-header.tsx` импортирует логотип/символ/CSS из `components/test_21`; `site-tokens.ts` импортирует playground `BASE_TOKENS`. Для независимой дизайн-системы Website production-активы должны получить собственное место и прямые границы.
- CSS приложения Constructor, CSS TC Research и Website нельзя объединять в общий визуальный пакет. Общая техническая библиотека допустима только для нейтральной логики.

## Backend, API, auth и база

`backend/app/main.py:create_app()` включает общие FastAPI routers auth, trips, research и maps. Next route handlers отсутствуют; `frontend/next.config.ts` перенаправляет `/api/:path*` на `BACKEND_URL`. Серверные вызовы `requireAdmin()` напрямую запрашивают backend, передавая cookie `travel_session`; клиентские клиенты работают через относительный `/api`.

| API | Потребители | Текущая граница |
|---|---|---|
| `/api/auth/{login,me,password,logout}` | Constructor, Interviews (admin session) | Одна таблица пользователей и сессий; пароли хешируются Argon2, session token сохраняется в БД в виде digest и выдаётся HttpOnly cookie |
| `/api/trips/**` | Trip Constructor | Создание/чтение/обновление/удаление/дублирование поездок, расчёт и клиентский preview; операции защищены `Admin` |
| `/api/research/**` | Interviews | Респонденты, анкеты, интервью/ответы, версии снимков и выгрузка XLSX; операции защищены `Admin` |
| `/api/maps/**` | Trip Constructor | Конфигурация карты, поиск/геокодирование, маршруты и обработка ссылок; защищено `Admin` |
| `/api/health` | Compose health check | Проверка доступности backend |

`Research` уже является работающим продуктом: список и фильтры респондентов, экспорт, screening, рекомендации категорий, выбор сценария и модулей вопросов, автосохранение, черновики браузера и обработка конфликтов, завершение интервью, неизменяемые версии и последующее редактирование новыми версиями. Банк вопросов/сценариев сейчас JSON в `backend/app/research_data/`; UI редактирования банка не обнаружен. У приложения есть тесты frontend и backend.

PostgreSQL — единая база; SQLAlchemy модели находятся в `backend/app/models.py`; единственная цепочка Alembic находится в `backend/migrations/versions/`, runtime backend применяет `alembic upgrade head`. Среди миграций есть research schema и версии интервью. Compose поднимает одну БД, backend и один frontend. Делить БД/миграции для раздельного UI оснований нет.

Cookie имеет `Path=/`, `SameSite=Lax` и не задаёт `Domain`; CSRF-проверка использует разрешённые origin из backend settings (включая `ALLOWED_ORIGIN` и опциональный `RESEARCH_ORIGIN`) и ожидаемый заголовок. Отдельные origins потребуют явной настройки CSRF/CORS, проксирования API, входа и безопасного возврата после login. Текущая схема и CI/deploy рассчитаны на один frontend image; `.github/workflows` не найдено.

## Build, Compose, окружение и тесты

- Package manager: npm (`package-lock.json`); frontend script surface в `frontend/package.json`: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`. Backend tests и Ruff настроены отдельно в `backend/`.
- `compose.yaml`: PostgreSQL 5432, FastAPI 8000, один Next frontend 3000; backend получает database config из корневого `.env`, frontend использует `BACKEND_URL=http://backend:8000`.
- `compose.deploy.yaml` использует один preview frontend image и один backend image. Документы `docs/deployment-preview.md`, `deploy/nginx/` описывают текущую публикацию; переделка production ingress не выполнена.
- Корневые `.env`/`.env.example` содержат настройки backend, БД и карт. Реальные значения в `.env` локальны и игнорируются Git. При миграции следует распределить только необходимые названия переменных по app-specific env examples и сохранить единственный набор backend/DB secret variables.
- Проверить frontend тесты, использующие backend fixture data: часть test_исследования импортирует JSON из `../backend/app/research_data/`; после перемещения это станет скрытой зависимостью пути.

## Открытые границы до проектирования миграции

1. Lato для всего Website конфликтует с текущими токенами и шрифтами части сайта; унификацию нельзя сделать незаметно, если требуется сохранить существующее отображение.
2. `master` был основной веткой; работа вынесена в новую `refactor/repository-architecture`, текущий upstream на три коммита позади локального HEAD. Не переписывать эти коммиты и не сливать автоматически.
3. Текущие защищённые приложения используют общую сессию и origin. Раздельные адреса потребуют явной routing/auth архитектуры; сохранить одно соединение и одновременно сделать три сборки можно технически разными способами, но выбор влияет на будущий ingress.
4. `/home` — защищённый cross-product launcher. Его не следует автоматически включать в один продукт или удалять, пока не определена замена ссылок между приложениями.
5. `/design-system` — Website playground; он тесно связан с Website tokens, но не должен стать общей визуальной библиотекой.
6. Исторические номера `test_1`–`test_19` не равны всем текущим папкам: `/test` трактуется как test_1 по README, точного `/test_1` route нет. Проверить формулировку архива и не удалять shared assets.
7. Создание локального тега уже выполнено: `archive/legacy-test-pages-01-19`, привязан к исходному HEAD. GitHub Release ещё не создан; публичная публикация должна опираться на проверку содержимого тега, включая последний публичный код и файлы с персональными/секретными данными.

## Рекомендуемые следующие действия

Сначала закрепить продуктовые решения по шрифтам и будущей схеме адресов/auth. Затем разработать перенос route/component/assets карты и определить вид `/home`; сохранить общий FastAPI и Alembic как один backend. Только после отдельной проверки зависимостей архивировать experiment routes, переместить production website и разделить frontend build configs. После переноса выполнить независимые сборки, тесты и сценарии на каждом приложении; сравнить CSS-зависимости и основные страницы со снимками до изменения.
