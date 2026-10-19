# Обновление банка вопросов и сценариев

Исходные данные лежат в `backend/app/research_data/`:

- `questions.json` — 82 вопроса, 17 гипотез и `bank_version`;
- `scenarios.json` — сценарии, коды вопросов, версия `version` и связанный `bank_version`;
- `screening.json` — поля первичного опроса и `version`;
- `classification.json` — правила рекомендации и `version`.

Редактируйте JSON в рабочей ветке репозитория. При изменении формулировок или состава банка повысьте `bank_version` в `questions.json` и соответствующее поле в `scenarios.json`. При изменении сценариев повысьте `scenarios.json` `version`; при изменении screening или правил рекомендации обновите версию соответствующего файла. Сохраните изменения в Git вместе с версиями.

Проверьте комплект на собранном backend-образе до перезапуска:

```powershell
docker compose build backend
docker compose run --rm --no-deps backend python -m app.research_bank validate
```

Команда должна завершиться с кодом 0 и вывести число вопросов, гипотез и сценариев. Если проверка прошла, обновите только локальный backend:

```powershell
docker compose up -d --no-deps backend
docker compose ps backend
```

В deployment Compose исходники не монтируются: JSON попадает в backend image при сборке. Для выпуска обновлённого банка соберите и проверьте Linux-образ из корня репозитория на рабочей машине:

```powershell
docker buildx build --platform linux/amd64 --tag travel-club-backend:preview --build-context shared=./shared --load ./backend
docker run --rm --entrypoint python travel-club-backend:preview -m app.research_bank validate
docker save --output "$env:TEMP\travel-club-backend-amd64.tar" travel-club-backend:preview
```

Передайте tar-файл в `/tmp/travel-club-backend-amd64.tar` на VPS согласованным способом, загрузите его и пересоздайте только backend:

```bash
docker load --input /tmp/travel-club-backend-amd64.tar
docker compose -p travel_club -f compose.deploy.yaml up -d --no-deps backend
docker compose -p travel_club -f compose.deploy.yaml ps backend
```

Не редактируйте JSON внутри работающего контейнера и не кладите image tar в репозиторий. У существующих интервью сохранены снимок текста вопросов, `bank_version` и `scenario_version`; новый JSON применяется к новым интервью и не переписывает старые ответы или snapshots.
