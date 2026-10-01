window.STATE = {
  "slug": "home-palette-presets",
  "dir": "2026-10-01-home-palette-presets",
  "title": "Пресеты и сохранение палитр главной страницы",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T0",
  "briefFile": "2026-10-01-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-01T22:55:14+03:00",
  "updatedAt": "2026-10-02T01:10:46+03:00",
  "finishedAt": "2026-10-02T01:10:46+03:00",
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-01T22:55:14+03:00",
      "finishedAt": "2026-10-01T23:01:08+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-01T23:01:08+03:00",
      "finishedAt": "2026-10-01T23:11:43+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "note": "полный автомат — самобрифинг; вопросов не потребовалось"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-01T23:11:43+03:00",
      "finishedAt": "2026-10-01T23:48:00+03:00"
    },
    {
      "id": "plan",
      "status": "skipped",
      "startedAt": "2026-10-01T23:48:00+03:00",
      "note": "T0: no ticket split"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-02T00:00:06+03:00",
      "finishedAt": "2026-10-02T01:09:25+03:00",
      "note": "lint, typecheck, frontend Docker production build passed; updated container returned HTTP 200; backend and PostgreSQL healthy; test suites not run."
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-02T01:04:00+03:00",
      "finishedAt": "2026-10-02T01:09:25+03:00",
      "note": "T0 inline manifest/spec/craft review complete; in-scope requirements delivered; shared-file persistence remains the documented deferred requirement."
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-02T01:09:25+03:00",
      "finishedAt": "2026-10-02T01:10:46+03:00",
      "note": "G4 confirmed 5 of 6 user-flow points; only shared JSON-file persistence is partial and documented as deferred. Frontend container rebuilt, recreated, and returned HTTP 200."
    }
  ],
  "requirements": {
    "total": 8,
    "done": 7,
    "inTicket": 0,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 1,
    "dropped": 0
  },
  "tickets": [],
  "singlePass": {
    "startedAt": "2026-10-02T00:00:06+03:00",
    "finishedAt": "2026-10-02T01:09:25+03:00",
    "files": [
      "frontend/src/components/public-home/home-experience.tsx",
      "frontend/src/components/public-home/home.css",
      "frontend/src/components/public-home/theme.ts",
      "frontend/src/components/public-home/presets/recommended.json",
      "AGENTS.md"
    ],
    "tests": {
      "passed": 0,
      "failed": 0,
      "note": "not run"
    },
    "commit": "feat: add named homepage palette presets"
  },
  "tests": {
    "passed": 0,
    "failed": 0,
    "note": "Test suites not run for this task.",
    "lint": "passed",
    "typecheck": "passed",
    "build": "passed",
    "docker": "frontend rebuilt and recreated; HTTP 200; backend/PostgreSQL healthy"
  },
  "debt": {
    "placeholders": [],
    "assumptions": [
      "Пользовательские пресеты сохраняются локально в localStorage текущего браузера; каталог рекомендаций поставляется в JSON-файле."
    ],
    "emptyEnv": []
  },
  "additions": [
    "A01: удаление пользовательского пресета с подтверждением, привязано к R03."
  ],
  "coverage": {
    "found": 1,
    "fixed": 0,
    "deferred": 1,
    "note": "G2: R06 shared-file saving deferred; browser JSON storage documented in spec; no other mismatches."
  },
  "concerns": [],
  "reviewers": {
    "manifestSpec": null,
    "craft": null
  },
  "blind": {
    "matched": 5,
    "checked": 6,
    "mismatches": [
      "Shared JSON file persistence is partial: saved presets are stored only in this browser localStorage."
    ]
  }
};
