window.STATE =
{
  "slug": "test-11-editorial",
  "dir": "2026-10-18-test-11-editorial",
  "title": "Travel Club — /test_11 · Между строк",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T1",
  "briefFile": "2026-10-18-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-18T01:52:01+03:00",
  "updatedAt": "2026-10-18T13:39:33+03:00",
  "finishedAt": "2026-10-18T13:39:33+03:00",
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-18T01:52:01+03:00",
      "finishedAt": "2026-10-18T01:54:03+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-18T01:52:01+03:00",
      "finishedAt": "2026-10-18T01:54:03+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "note": "полный автомат — самобрифинг; unknown business facts not invented"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-18T01:54:03+03:00",
      "finishedAt": "2026-10-18T01:55:36+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "startedAt": "2026-10-18T01:55:36+03:00",
      "finishedAt": "2026-10-18T01:55:36+03:00"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-18T01:55:36+03:00",
      "finishedAt": "2026-10-18T13:36:02+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-18T13:13:23+03:00",
      "finishedAt": "2026-10-18T13:36:02+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-18T13:36:02+03:00",
      "note": "G4 принят; 55/55 требований; 119 unit +40 browser; 14 PNG",
      "finishedAt": "2026-10-18T13:39:33+03:00"
    }
  ],
  "requirements": {
    "total": 55,
    "done": 55,
    "inTicket": 0,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "Большой журнал и физическая обложка",
      "requirements": [
        "R01",
        "R02",
        "R05",
        "R14",
        "R15",
        "R16",
        "R18",
        "R23",
        "R24",
        "R36",
        "R37",
        "R38",
        "R39",
        "R40",
        "R50",
        "R51",
        "R55"
      ],
      "zone": [
        "test_11 shell"
      ],
      "blockedBy": [],
      "wave": 1,
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-18T01:55:36+03:00",
      "finishedAt": "2026-10-18T13:36:02+03:00",
      "commit": "110f508",
      "tests": {
        "productionBrowser": 10,
        "lint": "passed",
        "typecheck": "passed",
        "build": "passed"
      }
    },
    {
      "id": "02",
      "title": "Редакционные композиции и фотографии",
      "requirements": [
        "R03",
        "R04",
        "R06",
        "R07",
        "R08",
        "R09",
        "R10",
        "R11",
        "R12",
        "R13",
        "R15",
        "R16",
        "R17",
        "R19",
        "R20",
        "R21",
        "R22",
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
        "R35",
        "R36",
        "R38",
        "R40",
        "R50",
        "R51",
        "R53",
        "R55"
      ],
      "zone": [
        "test_11 editorial"
      ],
      "blockedBy": [],
      "wave": 1,
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-18T01:55:36+03:00",
      "finishedAt": "2026-10-18T13:25:48+03:00",
      "commit": "dd81e99",
      "tests": {
        "vitest": 119,
        "lint": "passed",
        "typecheck": "passed",
        "build": "passed",
        "visualSizes": 4
      }
    },
    {
      "id": "03",
      "title": "Visual refinement и production проверка",
      "requirements": [
        "R41",
        "R42",
        "R43",
        "R44",
        "R45",
        "R46",
        "R47",
        "R48",
        "R49",
        "R50",
        "R51",
        "R52",
        "R53",
        "R54"
      ],
      "zone": [
        "test_11 QA"
      ],
      "blockedBy": [
        "01",
        "02"
      ],
      "wave": 2,
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-18T13:13:23+03:00",
      "finishedAt": "2026-10-18T13:36:02+03:00",
      "commit": "62e2da1",
      "tests": {
        "productionVisual": 7,
        "motionRepeat": 1,
        "typecheck": "passed",
        "lint": "passed",
        "screenshots": 14
      }
    }
  ],
  "singlePass": null,
  "tests": {
    "vitest": 119,
    "files": 26,
    "shellProduction": 10,
    "visualProduction": 7,
    "regressionStable": 33,
    "browserTotal": 40,
    "lint": "passed",
    "typecheck": "passed",
    "build": "passed",
    "docker": "running; HTTP200; compose up --wait exit0",
    "protectedFiles": 10,
    "protectedChanged": 0
  },
  "debt": {
    "placeholders": [],
    "assumptions": [
      "Desktop >=1100×700; smaller window fallback.",
      "Illustrative stock photography, not team trip records.",
      "China chapter future only; exactly three spreads."
    ],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": {
    "findings": 0,
    "verdict": "Independent G2: no missing, half-covered, or ungrounded additions",
    "agent": "/root/spec_check"
  },
  "concerns": [
    {
      "item": "Baseline favicon404/public-site CSS preload reproduced test_10",
      "verdict": "report in QA only; unrelated existing code untouched"
    },
    {
      "item": "Initial concurrent browser transport ERR_NO_BUFFER_SPACE at legacy/test8 goto; isolated repeat passed, final sequential33passed",
      "verdict": "closed with no source changes; record QA"
    },
    {
      "item": "Craft all6pagecontent bounds/reentry evidence",
      "verdict": "closed:7visualproductiontests/14screenshots"
    },
    {
      "item": "Craft combined WebGL+resize test does not prove GPU fallback",
      "verdict": "closed:CSS opening documented, no WebGL fallback claim"
    },
    {
      "item": "Craft current finite assertion expects1iteration; reduced automated visibility omits some clipping shapes",
      "verdict": "report internal review limitation; actual independent live acceptance and final screenshots pass, no app defect observed"
    }
  ],
  "reviewers": {
    "manifestSpec": "/root/spec_check",
    "craft": "/root/craft_review"
  },
  "blind": {
    "verdict": "pass",
    "drift": [],
    "agent": "/root/blind_acceptance",
    "report": "docs/qa/test-11/blind-acceptance.md",
    "checked": "Own live production cover/3spreads/CTA/arrows/rapidnav/reentry/history/reduced; own screenshots1280/1440/1920 viewed; real photo sources verified"
  }
}
