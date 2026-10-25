# 03 — Публичная проверка на телефоне

**Требования:** R05, R07i
**Blocked by:** 02
**Зона:** isolated release revision, existing preview frontend only
**Волна:** 3
**Status:** ready

## Результат

Проверенный новый `/test_18` доступен на том же HTTPS preview для открытия с настоящего телефона. Разрешение пользователя на серверный доступ и размещение страниц сохраняется из этой сессии. Это операционная публикация, не новая product feature.

## Приёмка

- [ ] Чистая intended revision, source/frontend проверки зелёные, активная origin/master подтверждена runtime вместо устаревшего main runbook. Только явные scoped файлы, без unrelated root changes.
- [ ] По docs/deployment-preview.md свежий baseline сервисов/портов/RAM/disk; существующий ingress проверен без его переустройства. Secrets/.env не выводить, runtime host/URL не записывать в git.
- [ ] linux/amd64 frontend image построен из intended clean revision, tar hash совпал при передаче, старый frontend image сохранён rollback tag. Обновляется только frontend, база/backend/VPN/бот не перезапускаются.
- [ ] HTTPS/cert валидируется без bypass; новая страница и assets200, действия живого reader проходят внешний Playwright. Условия RAM/disk/noOOM и старые listeners/services совпадают с baseline.
- [ ] Итоговая публичная ссылка дана пользователю; не выдавать Chromium emulation за физические устройства.

Операторские SSH authentication действия выполняет родитель; секрет не передаётся в prompts подагентов и не сохраняется в файлы.
