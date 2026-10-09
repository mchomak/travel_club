# 02 — Изолированный Compose deployment

**Требования:** R02, R05, R06, R07, R08, D01
**Blocked by:** нет
**Зона:** `compose.deploy.yaml`, `.env.example`, `backend/Dockerfile`, `backend/requirements.txt` (или фактический dependency manifest)
**Волна:** 1
**Status:** ready

## Что должно заработать

На сервере можно запустить отдельный production Compose-проект с заранее собранными frontend/backend images и отдельным PostgreSQL volume. Проект не использует исходники с VPS, не публикует API или базу и не соединяется с контейнерами других приложений. `.env.example` содержит именно маркер, который `scripts/init_env.py` заменяет уникальным значением.

## Из брифа, дословно

> «задеплой наш сайт целиком на сервер»
> «если нужно сделай сборку фронта тут локлаьно и закинь на сервер уже готовую»

## Разделы спецификации

Решение, истории 8–13, поведение и ошибки, решения по реализации и граница Compose.

## Критерии приёмки

- [ ] `compose.deploy.yaml` запускает tagged frontend/backend images и PostgreSQL в отдельном named volume и project name.
- [ ] Frontend доступен только на loopback; API и PostgreSQL остаются внутри Compose network; на 443 и существующие сервисы ничего не публикуется.
- [ ] Production-настройки включают secure cookies и origin, переданный deploy-оператором после проверки IP/HTTPS-порта; ни адрес, ни порт не вшиты в приложение.
- [ ] В deployment Compose нет build contexts/исходников; команды позволяют локально собрать оба image под amd64 и сохранить их для передачи.
- [ ] Локальная backend-сборка закрывает D01 без потери существующих API/миграций; dependency set совместим с Python/toolchain и backend tests проходят.
- [ ] `.env.example` использует `replace-locally`, чтобы `scripts/init_env.py` создал случайный пароль вместо общего значения; никакой реальный `.env` не читается и не изменяется.
- [ ] `docker compose -f compose.deploy.yaml config` проходит с тестовым/примерным env, а конфигурация и lint-проверки не раскрывают секреты.

## Ограничения исполнения

Не запускай Compose, не создавай серверные volumes и пользователя; этим займётся оператор после push. Не создавать commit.
