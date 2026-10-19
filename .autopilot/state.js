window.STATE =
{
  "slug": "test-11-editorial",
  "dir": "2026-10-18-test-11-editorial",
  "title": "Travel Club — /test_11 · Шесть глав и пластика листа",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T1",
  "briefFile": "2026-10-18-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-18T01:52:01+03:00",
  "updatedAt": "2026-10-19T06:01:19+03:00",
  "finishedAt": "2026-10-19T06:01:19+03:00",
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-19T00:09:03+03:00",
      "finishedAt": "2026-10-19T00:09:03+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-19T00:09:03+03:00",
      "finishedAt": "2026-10-19T00:09:03+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-19T00:09:03+03:00",
      "finishedAt": "2026-10-19T00:11:45+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "finishedAt": "2026-10-19T00:11:45+03:00"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-19T00:11:45+03:00",
      "finishedAt": "2026-10-19T04:35:56+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-19T04:35:56+03:00",
      "finishedAt": "2026-10-19T05:09:23+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-19T05:09:23+03:00",
      "finishedAt": "2026-10-19T06:01:19+03:00"
    }
  ],
  "requirements": {
    "total": 82,
    "done": 82,
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
    },
    {
      "id": "07",
      "title": "Пластичный лист и шесть пунктов навигации",
      "requirements": [
        "G17",
        "G18"
      ],
      "zone": [
        "07 shell/turnengine"
      ],
      "blockedBy": [],
      "wave": 5,
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-19T00:11:45+03:00",
      "commit": "e39aa81",
      "finishedAt": "2026-10-19T06:01:19+03:00",
      "tests": {
        "productionAll": 48,
        "current11": 25,
        "legacy": 23,
        "unit": 119,
        "screenshots": 33
      }
    },
    {
      "id": "08",
      "title": "Три новые главы и медленные появления",
      "requirements": [
        "G19",
        "G20",
        "G21",
        "G22",
        "G23",
        "G24"
      ],
      "zone": [
        "08 editorial/data/assets"
      ],
      "blockedBy": [],
      "wave": 5,
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-19T00:11:45+03:00",
      "commit": "3b2c56f",
      "finishedAt": "2026-10-19T06:01:19+03:00",
      "tests": {
        "productionAll": 48,
        "current11": 25,
        "legacy": 23,
        "unit": 119,
        "screenshots": 33
      }
    },
    {
      "id": "09",
      "title": "Шесть глав: приёмка, push и пересборка",
      "requirements": [
        "G17",
        "G18",
        "G19",
        "G20",
        "G21",
        "G22",
        "G23",
        "G24",
        "G25",
        "G26",
        "G27"
      ],
      "zone": [
        "09 QA/docs/capture"
      ],
      "blockedBy": [
        "07",
        "08"
      ],
      "wave": 6,
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 1,
      "startedAt": "2026-10-19T00:23:05+03:00",
      "note": "QA preparation and visual7 passed; fresh successor recaptures final production after compatibility cleanup",
      "commit": "db5523d",
      "finishedAt": "2026-10-19T06:01:19+03:00",
      "tests": {
        "productionAll": 48,
        "current11": 25,
        "legacy": 23,
        "unit": 119,
        "screenshots": 33
      }
    }
  ],
  "singlePass": null,
  "tests": {
    "lint": "passed",
    "typecheck": "passed",
    "unit": 119,
    "unitFiles": 26,
    "productionAll": 48,
    "production11": 25,
    "legacy": 23,
    "screenshots": 33,
    "protectedFiles": 30,
    "build": "post-push Docker frontend exit0,35routes",
    "http": 200,
    "output": "test-results/test-11-completion-final-stable"
  },
  "debt": {
    "placeholders": [],
    "assumptions": [
      "Desktop >=1100×700; six reading chapters.",
      "Illustrative licensed stock photography, not team trip photographs.",
      "Existing /start remains a prototype; no new submission backend."
    ],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": {
    "agent": "/root/completion_coverage",
    "verdict": "clear after scopedrepair",
    "findings": 2,
    "closed": [
      "explicit5pointartdirectionreport",
      "dependencypermissionpreserved"
    ]
  },
  "concerns": [
    {
      "item": "QA body selector, CTA timeout and capture phase sampling",
      "verdict": "closed; final48green and documented history"
    },
    {
      "item": "Oldtest8 exact1080WebP optimizer response hung",
      "verdict": "runtime restart recovered200; isolatedcase and full48passed; sourceunchanged, rootcause remains inference"
    },
    {
      "item": "DesktopChromium; FPS/GPUmemory acrossdevices not measured",
      "verdict": "documented in QA; no cross-device guarantee"
    }
  ],
  "reviewers": {
    "manifestSpec": "/root/completion_coverage",
    "craft": "/root/completion_craft"
  },
  "blind": {
    "verdict": "PASS desktop six-chapter journey; coordinator actions complete",
    "agent": "/root/completion_blind",
    "drift": [],
    "evidence": "docs/qa/test-11/completion-blind-acceptance.md",
    "remaining": null
  },
  "git": {
    "branch": "main",
    "sourceCommit": "db5523d0ed86d4d694360aaab801952610e6d745",
    "sourcePush": "verified remoteHEAD match",
    "postPushRebuild": "passed"
  }
}
