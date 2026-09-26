# 01 — Основа приложения и защищённый вход

**Требования:** R001, R002, R003, R004, R005, R006, R007, R008, R009, R010, R011, R012, R013, R014, R015, R016, R017, R018, R019, R020, R021, R022, R023, R024, R025, R026, R027, R028, R029, R030, R031, R032, R033, R034, R035, R036, R037, R038, R039, R040, R041, R042, R043, R044, R045, R046, R047, R048, R049, R050, R051, R052, R053, R054, R055, R056, R057, R058, R059, R060, R061, R062, R063, R064, R065, R066, R067, R068, R069, R070, R071, R072, R073, R074, R075, R076, R077, R078, R079, R355, R356, R357, R358, R359, R360, R361, R362, R363, R364, R365, R366, R367, R368, R484, R485, R486, R487, R488, R489, R490, R491, R492, R493, R494, R495, R496, R497, R498, R499, R500, R501, R502, R503, R504, R505, R506, R507, R508, R509, R510, R511, R512, R513, R514, R515, R516, R517, R518, R519, R520, R521, R522, R523, R524, R525, R526, R527, R528, R529, R530, R531, R532, R533

**Blocked by:** нет
**Зона:** backend/, frontend/, shared/, compose.yaml, README.md, scripts/
**Волна:** 1
**Status:** ready

## Что должно заработать

Создать запускаемую основу, PostgreSQL migrations всей модели и строгие Pydantic/TypeScript контракты для всех следующих тасков. Полностью рабочая авторизация login/logout/me, bootstrap CLI, cookie/CSRF/rate limit; Next public placeholders и private server guard, аккуратный login. Здесь не реализовать trip pricing/CRUD или editor: это следующие таски. Дать точные сигнатуры и типы, чтобы backend и frontend потом работали независимо.

Разрешено устанавливать названные в спецификации зависимости из официальных реестров, создавать конфиги, lock files и Dockerfiles. Проверить актуальные стабильные версии через реестры. Хост Python 3.11.9, Node24.11.1, Docker29.2.1 доступны; Docker engine работает. Host ports 3000/8000/5432 свободны, другие чужие контейнеры не трогать. PostgreSQL поднять реально в проекте travel_club. .env.example не содержит действительных секретов. Для автоматических проверок допустимы генерируемые в памяти временные тестовые credentials, не выводить их и не записывать в отслеживаемые файлы; пользователь создаст постоянного администратора локальной командой. Тестовые постоянные пароли только явно фиктивные test fixtures. Не делать production trust auth.

Сразу включить все потребные зависимости для следующих тасков: decimal.js, React Hook Form, Zod, TanStack Query, доступные modal primitives (Radix Dialog приемлем), lucide-react при необходимости; Vitest, Testing Library, Playwright; backend pytest/httpx/Ruff. Установки следующих тасков заблокированы, кроме явно согласованного исправления. Финансовый shared JSON fixture contract с входным TripInput и expected totals. Заморозить transport names в contracts и возвратном INTERFACES. Не оставлять fake calculate реализацию — пока маршрута нет, отсутствует.

## Из брифа, дословно

> Не останавливайся после создания структуры или мокапа. Цель — получить реально работающий первый модуль.

## Разделы спецификации

§0, §2, §3, §4, §5, §20, §30, §31, §32; Границы и швы; Уточнения независимой проверки G2.

## Критерии приёмки

- [ ] Compose PostgreSQL здоров, Alembic initial migration проходит чистую базу, таблицы/FK/Numeric соответствуют §20.
- [ ] Auth login/logout/me, 401 protection, CSRF, expiry, cookie flags, throttling и bootstrap имеют исполнимые meaningful tests.
- [ ] Next login и публичные placeholders работают, приватная пустая shell перенаправляет без server session.
- [ ] Backend schemas и TypeScript types фиксируют TripInput/TripDocument/Calculation/Preview; include item calculation_mode (забыто в перечне полей, обязательно).
- [ ] Frontend lint/typecheck/production build проходят; backend тесты не нулевые; README содержит фактические команды.
