window.STATE = {
  "slug": "test-5-paper-scale",
  "dir": "2026-10-09-test-5-paper-scale",
  "title": "Travel Club /test_5 magazine and page scale",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T0",
  "briefFile": "2026-10-09-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-09T02:14:07+03:00",
  "updatedAt": "2026-10-09T03:58:53+03:00",
  "finishedAt": "2026-10-09T03:58:53+03:00",
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-09T02:14:07+03:00",
      "finishedAt": "2026-10-09T02:14:47+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-09T02:14:47+03:00",
      "finishedAt": "2026-10-09T02:15:24+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "startedAt": "2026-10-09T02:15:24+03:00",
      "finishedAt": "2026-10-09T02:33:26+03:00",
      "note": "Full mode — self-briefing"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-09T02:33:26+03:00",
      "finishedAt": "2026-10-09T02:43:38+03:00"
    },
    {
      "id": "plan",
      "status": "skipped",
      "finishedAt": "2026-10-09T02:43:38+03:00",
      "note": "Тир T0 — отдельные таски не требуются"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-09T02:43:38+03:00",
      "finishedAt": "2026-10-09T03:49:00+03:00",
      "note": "lint, typecheck, production build, 73 unit tests, 36 production Playwright tests, Docker healthy"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-09T03:05:44+03:00",
      "finishedAt": "2026-10-09T03:57:30+03:00",
      "note": "independent implementation review and blind acceptance clean"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-09T03:57:30+03:00",
      "finishedAt": "2026-10-09T03:58:53+03:00",
      "note": "production visual QA complete; frontend Docker rebuilt and healthy"
    }
  ],
  "requirements": {
    "total": 2,
    "done": 2,
    "inTicket": 0,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [],
  "singlePass": null,
  "tests": "lint/typecheck/build passed; 73 unit tests/16 files; 36 production Playwright passed at 1920, 1440, 1280, 1050, 768, 667, 390; console errors 0; frontend Docker healthy",
  "debt": {
    "placeholders": [],
    "assumptions": [],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": {
    "findings": 0,
    "verdict": "G2 and blind G4 confirm R01 and R02 implemented"
  },
  "concerns": [],
  "reviewers": {
    "manifestSpec": "/root/paper_scale_spec_coverage",
    "craft": "/root/review_scale_change"
  },
  "blind": "/root/blind_acceptance_paper_scale: R01 and R02 implemented; larger cover and full right-page homepage composition verified"
}
