window.STATE =
{
  "slug": "tc-research",
  "dir": "2026-10-19-tc-research",
  "title": "TC Research — инструмент интервью CustDev",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T2",
  "briefFile": "2026-10-19-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-19T18:08:20+03:00",
  "updatedAt": "2026-10-20T05:24:30+03:00",
  "finishedAt": "2026-10-20T05:24:30+03:00",
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-19T18:08:20+03:00",
      "finishedAt": "2026-10-19T18:23:15+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-19T18:08:20+03:00",
      "finishedAt": "2026-10-19T18:23:15+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "note": "Полный автомат — самобрифинг."
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-19T18:23:15+03:00",
      "finishedAt": "2026-10-19T18:36:39+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "startedAt": "2026-10-19T18:36:39+03:00",
      "finishedAt": "2026-10-19T18:41:15+03:00"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-19T18:41:15+03:00",
      "finishedAt": "2026-10-20T05:11:21+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-20T05:11:21+03:00",
      "finishedAt": "2026-10-20T05:24:30+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-20T05:24:30+03:00",
      "finishedAt": "2026-10-20T05:24:30+03:00"
    }
  ],
  "requirements": {
    "total": 67,
    "done": 64,
    "inTicket": 0,
    "inSpec": 0,
    "placeholder": 3,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "Банк вопросов, гипотезы и правила",
      "requirements": [
        "R08",
        "R13",
        "R14",
        "R15",
        "R16",
        "R17",
        "R18",
        "R19",
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
        "R37"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "backend/app/research_data/",
        "backend/app/research_bank.py",
        "backend/app/research_domain.py",
        "backend/tests/test_research_bank.py",
        "backend/tests/test_research_domain.py"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-19T18:41:15+03:00",
      "finishedAt": "2026-10-19T19:59:39+03:00",
      "commit": "ddcd382cb0fc77273e96ae160d5939d6be8e83d2",
      "tests": [
        "question bank: 82 questions / 17 hypotheses",
        "scenario and classification validation"
      ]
    },
    {
      "id": "02",
      "title": "PostgreSQL, API и Excel export",
      "requirements": [
        "R05",
        "R06",
        "R21",
        "R22",
        "R23",
        "R24",
        "R25",
        "R26",
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
        "R63",
        "R64",
        "R65",
        "R66"
      ],
      "blockedBy": [
        "01"
      ],
      "wave": 2,
      "zone": [
        "backend/app/",
        "backend/migrations/versions/",
        "backend/tests/test_research_*.py",
        "backend/requirements.txt",
        "compose.deploy.yaml"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-19T19:59:39+03:00",
      "finishedAt": "2026-10-19T20:52:55+03:00",
      "commit": "d932e7ade91df067e5f9260dba57cc114de7b8ff",
      "tests": [
        "backend pytest: 149 passed on isolated DB",
        "Ruff: passed",
        "XLSX and API integration checks passed"
      ]
    },
    {
      "id": "03",
      "title": "Интервью, карточка и автосохранение",
      "requirements": [
        "R01",
        "R02",
        "R03",
        "R04",
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
        "R58",
        "R62",
        "R64",
        "R65",
        "R66"
      ],
      "blockedBy": [
        "02"
      ],
      "wave": 3,
      "zone": [
        "frontend/src/app/research/",
        "frontend/src/components/research/",
        "frontend/src/lib/research.ts",
        "frontend/e2e/research.spec.ts"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-19T20:52:55+03:00",
      "commit": "4665da71363a77d2d1a8f47fd9e6c6cea36f34af",
      "finishedAt": "2026-10-19T21:22:55+03:00",
      "tests": [
        "frontend Vitest: 130 passed / 31 files",
        "lint, typecheck, production build passed",
        "browser E2E: 2 passed"
      ]
    },
    {
      "id": "04",
      "title": "Запуск, Nginx и backup",
      "requirements": [
        "R06",
        "R07",
        "R61",
        "R63",
        "R67"
      ],
      "blockedBy": [
        "02",
        "03"
      ],
      "wave": 4,
      "zone": [
        "docs/tc-research/",
        "deploy/nginx/",
        "deploy/tests/test_nginx_render.py"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "commit": "1533716767d8a0cdad90d731071302e45dd5bc63",
      "finishedAt": "2026-10-20T00:23:46+03:00",
      "tests": [
        "local Compose launch documented",
        "Nginx renderer and deployment/backup runbooks verified"
      ]
    },
    {
      "id": "05",
      "title": "Безопасное обновление Nginx vhost",
      "requirements": [
        "R06",
        "R07",
        "R67"
      ],
      "blockedBy": [
        "04"
      ],
      "wave": 5,
      "zone": [
        "docs/tc-research/deployment.md"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "startedAt": "2026-10-20T01:01:19+03:00",
      "note": "Independent review addressed; stage complete config outside live include before atomic activation.",
      "finishedAt": "2026-10-20T01:12:00+03:00",
      "commit": "aee1a3ae4bc65583c0ac8ff26b9fa0041c3a2fb8",
      "tests": [
        "bash -n: HTTP/HTTPS blocks",
        "render.py HTTP/HTTPS",
        "git diff --check"
      ]
    },
    {
      "id": "06",
      "title": "Сохранение S02 и S03",
      "requirements": [
        "R12",
        "R13",
        "R27",
        "R30"
      ],
      "blockedBy": [
        "01",
        "03"
      ],
      "wave": 5,
      "zone": [
        "backend/app/research_data/screening.json",
        "frontend/src/components/research/screening-form.tsx",
        "frontend/src/components/research/respondent-detail.tsx",
        "frontend/src/components/research/screening-form.test.tsx"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "startedAt": "2026-10-20T01:01:19+03:00",
      "finishedAt": "2026-10-20T01:25:35+03:00",
      "commit": "dffd390",
      "tests": [
        "targeted XLSX regression: 1 passed",
        "full backend pytest: 149 passed",
        "Ruff: passed",
        "git diff --check: passed"
      ],
      "note": "Repair accepted by independent review; XLSX export labels S02/S03 details from JSON."
    },
    {
      "id": "07",
      "title": "Сверка сценариев с DOCX",
      "requirements": [
        "R31"
      ],
      "blockedBy": [
        "01",
        "04"
      ],
      "wave": 6,
      "zone": [
        "docs/tc-research/json-data.md"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-20T01:16:51+03:00",
      "note": "R31 repair complete; review confirms route comparison, conditional offers, and optional brand module match DOCX/JSON.",
      "finishedAt": "2026-10-20T01:25:00+03:00",
      "commit": "97b0a1d",
      "tests": [
        "git diff --check",
        "independent review: ADDRESSED"
      ]
    },
    {
      "id": "08",
      "title": "JSON screening textarea support",
      "requirements": [
        "R17",
        "R18"
      ],
      "blockedBy": [],
      "wave": 7,
      "zone": [
        "frontend/src/lib/research.ts",
        "frontend/src/components/research/screening-form.tsx",
        "frontend/src/components/research/screening-form.test.tsx"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "startedAt": "2026-10-20T02:02:11+03:00",
      "note": "ScreeningField.control includes textarea; JSON-driven field saves through the shared answers object.",
      "finishedAt": "2026-10-20T02:22:00+03:00",
      "commit": "2f4b13d483e0c7bf01f451a9e939f9cf0830315c",
      "tests": [
        "screening-form tests: 2 passed",
        "frontend typecheck: passed",
        "spec review R17/R18: addressed",
        "git diff --check: passed"
      ]
    },
    {
      "id": "09",
      "title": "Safe PostgreSQL backup restore instructions",
      "requirements": [
        "R67"
      ],
      "blockedBy": [],
      "wave": 7,
      "zone": [
        "docs/tc-research/backup.md"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-20T02:02:11+03:00",
      "note": "Restore targets must be new; failures stop the command sequence. Minor review suggestion: verify the backup file before creating the target DB.",
      "finishedAt": "2026-10-20T02:21:00+03:00",
      "commit": "074062d443c3bab93daba5639797731d98dd1db7",
      "tests": [
        "git diff --check",
        "bash syntax check",
        "Compose configuration check",
        "independent restore-safety review: ADDRESSED"
      ]
    },
    {
      "id": "10",
      "title": "Historical snapshot detail fallback",
      "requirements": [
        "R53",
        "R57"
      ],
      "blockedBy": [],
      "wave": 8,
      "zone": [
        "frontend/src/components/research/respondent-detail.tsx",
        "frontend/src/components/research/respondent-detail.test.tsx"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 2,
      "handoffs": 0,
      "startedAt": "2026-10-20T02:20:00+03:00",
      "note": "Historical snapshots remain visible without valid current config. Review concern about enabling start with an empty scenario list is tracked by ticket 11.",
      "finishedAt": "2026-10-20T02:28:45+03:00",
      "commit": "36fe690ba724db8010a466ed1c6c35b49bbb9f70",
      "tests": [
        "respondent-detail tests: 5 passed",
        "frontend lint: passed",
        "frontend typecheck: passed",
        "full Vitest: 127 passed / 31 files",
        "Next.js production build: passed",
        "spec review R53/R57 and empty-config guards: addressed",
        "git diff --check: passed"
      ]
    },
    {
      "id": "11",
      "title": "Disable start when scenario config is unavailable",
      "requirements": [
        "R57"
      ],
      "blockedBy": [
        "10"
      ],
      "wave": 9,
      "zone": [
        "frontend/src/components/research/respondent-detail.tsx",
        "frontend/src/components/research/respondent-detail.test.tsx"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-20T02:28:56+03:00",
      "finishedAt": "2026-10-20T05:11:21+03:00",
      "commit": "97d88428723fe495a105fddc9dd3cef3ebb4afea",
      "tests": [
        "focused component tests: 8 passed",
        "frontend Vitest: 130 passed / 31 files",
        "lint/typecheck/build passed",
        "independent review: addressed"
      ]
    }
  ],
  "singlePass": null,
  "tests": {
    "frontendLint": "passed",
    "frontendTypecheck": "passed",
    "frontendVitest": {
      "passed": 130,
      "files": 31
    },
    "frontendBuild": "passed",
    "backendPytest": {
      "passed": 149,
      "database": "isolated test database",
      "lastRun": "after last backend change"
    },
    "ruff": "passed",
    "playwright": {
      "passed": 2,
      "file": "frontend/e2e/research.spec.ts",
      "baseUrl": "http://localhost:13039",
      "project": "tc-research-blind"
    },
    "questionBankValidation": {
      "questions": 82,
      "hypotheses": 17,
      "scenarios": 4,
      "valid": true
    },
    "docxComparison": {
      "questionTextsMatched": 82,
      "questionTextsTotal": 82,
      "hypothesesMatched": 17,
      "hypothesesTotal": 17
    },
    "anonymousResearchApi": 401,
    "manualQuestionPicker": {
      "G02": "added and retained after reload",
      "B01": "added last and retained after reload",
      "X01": "not selectable while offers disabled"
    }
  },
  "debt": {
    "placeholders": [
      "R06/R63: select a real research hostname, set RESEARCH_ORIGIN, DNS and HTTPS certificate on the VPS; no live deployment yet.",
      "R62: independent screenshot-based visual polish review not performed; responsive browser checks passed at 320/390 px."
    ],
    "assumptions": [
      "Reuse the existing admin session for the Research page, API and export.",
      "The DOCX is the primary source of question texts and route order; B is optional and X remains disabled until actual offer terms exist.",
      "Initial category scores and thresholds are editable starter values, not validated customer typology.",
      "DNS and certificate values are supplied by the VPS/domain owner."
    ],
    "emptyEnv": [
      "RESEARCH_ORIGIN: set the production origin after choosing the domain; no value was invented."
    ]
  },
  "additions": [],
  "coverage": {
    "found": 11,
    "fixed": 11,
    "deferred": 0,
    "verdict": "all review gaps closed; three external/visual checks documented as placeholders"
  },
  "concerns": [
    {
      "source": "craft_review",
      "finding": "Nginx renderer piped directly into active vhost may truncate it on render failure.",
      "triage": "fixed",
      "ticket": "05",
      "resolution": "Candidate is validated before atomic activation."
    },
    {
      "source": "blind_acceptance",
      "finding": "Screening form did not save S02 departure city or S03 last-trip organizer.",
      "triage": "fixed",
      "ticket": "06"
    },
    {
      "source": "spec_coverage",
      "finding": "Excel screening columns used raw keys for S02/S03 instead of configured Russian labels.",
      "triage": "fixed",
      "ticket": "06"
    },
    {
      "source": "blind_acceptance",
      "finding": "Restore runbook can create an empty target DB if BACKUP_FILE is missing.",
      "triage": "accept",
      "ticket": "09",
      "reason": "Existing data is not overwritten; sequence stops before claiming restore success. Nonblocking cleanup concern."
    },
    {
      "source": "craft_review",
      "finding": "Ticket 10 tests duplicated the guarded screening-field derivation.",
      "triage": "accept",
      "ticket": "10",
      "reason": "Maintainability-only concern; current behavior is covered."
    },
    {
      "source": "craft_review",
      "finding": "Empty-scenario draft view enabled Start Interview without a valid scenario.",
      "triage": "fixed",
      "ticket": "11",
      "resolution": "Disabled state, explanation, handler guard, and regression cases added."
    }
  ],
  "reviewers": {
    "manifestSpec": "/root/spec_coverage",
    "craft": "/root/craft_review",
    "blind": "/root/tc_research_blind_acceptance",
    "memory": "/root/tc_research_memory",
    "adr": "/root/tc_research_adr_audit"
  },
  "blind": {
    "verdict": "PASS for local workflow; partial only for live domain/HTTPS and independent visual polish review.",
    "agent": "/root/tc_research_blind_acceptance",
    "drift": [],
    "partial": [
      "R06: no real domain/VPS deployment",
      "R62: visual polish not independently assessed",
      "R63: live HTTPS not externally verified"
    ],
    "evidence": "report.md, independent checklist for brief sections 1-20; Playwright 2/2 and supplementary G02/B01/X01 browser checks.",
    "remaining": "Actual domain, DNS, VPS, certificate and external HTTPS check."
  },
  "git": {
    "branch": "main",
    "featureBranch": "codex/tc-research",
    "featureCommit": "97d88428723fe495a105fddc9dd3cef3ebb4afea",
    "mergedAt": "0f04652",
    "pushed": false
  }
}
