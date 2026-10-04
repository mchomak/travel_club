window.STATE =
{
  "slug": "shanghai-open-call",
  "dir": ".",
  "title": "Travel Club — Shanghai /test_3",
  "mode": "full",
  "depth": "normal",
  "tier": "T0",
  "polish": null,
  "briefFile": "2026-10-04-brief.md",
  "memoryFile": "../README.md",
  "skillDir": "C:\\Users\\McHomak\\.agents\\skills\\autopilot",
  "startedAt": "2026-10-04T16:31:34+03:00",
  "updatedAt": "2026-10-04T17:35:57+03:00",
  "finishedAt": "2026-10-04T17:35:57+03:00",
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-04T16:31:34+03:00",
      "finishedAt": "2026-10-04T16:31:34+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-04T16:31:34+03:00",
      "finishedAt": "2026-10-04T16:31:34+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "note": "полный автомат — самобрифинг"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-04T16:31:34+03:00",
      "finishedAt": "2026-10-04T16:32:06+03:00"
    },
    {
      "id": "plan",
      "status": "skipped",
      "note": "T0 — одна поверхность, без тасков"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-04T16:32:06+03:00",
      "finishedAt": "2026-10-04T17:19:13+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-04T17:19:13+03:00",
      "finishedAt": "2026-10-04T17:28:54+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-04T17:28:54+03:00",
      "finishedAt": "2026-10-04T17:35:57+03:00"
    }
  ],
  "requirements": {
    "total": 54,
    "done": 54,
    "inSpec": 54,
    "inTicket": 0,
    "placeholder": 0,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [],
  "singlePass": {
    "startedAt": "2026-10-04T16:32:06+03:00",
    "finishedAt": "2026-10-04T17:35:57+03:00",
    "status": "done"
  },
  "tests": {
    "unit": "67 passed / 14 files",
    "lint": "passed",
    "typecheck": "passed",
    "build": "passed",
    "dockerFrontendBuild": "passed",
    "production": "http://localhost:3000/test_3"
  },
  "debt": {
    "placeholders": [
      "Stock photography",
      "Price, flights, hotel: provisional",
      "Demo application: no submission"
    ],
    "assumptions": [
      "Scoped workflow records override root-level skill files to respect the user boundary"
    ],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": {
    "found": 2,
    "fixed": 2,
    "deferred": 0
  },
  "concerns": [],
  "reviewers": {
    "manifestSpec": "/root/spec_check",
    "craft": "/root/craft_review",
    "blind": "/root/shanghai_acceptance",
    "memory": "/root/shanghai_memory"
  },
  "blind": {
    "reviewer": "/root/shanghai_acceptance",
    "verdict": "accepted",
    "found": 0,
    "partial": 0,
    "missing": 0,
    "evidence": "blind-acceptance.md",
    "liveRunner": "exit 0",
    "scopeAudit": "root git diff empty; new source/assets only test_3",
    "runtime": "Own Node Chromium at localhost:3000/test_3"
  },
  "reviewVerdict": {
    "craft": "clean",
    "focusFinding": "resolved",
    "formFocus": "resolved",
    "dayNightCoordinates": "resolved"
  },
  "memoryVerdict": {
    "reviewer": "/root/shanghai_memory",
    "file": "../README.md",
    "status": "done"
  }
}
