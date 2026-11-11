# Interview Platform

Закрытое приложение исследований Travel Club. Оно владеет `/research/**`, своими компонентами, дизайн-токенами и стилями. FastAPI и PostgreSQL остаются общими, источник вопросов и бизнес-правил хранится в backend.

## Запуск и проверки

Из этой папки (`apps/interviews`):

```powershell
npm.cmd ci
npm.cmd run dev
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test -- --run --testTimeout=15000
npm.cmd run build
npm.cmd start
```

Локальный порт — **3102**. `npm.cmd start` запускает собранный standalone server приложения. Backend должен отвечать на `BACKEND_URL` (по умолчанию `http://127.0.0.1:8000`). Сессия устанавливается существующим backend в cookie `travel_session`; API запросы используют `/api` через Next rewrite. Для отдельного запуска используется `/admin/login`; на общем origin этот путь направляет gateway к Constructor, где вход устанавливает ту же host-only cookie.

`NEXT_ASSET_PREFIX=/_app/interviews` отделяет файлы сборки Next на общем origin. Приложение переписывает этот префикс обратно к локальным `/_next` при прямом запуске. `NEXT_PUBLIC_CONSTRUCTOR_URL` задаёт адрес общих страниц `/home` и `/admin/trips`; при standalone dev по умолчанию это `http://localhost:3101`, за gateway значение оставляют пустым. Прочие переменные backend и БД управляются в корневом `.env` и в самом backend.

Два теста читают версионируемые JSON-данные backend из `../../backend/app/research_data`; runtime экранов остаётся на API, не на прямом файловом доступе.

## Изоляция браузерных тестов

Для `npm.cmd run test:e2e` обязательны `PLAYWRIGHT_BASE_URL` и `PLAYWRIGHT_TEST_BACKEND_CONTAINER` (явное имя тестового backend-контейнера). Используйте root URL вида `http://127.0.0.1:3300`: только HTTP, IPv4 loopback `127.0.0.1`, без path/query/hash/credentials, с портом, строго совпадающим с опубликованным портом выбранного gateway. Global setup проверяет backend, ровно один gateway и PostgreSQL service в одном Compose-проекте с маркером `test`, `e2e` или `check`; проверяет адрес реального подключения backend к PostgreSQL и принадлежность Compose-managed volume `${project}_postgres_data` тому же проекту. Volume не должен использоваться другими контейнерами. Ошибка или недоступность любой проверки прерывает запуск. Сначала подготовьте отдельную disposable test database и gateway в тестовом Compose-проекте. Не используйте preview или обычную базу. Для browser E2E нужен Chromium.
