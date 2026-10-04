window.STATE =
{
  "slug": "living-issue",
  "dir": "2026-10-04-living-issue",
  "title": "Travel Club - Living Issue /test_2",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T0",
  "briefFile": "2026-10-04-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-04T02:59:53+03:00",
  "updatedAt": "2026-10-04T04:46:39+03:00",
  "finishedAt": "2026-10-04T04:46:39+03:00",
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-04T02:59:53+03:00",
      "finishedAt": "2026-10-04T03:21:27+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-04T02:59:53+03:00",
      "finishedAt": "2026-10-04T03:21:27+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "note": "Full brief; routine choices resolved within the authorized scope."
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-04T03:21:27+03:00",
      "finishedAt": "2026-10-04T03:23:58+03:00"
    },
    {
      "id": "plan",
      "status": "skipped",
      "note": "T0: one isolated frontend surface."
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-04T03:23:58+03:00",
      "note": "Safe copy verified before intro; final production build passed.",
      "finishedAt": "2026-10-04T04:45:50+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-04T04:13:48+03:00",
      "note": "Independent acceptance and craft findings fixed and rechecked.",
      "finishedAt": "2026-10-04T04:45:50+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-04T04:45:50+03:00",
      "finishedAt": "2026-10-04T04:46:39+03:00"
    }
  ],
  "requirements": {
    "total": 56,
    "done": 56,
    "inTicket": 0,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [],
  "singlePass": {
    "startedAt": "2026-10-04T03:23:58+03:00",
    "finishedAt": "2026-10-04T04:45:50+03:00",
    "files": [
      "frontend/src/app/test_2/page.tsx",
      "frontend/src/components/test_2/README.md",
      "frontend/src/components/test_2/editorial-home.tsx",
      "frontend/src/components/test_2/issue-content.ts",
      "frontend/src/components/test_2/lead-form.tsx",
      "frontend/src/components/test_2/living-issue.module.css",
      "frontend/src/components/test_2/living-issue.tsx",
      "frontend/e2e/living-issue.spec.ts"
    ],
    "tests": "65 unit tests; 40 e2e tests; lint, typecheck, production Docker build passed",
    "commit": "e50df55a531fa945c6b7beecf4ebef577e14c23f"
  },
  "tests": {
    "unitPassed": 65,
    "e2ePassed": 40,
    "failed": 0,
    "lint": "passed",
    "typecheck": "passed",
    "build": "passed"
  },
  "debt": {
    "placeholders": [],
    "assumptions": [
      "Reuse local baseline photographs; experiment form anchor is #story because #start is reserved for original hero."
    ],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": {
    "found": 4,
    "fixed": 4,
    "deferred": 0
  },
  "concerns": [],
  "reviewers": {
    "manifestSpec": "/root/spec_coverage",
    "craft": "/root/living_craft",
    "blind": "/root/living_acceptance",
    "memory": "/root/living_memory"
  },
  "blind": {
    "status": "clean",
    "agent": "/root/living_acceptance",
    "findingsFixed": [
      "Inherited skip link positioning and keyboard focus target."
    ],
    "outstanding": [],
    "evidence": "visual-qa.md; production Playwright suite: 40 passed"
  },
  "craft": {
    "status": "clean",
    "agent": "/root/living_craft",
    "findingsFixed": [
      "Short landscape cover photograph collapsed.",
      "Small portrait spread text clipped."
    ],
    "outstanding": []
  }
}
