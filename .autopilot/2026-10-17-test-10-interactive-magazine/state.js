window.STATE =
{
  "slug": "test-10-interactive-magazine",
  "dir": "2026-10-17-test-10-interactive-magazine",
  "title": "Travel Club — /test_10 Magazine",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T1",
  "briefFile": "2026-10-17-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-17T21:53:21+03:00",
  "updatedAt": "2026-10-18T01:40:45+03:00",
  "finishedAt": "2026-10-18T01:40:45+03:00",
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-17T21:53:21+03:00",
      "finishedAt": "2026-10-17T22:00:54.113902+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-17T21:53:21+03:00",
      "finishedAt": "2026-10-17T22:00:54.113902+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "startedAt": "2026-10-17T21:53:21+03:00",
      "note": "full: self-briefing, no questions required"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-17T21:53:21+03:00",
      "finishedAt": "2026-10-17T22:00:54.113902+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "startedAt": "2026-10-17T22:00:35.365659+03:00",
      "finishedAt": "2026-10-17T22:00:54.113902+03:00"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-17T22:00:54.113902+03:00",
      "finishedAt": "2026-10-18T01:39:34+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-17T22:38:45+03:00",
      "finishedAt": "2026-10-18T01:39:34+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-18T01:39:34+03:00",
      "finishedAt": "2026-10-18T01:40:45+03:00",
      "note": "Independent G4 passed; all35 requirements delivered; final119unit/23browser/24visual cases passed."
    }
  ],
  "requirements": {
    "total": 35,
    "done": 35,
    "inTicket": 0,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "Журнал: вступление, геометрия и управление",
      "requirements": [
        "R01",
        "R02",
        "R03",
        "R05",
        "R06",
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
        "R31",
        "R32",
        "R33",
        "R34",
        "R35"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "shell"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-17T22:00:54.113902+03:00",
      "tests": {
        "unit": 119,
        "production-e2e": 23,
        "lint": "passed",
        "typecheck": "passed",
        "build": "passed",
        "docker": "healthy",
        "viewport-cases": 24
      },
      "finishedAt": "2026-10-18T01:40:32+03:00",
      "commit": "e37297c"
    },
    {
      "id": "02",
      "title": "Три редакционных разворота и фотоподборка",
      "requirements": [
        "R04",
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
        "R30"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "spreads"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-17T22:00:54.113902+03:00",
      "tests": {
        "unit": 119,
        "lint": "passed",
        "typecheck": "passed",
        "visual-cases": 6,
        "review": "manifest/spec/craft clean"
      },
      "finishedAt": "2026-10-18T01:16:41+03:00",
      "commit": "226c23e"
    }
  ],
  "debt": {
    "placeholders": [],
    "assumptions": [
      "NEXT ISSUE has no confirmed destination/date/price; BUILDING state.",
      "New stock photos explicitly illustrative.",
      "No Thailand detail route; archive link with notice."
    ],
    "emptyEnv": []
  },
  "coverage": {
    "findings": 4,
    "resolved": [
      "Separate data contract",
      "Authoritative UTF-8 copy contract",
      "Dominant logo visual comparison",
      "Explicit refinement checklist"
    ],
    "verdict": "Independent G2 recheck: no missing/half-covered after copy-contract repair",
    "G4": "Independent live browser acceptance passed, no missing requirements"
  },
  "concerns": [
    {
      "item": "SVG/canvas intro snapshot verified in Chromium only; Firefox/Safari unverified",
      "verdict": "report"
    },
    {
      "item": "fonts/decode capture waits may resolve after Skip; async state/GPU guarded after abort",
      "verdict": "report"
    },
    {
      "item": "concurrent Playwright default output removed another run trace once",
      "verdict": "closed: dedicated output; final production23passed"
    }
  ],
  "reviewers": {
    "manifestSpec": "/root/spec_check",
    "craft": "/root/craft_review"
  },
  "blind": {
    "verdict": "pass",
    "drift": [],
    "checked": "Independent browser G4: natural intro, fullspread handoff,3compositions,450ms locks,links,history,focus,reduced,WebGLfailure,viewportfallback,test8preservation",
    "agent": "/root/blind_acceptance"
  },
  "tests": {
    "vitest": 119,
    "files": 26,
    "playwright": 23,
    "visualCases": 24,
    "lint": "passed",
    "typecheck": "passed",
    "build": "passed",
    "docker": "healthy"
  }
}