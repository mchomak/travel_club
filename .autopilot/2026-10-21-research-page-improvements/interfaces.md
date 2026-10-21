# Интерфейсы и границы работ

## Границы из спецификации

- Т01 владеет auth redirect, страницей каталога /home и своими frontend-тестами. Не меняет Research UI.
- Т02 владеет списком респондентов, формой создания, screening-полями, Research navigation и общей research.module.css. Экспортирует форматирование возраста и классы CSS для анкеты.
- Т03 владеет моделью/миграцией/эндпоинтами версий анкет и backend-тестами. Не меняет frontend.
- Т04 владеет редактором анкеты, локальным прогрессом, переключателем версий и методами frontend API. Использует контракт ниже и классы CSS, созданные Т02; research.module.css не меняет.
- Т01–Т04 имеют отдельные зоны и могут работать в волне 1. Реальные тесты запускаются после того, как общий checkout содержит все изменения.
- .worktrees/test-12 и .worktrees/test-13 принадлежат другой сессии. Не редактировать, переносить, копировать, собирать и не коммитить их. Ссылки из /home на /test_12 и /test_13 относительные и помечаются как параллельные до объединения этих страниц.

## Контракт версий Research

Все версии создаются только для завершённых интервью. Первая версия создаётся при завершении анкеты. Каждая новая версия неизменяема; номер последовательный в пределах интервью, время хранится в UTC и возвращается в ISO 8601.

GET /api/research/interviews/{interview_id}/versions

    {
      "items": [
        {"id": "uuid", "version_number": 2, "created_at": "2026-10-21T12:30:00Z"}
      ],
      "latest_version_number": 2
    }

GET /api/research/interviews/{interview_id}/versions/{version_id}

    {
      "id": "uuid",
      "interview_id": "uuid",
      "version_number": 2,
      "created_at": "2026-10-21T12:30:00Z",
      "snapshot": {
        "respondent": {
          "id": "uuid",
          "name": "Имя",
          "age_range": "18_22",
          "city": "Москва",
          "screening_answers": {},
          "research_goal": "string",
          "suggested_category": "string",
          "final_category": "string"
        },
        "interview": {
          "id": "uuid",
          "status": "completed",
          "scenario_code": "string",
          "scenario_version": "string",
          "question_snapshot": [],
          "answers": {
            "G01": {"answer_text": "Ответ", "revision": 2, "updated_at": "2026-10-21T12:30:00Z"}
          }
        }
      }
    }

POST /api/research/interviews/{interview_id}/versions

Body:

    {"answers": {"G01": "Ответ", "G02": ""}}

Ответ — созданный объект версии из GET detail. Сервер проверяет завершённый статус и допустимые question codes, атомарно сохраняет текущие ответы и полный snapshot из актуальных данных respondent/interview/questionnaire. Неизвестные коды дают понятную validation-ошибку. Повторный сохранённый текст также создаёт отдельную версию только при явном запросе пользователя.

Любое существующее изменение screening/category respondent-а, у которого есть завершённые интервью, атомарно создаёт новый полный snapshot для каждого такого интервью после изменения. Эти версии сразу становятся актуальными; старые версии остаются доступны для чтения.

GET versions сортирует версии по version_number по убыванию и возвращает максимальный номер как latest_version_number. UI по умолчанию открывает последнюю версию; выбор более старой версии read-only. Незавершённые интервью продолжают использовать существующее autosave без создания версий. После завершения их autosave endpoint не меняет ответы.

## Контракт frontend стилей Research

Т02 экспортирует из research.module.css CSS-module классы answerTextarea (адаптивная высота ответа с min/max и внутренней прокруткой после max) и singleLineSummary (однострочная подпись с визуальным ellipsis). Т04 импортирует и использует их в answer card/selector, не редактируя CSS.

Функция форматирования возраста, созданная Т02, принимает исходное значение строки, заменяет подчёркивания/длинные тире на обычный дефис и добавляет подпись «Возраст» только в display helper. Хранимое значение не меняется. Т04 использует helper для Research detail.

## Проектные правила

