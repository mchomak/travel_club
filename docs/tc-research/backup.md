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

Проверка ниже создаёт и удаляет только базу `tc_restore_check`. Не меняйте её имя на рабочую `POSTGRES_DB` и не запускайте эту последовательность на production-базе как способ восстановления.

```bash
docker compose -p travel_club -f compose.deploy.yaml exec -T postgres \
  sh -lc 'createdb -U "$POSTGRES_USER" tc_restore_check'
docker compose -p travel_club -f compose.deploy.yaml exec -T postgres \
  sh -lc 'pg_restore -U "$POSTGRES_USER" -d tc_restore_check --clean --if-exists --no-owner --no-privileges' \
  < "$BACKUP_FILE"
docker compose -p travel_club -f compose.deploy.yaml exec -T postgres \
  sh -lc 'psql -U "$POSTGRES_USER" -d tc_restore_check -v ON_ERROR_STOP=1 -Atc "SELECT version_num FROM alembic_version"'
docker compose -p travel_club -f compose.deploy.yaml exec -T postgres \
  sh -lc 'psql -U "$POSTGRES_USER" -d tc_restore_check -v ON_ERROR_STOP=1 -Atc "SELECT count(*) FROM research_respondents"'
```

Сверьте версию Alembic и число респондентов с исходной базой; при необходимости сравните также число строк в `research_interviews` и `research_answers`. После проверки удалите только отдельную тестовую базу:

```bash
docker compose -p travel_club -f compose.deploy.yaml exec -T postgres \
  sh -lc 'dropdb -U "$POSTGRES_USER" tc_restore_check'
```

`--clean --if-exists` удаляет объекты в целевой базе перед восстановлением. Для реального восстановления заранее согласуйте простой и целевую базу, сделайте свежую копию текущего состояния и не подставляйте production DB в тестовые команды. XLSX-экспорт Research — рабочая выгрузка, а не резервная копия: он не сохраняет схему, сессии и всю структуру PostgreSQL.
