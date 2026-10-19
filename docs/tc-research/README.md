# TC Research: запуск и сопровождение

## Локальный запуск на Windows

Нужны Docker Desktop с Compose и Python 3.11+. В PowerShell из корня репозитория:

```powershell
python scripts/init_env.py
docker compose config --quiet
docker compose up -d --build --wait
docker compose ps
```

Backend применяет Alembic-миграции при старте контейнера. Если администратора ещё нет, создайте его один раз из терминала:

```powershell
docker compose exec backend python -m app.bootstrap
```

Откройте `http://localhost:3000/research` и войдите существующей учётной записью Travel Club. Страница и API требуют авторизацию администратора; отдельной регистрации или отдельного пароля Research нет. Если локальная база уже содержит администратора, bootstrap не нужен.

Для обычной остановки выполните `docker compose down`. Не используйте `docker compose down -v`: эта команда удалит локальный том PostgreSQL.

## Дальше

- [Публикация на HTTPS-поддомене](deployment.md)
- [Обновление JSON-банка и сценариев](json-data.md)
- [Резервная копия и проверка восстановления PostgreSQL](backup.md)

На 19 октября 2026 домен, DNS, сертификат и VPS для TC Research не настроены. В инструкциях ниже используются только заменяемые значения.
