# 04 — Сквозная приёмка и запуск

**Требования:** R04, R12, R31, R44, R49, R50, R51, R52, R53, R54, R55, R59, R60, R62, R63, R64, R65, R66, R67, R68, R69, R70, R71, R72, R73, R74, R75, R76, R77, R78, R79, R80, R81, R82, R83
**Blocked by:** 03
**Зона:** frontend/e2e/, backend/tests/, docs/, README.md, frontend/, backend/
**Волна:** 4
**Status:** ready

## Что должно заработать

Выполнить §7 на реальном приложении и PostgreSQL. Создать meaningful Playwright wizard spec (использовать существующие constructor/trip-map fixtures). 8 дней, несколько long-haul, 2 hotels, meals/activities/local transport; пройти все 17 пунктов брифа и проверить фактические DB rows, UUID/no duplicates, costs backend, reload обеих editor modes. Main auth/save/API не mock. Map provider можно детерминированно stub только для карты, тестировать nodes и selection. Network save fail/delay/retry и rapid navigation, подтверждённый status; version conflicts сохраняют local draft. Проверить реально old trip created before new fields (null legacy) и сохранение в full editor. Responsive desktop/tablet screenshot+interaction. Clean migration isolated database, backend full pytest/Ruff, frontend full Vitest/lint/typecheck/build, Docker compose rebuild/start (без чужих контейнеров и без удаления user data), relevant old constructor/calendar/map e2e. Исправлять реальные defects только в scope, regression tests. Документировать запуск/route/offset semantics/ограничения в docs/trip-builder.md или README. Итоговые команды/результаты в acceptance.md данного run разрешены, state/manifest/interfaces не менять. Не раскрывать secrets, fixture credentials генерировать ephemeral, не использовать real user password. Не deploy/push.

## Из брифа, дословно

> «По возможности сохрани существующие API и структуру БД. Если изменения в схеме действительно необходимы, подготовь безопасные миграции с сохранением совместимости существующих поездок.»

> «Учти пересечение полуночи и часовые пояса при работе с перелётами.»

> «Изменения в календаре должны синхронизироваться с однодневным редактором и наоборот.»

> «Не нужно повторно создавать одни и те же события.»

## Разделы спецификации

§1–§7; Границы и швы.

## Критерии приёмки

- [ ] Проверена concern T02: выбор маркера мышью/клавиатурой сохраняет фокус и popup; если маркеры пересоздаются и теряют состояние, воспроизвести и исправить в MapCanvas без изменения маршрута/provider state.
- [ ] Все 17 acceptance scenarios проверены действиями/API/DB, включая 8 дней и два отеля.
- [ ] DB подтверждает сохранение/reload/move/delete/no duplicates/offsets и верные Decimal totals.
- [ ] Ошибка/задержка/retry/fast nav не теряют последнюю revision и не дают ложное saved.
- [ ] Old editor + legacy items + date/auth guards проходят regression.
- [ ] Clean migration и Compose работают, suites/build зелёные; визуально три колонки на desktop, планшет доступен.
- [ ] Документы и acceptance.md отражают фактические команды, результаты и ограничения.
