# Манифест требований

Источник: исходный запрос от 2026-10-19 и `2026-10-19-brief.md`. Все требования активны; отменённых нет.

| ID | Цитата из задачи | Статус | Решение / основание | Где |
|---|---|---|---|---|
| R01 | «отдельное небольшое веб-приложение TC Research» | done | Решение по spec §1–2; ticket 03 | tickets/03-interview-ui.md |
| R02 | «внутренний исследовательский инструмент, не публичный сайт для клиентов» | done | Решение по spec §1–2; ticket 03 | tickets/03-interview-ui.md |
| R03 | «Не вмешивайся в основную работу публичного сайта Travel Club» | done | Решение по spec §1–2; ticket 03 | tickets/03-interview-ui.md |
| R04 | «используй существующий стек, принципы подключения к БД, миграций, конфигурации и деплоя» | done | Решение по spec §1–2; ticket 03 | tickets/03-interview-ui.md |
| R05 | «PostgreSQL для постоянного хранения данных» | done | Решение по spec §1–2; ticket 02 | tickets/02-postgres-api-export.md |
| R06 | «Работа через браузер на собственном домене или поддомене»; поддомен настраивается без жёстко заданного домена | placeholder | placeholder: research.<домен> и HTTPS runbook готовы; реальный домен/DNS/VPS не предоставлены, deployment не выполнялся. | tickets/02-postgres-api-export+04-operations-and-backup.md |
| R07 | «Возможность запуска локально и развёртывания на VPS» | done | Решение по spec §1–2; ticket 04 | tickets/04-operations-and-backup.md |
| R08 | «Никакой зависимости от внешних ИИ-сервисов» | done | Решение по spec §1–2; ticket 01 | tickets/01-bank-and-rules.md |
| R09 | «три основных этапа» — анкета, интервью, результаты | done | Решение по spec §1–2; ticket 03 | tickets/03-interview-ui.md |
| R10 | «Имя респондента или псевдоним» | done | Решение по spec §2; ticket 03 | tickets/03-interview-ui.md |
| R11 | «Возраст или возрастная категория» | done | Решение по spec §2; ticket 03 | tickets/03-interview-ui.md |
| R12 | «Город проживания» | done | Решение по spec §2; ticket 03 | tickets/03-interview-ui.md |
| R13 | «Количество самостоятельных зарубежных путешествий за последние два года» | done | Решение по spec §2; ticket 01, 03 | tickets/01-bank-and-rules+03-interview-ui.md |
| R14 | «Опыт участия в организованных групповых путешествиях» | done | Решение по spec §2; ticket 01, 03 | tickets/01-bank-and-rules+03-interview-ui.md |
| R15 | «Наличие конкретных планов путешествий в ближайшие месяцы» | done | Решение по spec §2; ticket 01, 03 | tickets/01-bank-and-rules+03-interview-ui.md |
| R16 | «Пользовался ли платными услугами планирования или организации поездок» | done | Решение по spec §2; ticket 01, 03 | tickets/01-bank-and-rules+03-interview-ui.md |
| R17 | «Как обычно организует путешествия» и «Какая часть подготовки поездки вызывает наибольшие трудности» | done | Решение по spec §2; ticket 01, 03 | tickets/01-bank-and-rules+03-interview-ui.md |
| R18 | «radio buttons или select»; вопросы и варианты должны храниться в JSON без изменений frontend | done | Решение по spec §2; ticket 01, 03 | tickets/01-bank-and-rules+03-interview-ui.md |
| R19 | Варианты «Другое» и «Затрудняюсь ответить» там, где уместно | done | Решение по spec §2; ticket 01, 03 | tickets/01-bank-and-rules+03-interview-ui.md |
| R20 | Не спрашивать контактные, паспортные или ненужные персональные данные | done | Решение по spec §2; ticket 01, 03 | tickets/01-bank-and-rules+03-interview-ui.md |
| R21 | Сохранить анкету в PostgreSQL и создать респондента до перехода | done | Решение по spec §2; ticket 02 | tickets/02-postgres-api-export.md |
| R22 | Рекомендуемые категории `trips_experienced`, `trips_beginner`, `travel_design`, `travel_ready` | done | Решение по spec §4; ticket 01, 02 | tickets/01-bank-and-rules+02-postgres-api-export.md |
| R23 | «прозрачные правила, а не через ИИ»; правила в конфигурации | done | ASSUMPTION: начальные баллы/порог — редактируемые стартовые значения, не валидированная типология.; ticket 01, 02 | tickets/01-bank-and-rules+02-postgres-api-export.md |
| R24 | «основной и альтернативный» сценарии; цель Trips или individual services | done | Решение по spec §4; ticket 01, 02 | tickets/01-bank-and-rules+02-postgres-api-export.md |
| R25 | Разрешить ручной выбор и сохранить suggested, final и факт override | done | Решение по spec §4; ticket 01, 02 | tickets/01-bank-and-rules+02-postgres-api-export.md |
| R26 | Показать имя/возраст/город/опыт/сценарий и объяснение рекомендации | done | Решение по spec §4; ticket 01, 02 | tickets/01-bank-and-rules+02-postgres-api-export.md |
| R27 | Сохранять введённые ответы анкеты S02 (город отправления) и S03 (организатор последней поездки) | done | G4 выявил, что эти значения не сохранялись; ticket 06 добавил сохранение и labels в JSON, API и Excel export. | tickets/06-screening-source-fidelity.md |
| R28 | Банк S01–S06, G01–G12, T01–T16, D01–D12, R01–R12, B01–B12, X01–X12 | done | Решение по spec §3–5; ticket 01 | tickets/01-bank-and-rules.md |
| R29 | Гипотезы H01–H17; поля question code/section/text/type/options/follow_ups/hypothesis_ids/interpretation | done | Решение по spec §3–5; ticket 01 | tickets/01-bank-and-rules.md |
| R30 | Раздельные JSON банка и сценариев; проверить уникальность и ссылки кодов | done | Решение по spec §3–5; ticket 01 | tickets/01-bank-and-rules.md |
| R31 | Сверить маршруты с DOCX; при расхождении первичен DOCX и различия описать | done | ASSUMPTION: DOCX первичен; условные X не входят в base-маршруты.; ticket 01 | tickets/01-bank-and-rules.md |
| R32 | Не выдумывать недостающее; если перенос неполон, обеспечить импорт и обозначить пробелы | done | Решение по spec §3–5; ticket 01 | tickets/01-bank-and-rules.md |
| R33 | Порядок Trips/опытный из запроса: G01,G02,G05,G06,G07,G10,T01,T03,T04,T07,T10,T14 | done | Решение по spec §3–5; ticket 01 | tickets/01-bank-and-rules.md |
| R34 | Порядок Trips/начинающий из запроса: G01,G04,G05,G06,T02,T05,T06,T08,T14,T15 | done | Решение по spec §3–5; ticket 01 | tickets/01-bank-and-rules.md |
| R35 | Порядок Design из запроса: G01,G04,G07,D01,D02,D04,D05,D07,D08 | done | Решение по spec §3–5; ticket 01 | tickets/01-bank-and-rules.md |
| R36 | Порядок Ready из запроса: G01,G04,G07,R01,R02,R03,R05,R06,R12 | done | Решение по spec §3–5; ticket 01 | tickets/01-bank-and-rules.md |
| R37 | Можно вручную добавить вопросы; B в конце по выбору; X выключен до реальных цен/условий | done | Решение по spec §3–5; ticket 01 | tickets/01-bank-and-rules.md |
| R38 | Шапка профиля, раскрываемые screening-ответы и статус интервью | done | Решение по spec §2, 7; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R39 | Вопросы идут в порядке сценария отдельными блоками с textarea и отображаемым кодом | done | Решение по spec §2, 7; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R40 | Подсказки интервьюеру по умолчанию свёрнуты: уточнения, гипотезы, интерпретация | done | Решение по spec §2, 7; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R41 | Навигация к вопросу, пустые ответы разрешены, дальнейшее редактирование и прогресс | done | Решение по spec §2, 7; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R42 | «Автосохранение через небольшой debounce» и «сохранение при потере фокуса» | done | Решение по spec §2, 7; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R43 | «Сохранено» показывать только после подтверждения PostgreSQL | done | Решение по spec §2, 7; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R44 | Сбой сети не очищает текст; локальный черновик и повтор после восстановления | done | Решение по spec §2, 7; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R45 | Предупреждать о выходе с несохранённым; после открытия загружать ответы | done | Решение по spec §2, 7; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R46 | Повторы без дубликатов; stale request не перезаписывает более новый ответ | done | Решение по spec §2, 7; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R47 | Запись респондента существует до начала интервью; статусы draft/in_progress/completed | done | Решение по spec §2, 7; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R48 | Завершение требует указанного подтверждения, сохраняет последние изменения и сообщает о сбое | done | Решение по spec §2, 7; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R49 | Пустые ответы не блокируют завершение; записать completed и время завершения | done | Решение по spec §2, 7; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R50 | Поздние изменения completed-интервью не меняют статус, но обновляют updated_at | done | Решение по spec §2, 7; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R51 | Список: таблица, имя-поиск, фильтр категории/статуса, сортировка дат, создание, счётчики и карточка | done | Решение по spec §2; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R52 | Работать с десятками и сотнями респондентов | done | Решение по spec §2; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R53 | Карточка содержит основную информацию, всю анкету и интервью со всеми ответами | done | Решение по spec §2; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R54 | Изменение анкеты предлагает пересчитать рекомендацию, но не меняет начатый сценарий/ответы | done | Решение по spec §2; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R55 | Таблицы PostgreSQL имеют префикс `research_`; данные respondents/interviews/answers и версии | done | Решение по spec §6–7; ticket 02 | tickets/02-postgres-api-export.md |
| R56 | Миграции, FK, индексы, транзакции, безопасные ошибки, unique interview_id + question_code | done | Решение по spec §6–7; ticket 02 | tickets/02-postgres-api-export.md |
| R57 | Snapshot вопросов сохраняет старую формулировку; новое интервью берёт актуальный JSON | done | Решение по spec §6–7; ticket 02 | tickets/02-postgres-api-export.md |
| R58 | Экспорт `.xlsx` всей базы, независимо от фильтров, на пять указанных листов | done | Решение по spec §8–9; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R59 | Answers: одна строка на каждый включённый вопрос, даже пустой, с данными и hypothesis IDs | done | Решение по spec §8–9; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R60 | Русский и многострочный текст; длинные ответы не обрезать; формулы не исполнять; имя файла датированное | done | Решение по spec §8–9; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R61 | Инструкция `pg_dump`/`pg_restore` | done | Решение по spec §8–9; ticket 04 | tickets/04-operations-and-backup.md |
| R62 | Минималистичный адаптивный светлый дизайн, белые карточки, тёмный текст, глубокий синий акцент | placeholder | placeholder: компоненты и responsive layout реализованы, 320/390 px проверены; blind-приёмка отдельно не оценивала визуальную полировку. | tickets/03-interview-ui.md |
| R63 | Защитить данные/экспорт простой общей авторизацией; HTTPS; секреты не в репозитории | placeholder | placeholder: admin API без сессии отвечает 401, HTTPS-конфигурация готова; live-сертификат и домен не проверены. | tickets/02-postgres-api-export+04-operations-and-backup.md |
| R64 | Не добавлять регистрацию, сложные роли, AI, транскрипцию, Telegram, email, публичные формы, оплату, CRM, тяжёлые dashboard/dependencies | done | Решение по spec §10–11; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R65 | Не собирать лишние данные и не реализовывать загрузку аудио | done | Решение по spec §10–11; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R66 | Проверить все 18 сценариев из §18 исходной задачи | done | Решение по spec §10–11; ticket 02, 03 | tickets/02-postgres-api-export+03-interview-ui.md |
| R67 | Выполнить критерии приёмки §20 и дать инструкции запуска/VPS/JSON/backups | done | Решение по spec §10–11; ticket 04 | tickets/04-operations-and-backup.md |


## Самобрифинг — полный автомат

- ASSUMPTION: существующая admin-сессия подходит двум основателям и защищает страницу, API и экспорт.
- ASSUMPTION: приложение доступно как `/research`; DNS и сертификат настраивает владелец VPS.
- ASSUMPTION: DOCX имеет приоритет порядка; предложенные пользователем дополнительные вопросы включаются, X остаётся выключен.
- ASSUMPTION: пороги/баллы классификации — стартовые и легко меняются в JSON.
- PLACEHOLDER: фактический `RESEARCH_ORIGIN` не предоставлен; переменная и generic инструкция будут подготовлены.
