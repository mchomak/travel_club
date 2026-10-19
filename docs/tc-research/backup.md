# Резервная копия и проверка восстановления PostgreSQL

Команды выполняются на Linux-хосте с production Compose из корня checkout, в котором доступен `compose.deploy.yaml`. Они используют штатные сервисы и переменные контейнера; пароль в командную строку не передаётся. Сохраняйте дамп вне репозитория и после проверки копируйте его на отдельное защищённое хранилище.

## Создать и проверить custom dump

```bash
BACKUP_DIR="$HOME/backups/travel-club"
install -d -m 0700 "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/travel-club-$(date -u +%Y%m%dT%H%M%SZ).dump"

docker compose -p travel_club -f compose.deploy.yaml exec -T postgres \
  sh -lc 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "$BACKUP_FILE"
test -s "$BACKUP_FILE"
chmod 0600 "$BACKUP_FILE"
docker compose -p travel_club -f compose.deploy.yaml exec -T postgres \
  pg_restore --list < "$BACKUP_FILE" > /dev/null
```

Формат `-Fc` позволяет просмотреть архив и выборочно восстановить его через `pg_restore`. `-T` отключает TTY, чтобы бинарный поток сохранился без преобразования. Не удаляйте копию после успешного создания; храните копию вне VPS.

## Тестовое восстановление в отдельную базу

Команды ниже рассчитаны на один сеанс Bash на Linux-хосте. `RESTORE_DB` явно задаёт новую отдельную базу; не подставляйте рабочую `POSTGRES_DB`. `createdb` завершится ошибкой, если такая база уже существует. Режим `set -Eeuo pipefail` остановит последовательность на этой или любой другой ошибке, поэтому `pg_restore` и проверки `psql` не запустятся вслед за неудачной командой.

```bash
set -Eeuo pipefail
RESTORE_DB='tc_restore_check'

docker compose -p travel_club -f compose.deploy.yaml exec -T -e RESTORE_DB="$RESTORE_DB" postgres \
  sh -lc 'createdb -U "$POSTGRES_USER" "$RESTORE_DB"'
docker compose -p travel_club -f compose.deploy.yaml exec -T -e RESTORE_DB="$RESTORE_DB" postgres \
  sh -lc 'pg_restore -U "$POSTGRES_USER" -d "$RESTORE_DB" --clean --if-exists --exit-on-error --no-owner --no-privileges' \
  < "$BACKUP_FILE"
docker compose -p travel_club -f compose.deploy.yaml exec -T -e RESTORE_DB="$RESTORE_DB" postgres \
  sh -lc 'psql -U "$POSTGRES_USER" -d "$RESTORE_DB" -v ON_ERROR_STOP=1 -Atc "SELECT version_num FROM alembic_version"'
docker compose -p travel_club -f compose.deploy.yaml exec -T -e RESTORE_DB="$RESTORE_DB" postgres \
  sh -lc 'psql -U "$POSTGRES_USER" -d "$RESTORE_DB" -v ON_ERROR_STOP=1 -Atc "SELECT count(*) FROM research_respondents"'
```

Сверьте версию Alembic и число респондентов с исходной базой; при необходимости сравните также число строк в `research_interviews` и `research_answers`. Считайте восстановление успешным только после завершения всех проверок с кодом 0. База тестового восстановления остаётся на месте для проверки или разбора ошибок; для следующего прогона задайте новое уникальное `RESTORE_DB`. Этот runbook не удаляет базы или тома.

`--clean --if-exists` удаляет объекты целевой базы перед восстановлением, поэтому сохранённая ранее база отклоняется командой `createdb` до запуска `pg_restore`. Для реального восстановления заранее согласуйте простой и используйте новую явно названную базу; перед восстановлением сделайте свежую копию текущего состояния. XLSX-экспорт Research — рабочая выгрузка, а не резервная копия: он не сохраняет схему, сессии и всю структуру PostgreSQL.
