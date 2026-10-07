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
  "updatedAt": "2026-10-07T00:08:23+03:00",
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
      "startedAt": "2026-10-07T00:08:23+03:00"
    },
    {
      "id": "review",
      "status": "pending"
    },
    {
      "id": "final",
      "status": "pending"
    }
  ],
  "requirements": {
    "total": 50,
    "done": 0,
    "inTicket": 50,
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
      "status": "in-progress",
      "startedAt": "2026-10-07T00:08:23+03:00",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
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
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
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
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    }
  ],
  "singlePass": null,
  "tests": null,
  "debt": {
    "placeholders": [],
    "assumptions": [],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": {
    "found": 0,
    "fixed": 0,
    "deferred": 0,
    "note": "G2: все требования покрыты; дополнительные детали — R.n реализации и проверки"
  },
  "concerns": [],
  "reviewers": {
    "manifestSpec": "/root/spec_coverage",
    "craft": null
  },
  "blind": null
}
