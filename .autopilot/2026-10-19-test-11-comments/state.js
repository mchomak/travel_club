window.STATE =
{
  "tier": "T1",
  "reviewers": {
    "craft": "/root/craft",
    "manifestSpec": "/root/coverage"
  },
  "depth": "normal",
  "startedAt": "2026-10-19T22:33:32.5250751+03:00",
  "briefFile": "2026-10-19-brief.md",
  "finishedAt": "2026-10-19T23:57:32.2122702+03:00",
  "mode": "full",
  "memoryFile": "AGENTS.md",
  "tickets": [
    {
      "title": "Новые фотографии",
      "status": "done",
      "id": "01",
      "zone": [
        "frontend/public/test_11/"
      ],
      "blockedBy": [],
      "wave": 1,
      "startedAt": "2026-10-19T22:34:05.210305+03:00",
      "finishedAt": "2026-10-19T23:46:21.232075+03:00",
      "commit": "ffb3d2b"
    },
    {
      "title": "Композиция и тексты",
      "status": "done",
      "id": "02",
      "zone": [
        "frontend/src/components/test_11/",
        "frontend/e2e/test-11-comments.spec.ts"
      ],
      "blockedBy": [],
      "wave": 1,
      "startedAt": "2026-10-19T22:35:05.5708725+03:00",
      "finishedAt": "2026-10-19T23:46:21.232075+03:00",
      "commit": "ee89ed3"
    },
    {
      "startedAt": "2026-10-19T22:43:44.1506554+03:00",
      "blockedBy": [],
      "id": "03",
      "zone": [
        "frontend/src/components/test_11/reading-turn.tsx",
        "frontend/e2e/test-11-handoff.spec.ts"
      ],
      "status": "done",
      "wave": 1,
      "title": "Конечное листание при зависшем фото",
      "finishedAt": "2026-10-19T23:46:21.232075+03:00",
      "commit": "058145d"
    }
  ],
  "requirements": {
    "done": 19,
    "inSpec": 0,
    "inTicket": 0,
    "placeholder": 0,
    "total": 19,
    "dropped": 0,
    "deferred": 0
  },
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "finishedAt": "2026-10-19T22:34:05.210305+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "finishedAt": "2026-10-19T22:34:05.210305+03:00"
    },
    {
      "status": "skipped",
      "note": "Полный автомат — самобрифинг",
      "id": "briefing"
    },
    {
      "status": "done",
      "startedAt": "2026-10-19T22:33:32.5250751+03:00",
      "id": "spec",
      "finishedAt": "2026-10-19T22:34:05.210305+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "startedAt": "2026-10-19T22:34:05.210305+03:00",
      "finishedAt": "2026-10-19T22:34:05.210305+03:00"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-19T22:34:05.210305+03:00",
      "finishedAt": "2026-10-19T23:46:21.232075+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-19T22:41:34.8661362+03:00",
      "finishedAt": "2026-10-19T23:46:21.232075+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-19T23:46:21.232075+03:00",
      "finishedAt": "2026-10-19T23:57:32.2122702+03:00"
    }
  ],
  "dir": "2026-10-19-test-11-comments",
  "slug": "test-11-comments",
  "title": "Правки редакционного журнала",
  "concerns": [],
  "debt": {
    "emptyEnv": [],
    "placeholders": [],
    "assumptions": [
      "Сохраняем прототип /start и текущие цены",
      "Изолированные инструменты: общий dashboard занят Research",
      "Фотопоиск и композиция параллельны: заранее фиксированные asset names, disjoint zones, без общего кода."
    ]
  },
  "coverage": {
    "deferred": 0,
    "found": 1,
    "fixed": 1
  },
  "tests": {
    "passed": 119,
    "failed": 0,
    "files": 26,
    "lint": "passed",
    "typecheck": "passed",
    "build": "passed",
    "browser": {
      "initialLegacyTimeouts": "page.goto load; optimizer request. Final legacy retry17/17.",
      "legacyRecoveryPassed": 17,
      "primaryPassed": 47,
      "matrixPassed": 16,
      "finalGeometryPassed": 3
    },
    "deployment": "frontend healthy, final image rebuilt"
  },
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "updatedAt": "2026-10-19T23:57:32.2122702+03:00",
  "blind": {
    "comments": 9,
    "implemented": 9,
    "verdict": "PASS",
    "note": "Независимая приёмка на production, 1314/1280/390; все9 выполнены. Пересечение цены стрелкой исправлено и проверено3/3.",
    "drift": 0
  }
}
