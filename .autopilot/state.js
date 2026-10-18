window.STATE =
{
  "slug": "test-11-editorial",
  "dir": "2026-10-18-test-11-editorial",
  "title": "Travel Club — /test_11 · Доработка вступления и редакции",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T1",
  "briefFile": "2026-10-18-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-18T01:52:01+03:00",
  "updatedAt": "2026-10-18T22:26:27+03:00",
  "finishedAt": "2026-10-18T22:26:27+03:00",
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-18T14:07:04+03:00",
      "finishedAt": "2026-10-18T14:07:04+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-18T14:07:04+03:00",
      "finishedAt": "2026-10-18T14:07:04+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "note": "full: самобрифинг; творческие решения авторизованы"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-18T14:07:04+03:00",
      "finishedAt": "2026-10-18T14:14:29+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "startedAt": "2026-10-18T14:14:29+03:00",
      "finishedAt": "2026-10-18T14:14:29+03:00"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-18T14:14:29+03:00",
      "finishedAt": "2026-10-18T22:20:16+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-18T21:51:53+03:00",
      "finishedAt": "2026-10-18T22:22:51+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-18T22:20:16+03:00",
      "finishedAt": "2026-10-18T22:26:27+03:00"
    }
  ],
  "requirements": {
    "total": 71,
    "done": 71,
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
    },
    {
      "id": "04",
      "title": "Настоящее вступление и reveal orchestration",
      "requirements": [
        "G01",
        "G02",
        "G03",
        "G04",
        "G05",
        "G06",
        "G07",
        "G08",
        "G09",
        "G15"
      ],
      "zone": [
        "test_11 shell"
      ],
      "blockedBy": [],
      "wave": 3,
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-18T14:14:29+03:00",
      "commit": "32c91ea",
      "finishedAt": "2026-10-18T22:20:16+03:00",
      "tests": {
        "devIntro": 12,
        "productionIntro": 12,
        "endpointMaxErrorPx": 0.06121,
        "canvasAtRest": 0
      }
    },
    {
      "id": "05",
      "title": "Редакция, типографика и reveal",
      "requirements": [
        "G01",
        "G02",
        "G10",
        "G11",
        "G12",
        "G13",
        "G14",
        "G15"
      ],
      "zone": [
        "test_11 editorial"
      ],
      "blockedBy": [],
      "wave": 3,
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-18T14:14:29+03:00",
      "tests": {
        "revealBrowser": 3,
        "targetedLint": "passed",
        "typecheck": "passed",
        "firstFrameRegression": "red reproduced; green monotonic mask"
      },
      "commit": "296b8ef",
      "finishedAt": "2026-10-18T22:03:39+03:00"
    },
    {
      "id": "06",
      "title": "Проверка и пересборка доработки",
      "requirements": [
        "G01",
        "G02",
        "G03",
        "G04",
        "G05",
        "G06",
        "G07",
        "G08",
        "G09",
        "G10",
        "G11",
        "G12",
        "G13",
        "G14",
        "G15",
        "G16"
      ],
      "zone": [
        "test_11 refinement QA"
      ],
      "blockedBy": [
        "04",
        "05"
      ],
      "wave": 4,
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-18T22:03:39+03:00",
      "commit": "196d72d",
      "finishedAt": "2026-10-18T22:22:51+03:00",
      "tests": {
        "production11": 22,
        "legacy": 23,
        "screenshots": 21,
        "bounds": "passed",
        "lint": "passed",
        "typecheck": "passed",
        "build": "passed"
      }
    }
  ],
  "singlePass": null,
  "tests": {
    "baselineVitest": 119,
    "previousBrowser": 40,
    "refinement": "45 production browser passed",
    "lint": "passed",
    "typecheck": "passed",
    "vitest": 119,
    "production11": 22,
    "regression": 23,
    "screenshots": 21,
    "build": "passed Docker",
    "http": 200,
    "protectedFiles": 30
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
    "verdict": "Independent refinement G2 clear",
    "findings": 0,
    "agent": "/root/refinement_spec_check"
  },
  "concerns": [
    {
      "item": "Previous gray/CSS-hinge and reveal/fallback/projection findings",
      "verdict": "closed by current implementation and45productionchecks; obsolete historical limitations superseded"
    },
    {
      "item": "Chromium ReadPixels and unused CSS preload warnings during capture",
      "verdict": "report in QA; no JSerrors, canvas0 and idle0 atrest; cross-deviceFPS/GPUmemory not measured"
    },
    {
      "item": "DesktopChromium >=1100×700 scope",
      "verdict": "report in QA; Safari/Firefox/mobilemagazine outside current requested desktop experiment"
    }
  ],
  "reviewers": {
    "manifestSpec": "/root/refinement_spec_check",
    "craft": "/root/refinement_craft"
  },
  "blind": {
    "verdict": "accepted desktop",
    "agent": "/root/refinement_blind",
    "drift": [],
    "evidence": "docs/qa/test-11/refinement-blind-acceptance.md",
    "limits": [
      "No cross-hardware GPU benchmark; Chromium desktop scope."
    ]
  }
}
