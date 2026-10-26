window.STATE = {
  "slug": "research-interview-questions",
  "dir": "2026-10-26-research-interview-questions",
  "title": "Обновление вопросов исследования аудитории",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": null,
  "briefFile": "2026-10-26-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-26T23:40:10+03:00",
  "updatedAt": "2026-10-27T00:34:24+03:00",
  "finishedAt": "2026-10-27T00:34:24+03:00",
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-26T23:40:10+03:00",
      "finishedAt": "2026-10-26T23:40:45+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-26T23:40:45+03:00",
      "finishedAt": "2026-10-26T23:41:20+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "startedAt": "2026-10-26T23:41:20+03:00",
      "note": "полный автомат — самобрифинг"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-26T23:46:17+03:00",
      "finishedAt": "2026-10-26T23:55:08.844+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "finishedAt": "2026-10-26T23:55:08.844+03:00"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-26T23:55:08.844+03:00",
      "note": "2 из 2 задач готовы",
      "finishedAt": "2026-10-27T00:27:06.636+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-27T00:10:53.948+03:00",
      "note": "2 из 2 задач проверены",
      "finishedAt": "2026-10-27T00:27:06.636+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-27T00:27:06.636+03:00",
      "finishedAt": "2026-10-27T00:34:24+03:00"
    }
  ],
  "requirements": {
    "total": 4,
    "done": 4,
    "inTicket": 0,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "Обновить банк Research и каталог модулей",
      "requirements": [
        "R01",
        "R02",
        "R03"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "backend/",
        "docs/tc-research/"
      ],
      "status": "done",
      "startedAt": "2026-10-26T23:55:30.610+03:00",
      "finishedAt": "2026-10-27T00:13:39.551+03:00",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "tests": {
        "passed": 42,
        "failed": 0
      },
      "commit": "97bd712",
      "concerns": [
        "Validator does not reject a question referenced by a second module when module_code names another module; current configuration/tests map modules correctly.",
        "No independent full expected fixture checks every imported prompt, follow-up, guidance, and hypothesis link; import was manually compared with DOCX."
      ]
    },
    {
      "id": "02",
      "title": "Показать модули для категории и перезапустить сайт",
      "requirements": [
        "R03",
        "R04"
      ],
      "blockedBy": [
        "01"
      ],
      "wave": 2,
      "zone": [
        "frontend/src/components/research/",
        "frontend/src/lib/",
        "frontend/e2e/"
      ],
      "status": "done",
      "startedAt": "2026-10-27T00:13:39.551+03:00",
      "finishedAt": "2026-10-27T00:27:06.636+03:00",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "repairFindings": [
        "R04 validation: verify the live /api/research/config payload after authentication, including 140 questions and 10 expanded modules."
      ],
      "tests": {
        "passed": 244,
        "failed": 0
      },
      "commit": "475da45",
      "concerns": []
    }
  ],
  "singlePass": null,
  "tests": {
    "passed": 421,
    "failed": 0
  },
  "debt": {
    "placeholders": [],
    "assumptions": [
      "Сохранить четыре текущие категории респондентов: новые 09A-модули описывают темы исследования, но не вводят новые screening-поля или правила классификации.",
      "Сохранить текущие сценарии для уже существующих вопросов; новые модули доступны по категории и добавляются интервьюером отдельно, чтобы не перегружать каждое интервью.",
      "Сохранить снимки вопросов у уже созданных интервью; обновлённый банк применяется к новым интервью и к добавлениям из банка."
    ],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": null,
  "concerns": [
    "Validator does not reject a question referenced by a second module when module_code names another module; current configuration/tests map modules correctly.",
    "No independent full expected fixture checks every imported prompt, follow-up, guidance, and hypothesis link; import was manually compared with DOCX."
  ],
  "reviewers": {
    "manifestSpec": "/root/review_manifest_spec",
    "craft": "/root/review_craft"
  },
  "blind": {
    "matched": 3,
    "checked": 4,
    "mismatches": [
      "R03 частично: все четыре соответствия категорий покрыты компонентными тестами, а авторизованный API и состав банка проверены тестом; живой экран вопросов нельзя было открыть без локальной сессии администратора (localhost /research перенаправляет на вход)."
    ],
    "verdict": "DOCX: 58 новых формулировок вопросов совпали; 10 модулей для четырёх категорий подтверждены тестами. Живой экран после входа отдельно не проверен."
  },
  "concernTriage": {
    "fixNow": [],
    "report": [
      "Validator does not reject a question referenced by a second module when module_code names another module; current configuration/tests map modules correctly.",
      "No independent full expected fixture checks every imported prompt, follow-up, guidance, and hypothesis link; import was manually compared with DOCX."
    ],
    "drop": []
  },
  "finalVerification": {
    "backend": {
      "passed": 177,
      "failed": 0
    },
    "frontend": {
      "passed": 244,
      "failed": 0
    },
    "local": "PostgreSQL/backend healthy, frontend running; GET / returned 200; authenticated Research page requires admin sign-in."
  }
};