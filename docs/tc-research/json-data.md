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

## Маршруты интервью и сверка с исходным DOCX

В `scenarios.json` скрининг (`screening_question_codes`) отделён от базового порядка интервью (`question_codes`). Скрининг проводится до беседы и не должен добавляться в основной список вопросов. `docx_route_codes` фиксирует маршрут DOCX, включая коды скрининга и явно указанные условные вопросы X.

### Скрининг

- `trips_experienced` и `trips_beginner`: `S01–S05`.
- `travel_design` и `travel_ready`: `S01–S06`.

### Базовый порядок интервью

Порядок ниже следует таблице маршрутов в §12.1 `../research/source/Travel_Club_CustDev.docx`. При расхождении с исходными предоставленными массивами используется DOCX; именно этот базовый порядок хранится в `question_codes`.

- **Trips / опытный** — `G01, G02, G05, G06, G07, G10, T01, T03, T04, T07, T10, T14`. Базовый список совпадает с предоставленным.
- **Trips / начинающий** — `G01, G04, G05, G06, G10, G12, T02, T05, T06, T08, T14, T15`. DOCX добавляет `G10` и `G12`.
- **Travel Design** — `G01, G04, G07, G08, G10, D01, D02, D04, D05, D07, D08`. DOCX добавляет `G08` и `G10`.
- **Travel Ready** — `G01, G04, G07, G10, R01, R02, R03, R05, R06, R12`. DOCX добавляет `G10`.

`docx_route_comparison` в JSON сохраняет эти различия с предоставленными списками.

### Условные вопросы X

В DOCX для **Travel Design** указан условный `X06`, для **Travel Ready** — `X07` и `X08`. Они указаны отдельно в `conditional_docx_questions` и не входят в базовые `question_codes`. Их можно предлагать только после появления реальных цен и условий: `offers.enabled` сейчас равен `false`, поэтому X-вопросы недоступны в обычном потоке. Для Trips / опытного DOCX также содержит общее примечание «X при готовности», но не называет код; сценарий JSON не назначает этому маршруту конкретный X-код.

### Необязательный модуль B

Модуль бренда содержит вопросы `B01–B12` и по выбору интервьюера добавляется в конец основного маршрута. Это дополнительный блок, а не пятая категория. Пример общего маршрута TC / экосистемы из DOCX: `G01, G05, G09, G10, B01, B02, B03, B05, B07, B08`; это выбранная часть банка, а не отдельный основной сценарий.
