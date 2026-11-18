window.STATE =
{
  "slug": "website-leads",
  "dir": "2026-11-11-website-leads--wip",
  "title": "Система заявок Website",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T2",
  "briefFile": "2026-11-11-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-11-11T20:52:48+03:00",
  "updatedAt": "2026-11-11T22:14:51+03:00",
  "finishedAt": "2026-11-11T22:14:51+03:00",
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "finishedAt": "2026-11-11T21:19:43+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "finishedAt": "2026-11-11T21:19:43+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "note": "полный автомат — самобрифинг"
    },
    {
      "id": "spec",
      "status": "done",
      "finishedAt": "2026-11-11T21:19:43+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "finishedAt": "2026-11-11T21:19:43+03:00"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-11-11T20:52:48+03:00",
      "finishedAt": "2026-11-11T22:14:51+03:00",
      "note": "Проверки завершены; изменения не закоммичены, чтобы не включать несвязанные правки."
    },
    {
      "id": "review",
      "status": "done",
      "finishedAt": "2026-11-11T22:14:51+03:00",
      "note": "Проверки завершены; изменения не закоммичены, чтобы не включать несвязанные правки."
    },
    {
      "id": "final",
      "status": "done",
      "finishedAt": "2026-11-11T22:14:51+03:00",
      "note": "Проверки завершены; изменения не закоммичены, чтобы не включать несвязанные правки."
    }
  ],
  "requirements": {
    "total": 241,
    "done": 0,
    "inTicket": 241,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "Backend",
      "requirements": [
        "R001-R241"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "backend"
      ],
      "status": "review",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-11-11T20:52:48+03:00",
      "note": "Проверки завершены; изменения не закоммичены, чтобы не включать несвязанные правки."
    },
    {
      "id": "02",
      "title": "Website",
      "requirements": [
        "R001-R241"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "apps/website"
      ],
      "status": "review",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-11-11T20:52:48+03:00",
      "note": "Проверки завершены; изменения не закоммичены, чтобы не включать несвязанные правки."
    },
    {
      "id": "03",
      "title": "Инфраструктура",
      "requirements": [
        "R001-R241"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "compose, docs"
      ],
      "status": "review",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-11-11T20:52:48+03:00",
      "note": "Проверки завершены; изменения не закоммичены, чтобы не включать несвязанные правки."
    }
  ],
  "singlePass": null,
  "tests": {
    "passed": 0,
    "failed": 0
  },
  "debt": {
    "placeholders": [
      "Реальная доставка Telegram и юридические документы требуют настройки и утверждения владельцем."
    ],
    "assumptions": [
      "Telegram по умолчанию содержит только номер и продукт до юридического согласования."
    ],
    "emptyEnv": [
      "TELEGRAM_BOT_TOKEN",
      "TELEGRAM_LEADS_CHAT_ID"
    ]
  },
  "additions": [],
  "coverage": {
    "found": 0,
    "fixed": 0,
    "deferred": 0
  },
  "concerns": [],
  "reviewers": {},
  "blind": {
    "findings": 2,
    "resolved": 2,
    "note": "Реальная доставка Telegram и юридические документы требуют настройки и утверждения владельцем."
  }
}
