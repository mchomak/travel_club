window.STATE =
{
  "slug": "test-13-graphic-details",
  "dir": "2026-10-21-test-13-graphic-details",
  "title": "Travel Club — редакционные детали /test_13",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T0",
  "briefFile": "2026-10-21-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-21T15:24:24+03:00",
  "updatedAt": "2026-10-21T16:10:40+03:00",
  "finishedAt": "2026-10-21T16:10:40+03:00",
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-21T15:24:24+03:00",
      "finishedAt": "2026-10-21T15:26:31+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-21T15:24:24+03:00",
      "finishedAt": "2026-10-21T15:26:31+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "note": "Полный автомат — самостоятельные решения по брифу."
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-21T15:26:31+03:00",
      "finishedAt": "2026-10-21T15:33:13+03:00"
    },
    {
      "id": "plan",
      "status": "skipped",
      "note": "T0 — одна локальная визуальная доработка, без тасков."
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-21T15:33:13+03:00",
      "finishedAt": "2026-10-21T15:58:27+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-21T15:46:48+03:00",
      "finishedAt": "2026-10-21T15:58:27+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-21T15:58:27+03:00",
      "finishedAt": "2026-10-21T16:10:40+03:00"
    }
  ],
  "requirements": {
    "total": 16,
    "done": 16,
    "inSpec": 0,
    "inTicket": 0,
    "placeholder": 0,
    "deferred": 3,
    "dropped": 0
  },
  "tickets": [],
  "singlePass": {
    "startedAt": "2026-10-21T15:33:13+03:00",
    "finishedAt": "2026-10-21T16:10:40+03:00",
    "files": [
      "frontend/src/components/test_13/editorial-symbol.tsx",
      "frontend/src/components/test_13/spreads.tsx",
      "frontend/src/components/test_13/spreads.module.css",
      "frontend/src/components/test_13/README.md",
      "docs/qa/test-13/graphic-details/"
    ],
    "tests": {
      "unitPassed": 113,
      "unitFailed": 0,
      "productionBrowserPassed": 38,
      "productionBrowserFailed": 1,
      "isolatedRerunPassed": 1,
      "lint": "passed",
      "typecheck": "passed",
      "build": "passed",
      "finalProductionBrowserPassed": 11,
      "finalProductionBrowserFailed": 0,
      "compactSizesPassed": 5
    },
    "commit": null,
    "baseCommit": "7f9484685a45edf8a3eee5c87a46650953011615"
  },
  "tests": {
    "unitPassed": 113,
    "unitFailed": 0,
    "productionBrowserPassed": 38,
    "productionBrowserFailed": 1,
    "isolatedRerunPassed": 1,
    "lint": "passed",
    "typecheck": "passed",
    "build": "passed",
    "finalProductionBrowserPassed": 11,
    "finalProductionBrowserFailed": 0,
    "compactSizesPassed": 5
  },
  "debt": {
    "placeholders": [
      "R05?R07 ? ?????????? ? ??????????? ????????? ?????? ????????: ???????????? SSH-???? ?? ???????????, ???????? ???? ???????? 404."
    ],
    "assumptions": [
      "Семь авторских SVG на общей сетке24; выборочное размещение и существующая палитра."
    ],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": {
    "found": 1,
    "fixed": 1,
    "deferred": 0,
    "verdict": "PASS после добавления итогового отчёта",
    "agent": "/root/coverage_details"
  },
  "concerns": [
    {
      "finding": "D01 — исходное наложение Formats; OR compact и padding CTA .12em",
      "triage": "fixed",
      "evidence": "docs/qa/test-13/graphic-details/README.md"
    },
    {
      "finding": "test12 pointer skip timeout в двух общих прогонах, затем отдельный сценарий прошёл за1.6s; причина не установлена",
      "triage": "report",
      "evidence": "frontend/test-results/test-13-graphic-details-legacy-skip"
    },
    {
      "finding": "unit playground-shell timeout при параллельной QA; maxWorkers2 полный suite113passed",
      "triage": "resolved"
    }
  ],
  "reviewers": {
    "manifestSpec": null,
    "craft": "/root/details_review",
    "memory": "/root/details_memory",
    "blind": "/root/details_acceptance"
  },
  "blind": {
    "verdict": "PASS",
    "agent": "/root/details_acceptance",
    "states": 14,
    "pageErrors": 0,
    "drift": []
  }
}
