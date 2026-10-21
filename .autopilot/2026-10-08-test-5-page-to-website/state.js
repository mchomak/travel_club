window.STATE =
{
  "slug": "test-5-page-to-website",
  "dir": "2026-10-08-test-5-page-to-website",
  "title": "Travel Club /test_5 — страница становится сайтом",
  "mode": "full",
  "depth": "normal",
  "tier": "T1",
  "polish": null,
  "briefFile": "2026-10-08-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-08T02:04:30+03:00",
  "updatedAt": "2026-10-08T09:31:40+03:00",
  "finishedAt": "2026-10-08T09:31:40+03:00",
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-08T02:04:30+03:00",
      "finishedAt": "2026-10-08T02:04:30+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-08T02:04:30+03:00",
      "finishedAt": "2026-10-08T02:04:30+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "note": "Full mode; complete user brief supplied"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-08T02:04:30+03:00",
      "finishedAt": "2026-10-08T02:05:43+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "finishedAt": "2026-10-08T02:05:43+03:00"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-08T02:05:43+03:00",
      "finishedAt": "2026-10-08T09:31:40+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-08T02:41:10+03:00",
      "finishedAt": "2026-10-08T09:31:40+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-08T03:01:02+03:00",
      "finishedAt": "2026-10-08T09:31:40+03:00"
    }
  ],
  "requirements": {
    "total": 89,
    "done": 89,
    "inTicket": 0,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "Isolated source copy",
      "requirements": [
        "source-first",
        "preservation"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "test_5"
      ],
      "status": "done",
      "startedAt": "2026-10-08T02:05:43+03:00",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "finishedAt": "2026-10-08T02:21:20+03:00",
      "tests": {
        "passed": 5,
        "failed": 0
      },
      "commit": "bba4c5d"
    },
    {
      "id": "02",
      "title": "Right page becomes homepage",
      "requirements": [
        "opening",
        "continuity",
        "qa"
      ],
      "blockedBy": [
        "01"
      ],
      "wave": 2,
      "zone": [
        "test_5"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 3,
      "handoffs": 0,
      "startedAt": "2026-10-08T02:21:20+03:00",
      "finishedAt": "2026-10-08T09:31:40+03:00",
      "commit": "eb589b2",
      "tests": {
        "passed": 15,
        "failed": 0
      }
    }
  ],
  "singlePass": null,
  "tests": {
    "passed": 97,
    "failed": 0,
    "unit": 67,
    "browser": 30,
    "lint": "passed",
    "typecheck": "passed",
    "build": "passed",
    "dockerFrontend": "healthy"
  },
  "debt": {
    "placeholders": [],
    "assumptions": [
      "Independent local photo storage for test_5",
      "Opening journey uses 1.25 viewports"
    ],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": {
    "findings": 0,
    "verdict": "clean"
  },
  "concerns": [
    {
      "file": "frontend/src/components/test_5/living-issue.tsx:30",
      "condition": "Keyboard skip focuses #start after inert is lifted",
      "verdict": "fixed",
      "evidence": "Red reproduction; pending focus serviced after inert=false; keyboard assertion green; scoped craft review clean"
    },
    {
      "file": "frontend/src/components/test_5/living-issue.module.css",
      "condition": "Global #start target selector hides opening before hydration and without JavaScript",
      "verdict": "fixed",
      "evidence": "Unscoped attribute selectors; red strong assertion then final production30 passed; clean screenshots and scoped craft review"
    }
  ],
  "reviewers": {
    "manifestSpec": "/root/spec_check",
    "craft": "/root/craft"
  },
  "blind": {
    "checked": 32,
    "matched": 32,
    "mismatches": [],
    "status": "accepted",
    "findings": 2,
    "resolved": 2,
    "note": "G4 independently accepted all product sections; section32 is report.md and final response. Strong prehydration/no-JavaScript screenshot checks passed."
  },
  "interruptions": [
    "Final acceptance interrupted by usage limit; user explicitly resumed full mode on 2026-10-08."
  ]
}