- Корень: C:/Users/McHomak/Projects/travel_club. Стек: FastAPI, SQLAlchemy 2, Alembic, PostgreSQL; Next.js 16, React 19, TypeScript, CSS Modules.
- Не добавлять зависимости. Если необходимая зависимость отсутствует, вернуть BLOCKED; не запускать установку пакетов.
- Не менять .env, секреты, AGENTS.md, deployment и чужие worktrees. Не использовать production URL для проверки или записи.
- Финансовый код не затрагивать. Миграция БД обязательна для новой таблицы версий.
- Windows-команды: npm.cmd. Frontend: npm.cmd run lint, npm.cmd run typecheck, npm.cmd test -- --run --testTimeout=15000, npm.cmd run build; точечный Vitest: npm.cmd test -- src/path/file.test.tsx.
- Backend: docker compose exec -T backend pytest -q; Ruff: docker compose exec -T backend ruff check .. Не собирать Compose параллельно.
- Доступ к локальному .git только на чтение. Не пытаться менять refs локально; commit/push оформляет оркестратор через отдельную remote branch после проверки.
- Сохранять каждую анкету и версии в одной транзакции; старые snapshots нельзя редактировать.


## Реализовано по Т01 — авторизация и каталог

- safeAuthReturnTarget(unknown): string lives in frontend/src/lib/return-target.ts; it accepts only safe same-origin path/query and falls back to /home.
- Proxy forwards a validated requested route through x-travel-club-return-to; protected route coverage currently includes /home, /admin/trips, /admin/account, and /research.
- LoginForm({ next? }) keeps the incoming destination through login; /admin/login supplies the target from the validated request.
- /home is server-protected and provides grouped project page links with brief descriptions, including /admin/login. Parallel routes remain links marked as such.
- T01 adds tests for safe target parsing, proxy request handling, login destination, protected catalog access, and catalog content.


## Реализовано по Т02 — Research list/screening
- frontend/src/components/research/age-range.ts exports formatAgeRange(value: string) and formatAgeLabel(value: string | null | undefined); display formatting normalizes legacy separators and adds the Russian «Возраст» label.
- research.module.css exports answerTextarea and singleLineSummary for the interview editor.
- City suggestions are available on residence/departure inputs while allowing custom text; organizer answers use preset choices and retain legacy/custom values.
- Research list supports whole-row activation and keyboard access, aligned toolbar/pagination, home navigation, and one-line summaries.
## Дополнение T05/T06 — доступность строки и фильтров

- Строка desktop-таблицы респондентов остаётся `<tr>`: `tabIndex={0}`, Enter и Space открывают карточку; вложенная ссылка имени сохраняет обычную навигацию и останавливает всплытие клика.
- Панель фильтров — `section` с доступным именем «Поиск и фильтры». Заголовки имеют общий минимальный рост и `white-space: nowrap`; desktop controls выровнены общей сеткой, на ширине до 600 px сетка становится одноколоночной.
- `frontend/e2e/research-filter-alignment.spec.ts` измеряет высоту заголовков, зазор до контрола и отсутствие горизонтального overflow на desktop и 390 px. Сценарий пока не утверждает отдельно, что узкий layout строго одноколоночный; ручная браузерная приёмка проверила вертикальное расположение.
- Заголовки `<details>` сохраняют нативную клавиатурную семантику; текстовый span с `singleLineSummary` обрезает длинный заголовок в одну строку с ellipsis, не меняя полный текст в DOM.

## Дополнение T07 — актуальный прогресс и проверка сценариев

- `AnswerCard.onAnswerChange(code, value)` сообщает текст в родительский `RespondentDetail`; прогресс вычисляет количество непустых ответов из локального актуального текста и server snapshot как fallback. После blur/autosave значение остаётся учтённым, после очистки немедленно исключается.
- `frontend/e2e/research.spec.ts` ожидает `/home` при прямом входе без return target и затем явно открывает Research. Для завершённого интервью тест нажимает «Сохранить», проверяет новую версию, открытие последней по умолчанию и read-only старой версии.
- Regression прогресса проверяет доступные `aria-valuenow` после blur и очистки; полоса также проверяется после этих переходов. Результат: весь Research E2E — 3 passed; геометрия фильтров — 1 passed.
