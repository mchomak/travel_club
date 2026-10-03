window.STATE =
{
  "slug": "trip-item-categories-airport-blocks",
  "dir": "2026-10-02-trip-item-categories-airport-blocks",
  "title": "Категории пунктов поездки и блоки аэропорта",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T2",
  "briefFile": "2026-10-02-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-02T15:57:21+03:00",
  "updatedAt": "2026-10-03T12:01:43+03:00",
  "finishedAt": null,
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-02T15:57:21+03:00",
      "finishedAt": "2026-10-02T16:02:39+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-02T16:02:39+03:00",
      "finishedAt": "2026-10-02T16:02:39+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "note": "полный автомат — самобрифинг"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-02T16:02:39+03:00",
      "finishedAt": "2026-10-02T16:21:44+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "startedAt": "2026-10-02T16:21:44+03:00",
      "finishedAt": "2026-10-02T16:21:44+03:00",
      "note": "3 ?????, ???? T2"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-02T16:21:44+03:00",
      "finishedAt": "2026-10-03T11:59:40+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-02T20:38:55+03:00",
      "finishedAt": "2026-10-03T11:59:40+03:00"
    },
    {
      "id": "final",
      "status": "active",
      "startedAt": "2026-10-03T11:59:40+03:00"
    }
  ],
  "requirements": {
    "total": 18,
    "done": 17,
    "inTicket": 1,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "?????? ??????, API ? ??????",
      "requirements": [
        "R01",
        "R02",
        "R03",
        "R04",
        "R05",
        "R07",
        "R08",
        "R11",
        "R12",
        "R13",
        "D01"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "backend/",
        "frontend/src/lib/contracts.ts",
        "frontend/src/lib/pricing.ts",
        "frontend/src/lib/trip-ui.ts",
        "frontend/src/components/trips/item-form.tsx",
        "frontend/src/components/trips/trip-calendar.tsx"
      ],
      "status": "done",
      "retries": 1,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-02T19:57:25+03:00",
      "finishedAt": "2026-10-02T20:46:20+03:00",
      "tests": {
        "backend": 52,
        "frontend": 55,
        "failed": 0
      },
      "commit": "2e9f03d"
    },
    {
      "id": "02",
      "title": "???????? ????? ??????? ? ?????? ???????????",
      "requirements": [
        "R01",
        "R02",
        "R03",
        "R04",
        "R05",
        "R06",
        "R07"
      ],
      "blockedBy": [
        "01"
      ],
      "wave": 2,
      "zone": [
        "frontend/src/components/trips/",
        "frontend/src/lib/trip-ui.ts",
        "frontend/src/app/globals.css"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-02T20:46:20+03:00",
      "finishedAt": "2026-10-02T21:37:45+03:00",
      "tests": {
        "frontend": 57,
        "failed": 0
      },
      "commit": "9ba2944"
    },
    {
      "id": "03",
      "title": "????????? ????? ????????? ? ?????????",
      "requirements": [
        "R08",
        "R09",
        "R10",
        "R11",
        "R12",
        "R13",
        "R14",
        "R15",
        "R16",
        "D02"
      ],
      "blockedBy": [
        "01",
        "02"
      ],
      "wave": 3,
      "zone": [
        "frontend/src/lib/calendar.ts",
        "frontend/src/components/trips/",
        "frontend/src/app/globals.css",
        "frontend/e2e/",
        "frontend/src/lib/trips.ts"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 2,
      "handoffs": 1,
      "startedAt": "2026-10-02T21:37:45+03:00",
      "finishedAt": "2026-10-03T11:30:48+03:00",
      "commit": "8ed5f37",
      "tests": {
        "backend": 52,
        "frontend": 65,
        "e2e": 26,
        "failed": 0
      },
      "repairFindings": [
        "Playwright 4 ???????? ?????????? ?????? ????????? ????? T02",
        "?????? airport_after_minutes ???????? ? airport_before_minutes",
        "E2E ???? ??????: transfer capacity ????????? 6000 ?????? ????????? 12000"
      ]
    }
  ],
  "singlePass": null,
  "tests": {
    "backend": 52,
    "frontend": 65,
    "e2e": 26,
    "lint": "passed",
    "typecheck": "passed",
    "build": "passed",
    "migrations": "passed"
  },
  "debt": {
    "placeholders": [],
    "assumptions": [
      "???? ??????? ????????? ???????; ?????????? ????????? ???????",
      "??? ????????? 3 ???? ?? ?????? ? 1 ??? ????? ??????? ?? ???????",
      "?????? ????????? ?????? ???????????? ???????????? ?????"
    ],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": {
    "found": 2,
    "fixed": 2,
    "deferred": 0
  },
  "concerns": [
    "frontend/src/components/trips/trip-editor.tsx:79 ? ????????? ??????? ?????????????? ? item-form.tsx:77; ??? ????????? ??????? ????? ???????????????? ??? ?????"
  ],
  "reviewers": {
    "manifestSpec": "review_manifest_spec",
    "craft": "review_craft"
  },
  "blind": {
    "verdict": "13/13 product requirements implemented; delivery actions pending",
    "findings": [],
    "runtime": "docker compose ps: healthy; backend 52 passed; targeted Playwright 2 passed"
  },
  "concernTriage": [
    {
      "finding": "Два локальных значения подвида по умолчанию в редакторе и форме",
      "verdict": "report",
      "reason": "Поведение сейчас покрыто проверками; риск расхождения при будущем изменении подвидов не задерживает выпуск"
    }
  ]
}
