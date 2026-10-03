# Итог: редакционная главная Travel Club

Production страница работает на http://localhost:3000/test. `/`, прежние публичные routes, admin, конструктор, backend, API, auth и база данных сохранены.

## Принятые решения

Один изолированный route, CSS Module и локальные материалы. Оболочка — молочный, графит и ink navy; Golos Text и Lora; асимметричная сетка, живые фотографии и журнал вместо каталога туров. Destination Identity меняется внутри архива, сохраняя устойчивую оболочку бренда. Выбраны концептуальные выпуски и честный frontend demo формы, поскольку реальные даты, контакты и подходящий endpoint не заданы.

## Файлы

- `frontend/src/app/test/page.tsx` — новый маршрут и metadata.
- `frontend/src/components/test/data.ts`, `editorial-home.tsx`, `editorial.module.css`, `lead.ts`, `lead-form.tsx`, `README.md` — данные, композиция, scoped стили, форма и инструкция.
- `frontend/public/test/` — шесть локальных Pexels JPEG, шесть WOFF2, лицензии, README и manifest источников.
- `frontend/e2e/test-home.spec.ts` — пять новых браузерных сценариев.
- `AGENTS.md` — один дополнительный пункт о /test. `.autopilot/` — архив исходного брифа, требований, спецификации, проверок и приёмки. Исходники существующей функциональности не изменены; новые зависимости не установлены.

## Настройка

Основные тексты, navigation/products/principles/workflow и метаданные поездок — `data.ts`; небольшие подписи и placeholders — `editorial-home.tsx`, тексты состояния формы — `lead-form.tsx`.

Сами фото — `public/test/`; пути, alt, размеры и кадрирование — `images` в `data.ts`. Источники и лицензии — README/manifest рядом с фото. Файлы легко заменить собственными; затем пересобрать frontend.

Цвета выпусков — `issues[].theme` в `data.ts`: background, foreground, accent, muted, line. Базовая палитра и font tokens `--tc-sans`/`--tc-editorial` — `.root` в CSS Module.

React state выбирает Issue, один общий spread получает новые текст/фото/metadata и CSS variables. Istanbul — ivory/burgundy, Shanghai — graphite/cobalt/silver, Next — базовый navy. CSS transition мягко меняет палитру; reduced motion отключает его.

Форма валидирует контакт, показывает ошибки с focus, сохраняет поля при ошибке, даёт demo success и повтор. Будущий API подключается через `SubmitLead` в `lead.ts` без изменения презентации формы.

## Временные решения

Фото и шрифтовая пара временные. Выпуски, месяцы и люди — обозначенные концепции, Next не открыт для продажи. Memory — образец будущей книги, не реальный отзыв. Telegram/Instagram и документы — видимые будущие позиции. Форма сейчас ничего не передаёт и не сохраняет. Пустых env-переменных для этой страницы нет; перед реальным запуском нужны материалы бренда, действующие контакты/документы и submit adapter.

## Проверка

Lint и typecheck passed; production build passed локально и в Docker. Последний Docker build включает финальную CSS правку фокуса. Существующие unit: 65 passed; production browser subset: 9 passed, включая пять новых и четыре прежних сценария. Desktop 1440×900, laptop 1024, mobile 390×844 проверены; overflow нет. Сделан отдельный refinement pass. Прежние публичные routes и admin redirect проверены; backend/PostgreSQL остаются healthy. Независимая слепая приёмка функциональных пропусков не нашла.

Полный набор e2e конструктора и backend tests в этой итерации не повторялся: их исходники не менялись. Проверка авторизованных сохранённых поездок не выполнялась; данные не изменялись.

## Что не вошло

Из заказанной дизайнерской версии ничего не исключено. Реальные отправка, бронирование, оплата, отдельные страницы поездок и community не реализованы в соответствии с заданным scope.

## Процесс и запуск

Внешний HTTP 403 прервал первого исполнителя; страница завершена root в рамках T0. Независимые review/QA проведены отдельно. Ничего сверх заказанной продуктовой поверхности не добавлено.

Сайт уже запущен в Docker. Для обновления: `docker compose build frontend`, затем `docker compose up -d --no-deps frontend`; открыть http://localhost:3000/test. Код локально закоммичен как `b8e3f2b`; внешняя публикация не выполнялась.

Архив прогона: `.autopilot/2026-10-03-editorial-test-home/`. Карта настройки: `frontend/src/components/test/README.md`. Команды и результаты: `verification.md`; независимый вердикт: `acceptance.md`.
