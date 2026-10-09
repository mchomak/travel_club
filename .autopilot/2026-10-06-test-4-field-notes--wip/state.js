window.STATE =
{
  "slug": "test-4-field-notes",
  "dir": "2026-10-06-test-4-field-notes--wip",
  "title": "Travel Club /test_4 — Field Notes и редактор фото",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T1",
  "briefFile": "2026-10-06-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-06T23:16:49+03:00",
  "updatedAt": "2026-10-07T15:46:15+03:00",
  "finishedAt": null,
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-06T23:16:49+03:00",
      "finishedAt": "2026-10-07T00:00:40+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-07T00:00:40+03:00",
      "finishedAt": "2026-10-07T00:00:40+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "note": "полный автомат — самобрифинг"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-07T00:00:40+03:00",
      "finishedAt": "2026-10-07T00:08:23+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "startedAt": "2026-10-07T00:08:23+03:00",
      "finishedAt": "2026-10-07T00:08:23+03:00",
      "note": "3 таска, 2 волны"
    },
    {
      "id": "build",
      "status": "active",
      "startedAt": "2026-10-07T00:08:23+03:00",
      "note": "Свежие lint/typecheck/Vitest 67/build прошли; frontend Docker обновляется для runtime QA"
    },
    {
      "id": "review",
      "status": "active",
      "startedAt": "2026-10-07T06:54:19+03:00",
      "note": "Manifest/Spec и Craft clean по T02/T03 и последним правкам; ожидается production browser verification"
    },
    {
      "id": "final",
      "status": "pending"
    }
  ],
  "requirements": {
    "total": 50,
    "done": 6,
    "inTicket": 44,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "Безопасная копия и исходные снимки",
      "requirements": [
        "R01",
        "R02",
        "R03",
        "R04",
        "R05",
        "R06"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "test_4 initial copy",
        "qa baseline"
      ],
      "status": "done",
      "startedAt": "2026-10-07T00:08:23+03:00",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "finishedAt": "2026-10-07T06:54:19+03:00",
      "commit": "7fe6cb6",
      "tests": {
        "passed": 67,
        "failed": 0
      }
    },
    {
      "id": "02",
      "title": "FIELD NOTES и новые развороты",
      "requirements": [
        "R07",
        "R08",
        "R09",
        "R10",
        "R11",
        "R12",
        "R13",
        "R14",
        "R15",
        "R16",
        "R17",
        "R18",
        "R19",
        "R20",
        "R21",
        "R22",
        "R23",
        "R24",
        "R25",
        "R26",
        "R27",
        "R28",
        "R29",
        "R30",
        "R31",
        "R32",
        "R33",
        "R34",
        "R44",
        "R45",
        "R46",
        "R47",
        "R50"
      ],
      "blockedBy": [
        "01"
      ],
      "wave": 2,
      "zone": [
        "test_4 copied content",
        "photo-slots",
        "public/test_4"
      ],
      "status": "review",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "startedAt": "2026-10-07T06:54:19+03:00",
      "tests": {
        "passed": 68,
        "failed": 0
      },
      "files": [
        "frontend/src/app/test_4",
        "frontend/src/components/test_4 content",
        "frontend/public/test_4",
        "frontend/e2e/test-4-editorial.spec.ts"
      ],
      "repairFindings": [
        "NEXT ISSUE CTA должен сохранять прежний выборgroup: callback восстановлен, publicscenario ждёт productionendpoint"
      ]
    },
    {
      "id": "03",
      "title": "Редактор фото с локальным сохранением",
      "requirements": [
        "R33",
        "R34",
        "R35",
        "R36",
        "R37",
        "R38",
        "R39",
        "R40",
        "R41",
        "R42",
        "R43",
        "R44",
        "R48",
        "R49"
      ],
      "blockedBy": [
        "01"
      ],
      "wave": 2,
      "zone": [
        "test_4 editor",
        "package/lock",
        "e2e editor"
      ],
      "status": "review",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "startedAt": "2026-10-07T06:54:19+03:00",
      "tests": {
        "passed": 71,
        "failed": 0
      },
      "repairFindings": [
        "Послеunmount savecompletion не создаётBlobURL",
        "Public pixelassert должен отличать сдвинутыйcrop отцентрированного"
      ]
    }
  ],
  "singlePass": null,
  "tests": {
    "passed": 67,
    "failed": 0,
    "lint": "passed",
    "typecheck": "passed",
    "build": "passed",
    "browser": "production verification pending"
  },
  "debt": {
    "placeholders": [],
    "assumptions": [
      "Временные stock images иллюстрируют места, не изображают реальных участников",
      "Существующая форма остаётся демонстрационной",
      "Фото сохраняются только в браузере и origin пользователя"
    ],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": {
    "found": 0,
    "fixed": 0,
    "deferred": 0,
    "note": "G2: все требования покрыты; дополнительные детали — R.n реализации и проверки"
  },
  "concerns": [
    "D01: T02/T03 сохраняются одним рабочим integration checkpoint из-за взаимного контракта registry/editor; user scope unchanged"
  ],
  "reviewers": {
    "manifestSpec": "/root/spec_coverage",
    "craft": "/root/craft_final"
  },
  "blind": null
}
