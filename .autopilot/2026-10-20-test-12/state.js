window.STATE =
{
  "slug": "test-12",
  "dir": "2026-10-20-test-12",
  "title": "Travel Club TEST_12",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T1",
  "briefFile": "2026-10-20-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-20T02:25:14+03:00",
  "updatedAt": "2026-10-20T05:10:56+03:00",
  "finishedAt": "2026-10-20T05:10:56+03:00",
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-20T02:25:14+03:00",
      "finishedAt": "2026-10-20T02:27:06+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-20T02:25:14+03:00",
      "finishedAt": "2026-10-20T02:27:06+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "note": "Full mode; self-briefing, no blocking unknowns."
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-20T02:27:06+03:00",
      "finishedAt": "2026-10-20T02:28:04+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "startedAt": "2026-10-20T02:28:04+03:00",
      "finishedAt": "2026-10-20T02:28:04+03:00"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-20T02:28:04+03:00",
      "note": "1 of 3 done; editorial and acceptance run in parallel.",
      "finishedAt": "2026-10-20T05:02:04+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-20T02:34:53+03:00",
      "note": "Editorial review; browser acceptance continues.",
      "finishedAt": "2026-10-20T05:02:04+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-20T05:02:04+03:00",
      "note": "Production checks and blind acceptance; source complete.",
      "finishedAt": "2026-10-20T05:10:56+03:00"
    }
  ],
  "requirements": {
    "total": 73,
    "done": 73,
    "inTicket": 0,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "Independent shell, cover and contents",
      "requirements": [
        "R01",
        "R02",
        "R03",
        "R04",
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
        "R53",
        "R54",
        "R55",
        "R56",
        "R57",
        "R58",
        "R59",
        "R65",
        "R66",
        "R67",
        "R68",
        "G01"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "test_12 shell"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-20T02:28:04+03:00",
      "commit": "1ebea32",
      "finishedAt": "2026-10-20T02:35:16+03:00",
      "tests": {
        "unit": 113,
        "lint": "passed",
        "typecheck": "passed",
        "browserSmoke": "passed"
      }
    },
    {
      "id": "02",
      "title": "Seven editorial chapters and founders",
      "requirements": [
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
        "R45",
        "R46",
        "R47",
        "R48",
        "R49",
        "R50",
        "R51",
        "R52",
        "R54",
        "R55",
        "R56",
        "R57",
        "R58",
        "R59",
        "R60",
        "R61",
        "R62",
        "R63",
        "R64",
        "R66",
        "R67",
        "R68",
        "R69",
        "R70",
        "G02"
      ],
      "blockedBy": [
        "01"
      ],
      "wave": 2,
      "zone": [
        "test_12 spreads/data"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-20T02:35:16+03:00",
      "tests": {
        "unit": 113,
        "lint": "passed",
        "typecheck": "passed",
        "viewports": "passed"
      },
      "finishedAt": "2026-10-20T05:02:37+03:00",
      "commit": "de93a1f"
    },
    {
      "id": "03",
      "title": "Browser and visual acceptance",
      "requirements": [
        "R01",
        "R02",
        "R03",
        "R04",
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
        "R45",
        "R46",
        "R47",
        "R48",
        "R49",
        "R50",
        "R51",
        "R52",
        "R53",
        "R54",
        "R55",
        "R56",
        "R57",
        "R58",
        "R59",
        "R60",
        "R61",
        "R62",
        "R63",
        "R64",
        "R65",
        "R66",
        "R67",
        "R68",
        "R69",
        "R70",
        "G01",
        "G02",
        "G03"
      ],
      "blockedBy": [
        "01"
      ],
      "wave": 2,
      "zone": [
        "test-12 tests/docs"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-20T02:35:16+03:00",
      "commit": "bf17f3d",
      "finishedAt": "2026-10-20T05:10:56+03:00",
      "tests": {
        "productionBrowser": 36,
        "postPushBrowser": 4,
        "productionCaptures": 39,
        "controlComparisons": 15,
        "unit": 113
      }
    }
  ],
  "singlePass": null,
  "tests": {
    "unit": 113,
    "unitFiles": 26,
    "lint": "passed",
    "typecheck": "passed",
    "productionBuild": "passed, Docker Next36routes",
    "devBrowser": 13,
    "devCaptures": 39,
    "protectedFilesUnchanged": 367,
    "productionCaptures": 39,
    "controlComparisons": 15,
    "productionBrowser": 36,
    "productionNew": 13,
    "productionRegression": 23,
    "productionHTTP": 200,
    "finalLint": "passed",
    "finalTypecheck": "passed",
    "finalUnit": 113,
    "postPushBrowser": 4,
    "postPushHTTP": 200
  },
  "debt": {
    "placeholders": [
      "Two verified founder portraits."
    ],
    "assumptions": [
      "Isolated codex/test-12 branch; preview on its own port.",
      "Founder portraits not available: honest replaceable placeholders."
    ],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": {
    "found": 6,
    "fixed": 6,
    "deferred": 0,
    "agent": "/root/coverage",
    "note": "Added explicit preliminary audit, benefits, organisation experience, generic transitions, interaction, unavailable checks. Implementation decisions are not added capabilities; appended authorization encoding repaired.",
    "verdict": "PASS on independent reread; zero missing requirements"
  },
  "concerns": [
    {
      "item": "Missing CSS module class and copied README",
      "verdict": "fixed and independently reviewed"
    },
    {
      "item": "Capture leaf-bound checks do not alone exclude nested clipping",
      "verdict": "closed with personal visual review of changed pages in all3sizes and control contact sheet"
    },
    {
      "item": "favicon404/CSS preload/Canvas warnings in blind run",
      "verdict": "report; noncritical existing runtime observations, no application failure"
    }
  ],
  "reviewers": {
    "manifestSpec": "/root/requirements",
    "craft": "/root/craft"
  },
  "blind": {
    "agent": "/root/blind",
    "verdict": "PASS; source committed, pushed, production rebuilt after push",
    "drift": [],
    "evidence": "docs/qa/test-12/blind-acceptance.md",
    "remaining": null
  },
  "git": {
    "branch": "codex/test-12",
    "sourceCommit": "bf17f3d5409c50cddf9d6f32c22b0ea0199a396e",
    "sourcePush": "remote HEAD matched source commit",
    "postPushRebuild": "Docker production build exit0, isolated container restarted, HTTP200,4browser smoke passed",
    "preview": "http://localhost:3013/test_12"
  }
}
