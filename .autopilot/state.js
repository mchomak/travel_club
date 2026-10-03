window.STATE =
{
  "slug": "editorial-test-home",
  "dir": "2026-10-03-editorial-test-home",
  "title": "Travel Club — редакционная главная /test",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T0",
  "briefFile": "2026-10-03-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-03T15:49:13+03:00",
  "updatedAt": "2026-10-03T19:24:17+03:00",
  "finishedAt": "2026-10-03T19:24:17+03:00",
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-03T15:49:13+03:00",
      "finishedAt": "2026-10-03T16:11:48+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "finishedAt": "2026-10-03T16:11:48+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "note": "full: self-briefing"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-03T16:11:48+03:00",
      "finishedAt": "2026-10-03T16:31:32+03:00"
    },
    {
      "id": "plan",
      "status": "skipped",
      "note": "T0: one coherent page, single fresh executor"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-03T16:31:32+03:00",
      "finishedAt": "2026-10-03T18:46:47+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "finishedAt": "2026-10-03T18:46:47+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-03T18:46:47+03:00",
      "finishedAt": "2026-10-03T19:24:17+03:00"
    }
  ],
  "requirements": {
    "total": 59,
    "done": 59,
    "inTicket": 0,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [],
  "singlePass": {
    "status": "done",
    "files": [
      "frontend/src/app/test/page.tsx",
      "frontend/src/components/test/",
      "frontend/public/test/",
      "frontend/e2e/test-home.spec.ts"
    ],
    "tests": {
      "unit": 65,
      "browser": 9,
      "lint": "passed",
      "typecheck": "passed",
      "build": "passed"
    },
    "commit": "b8e3f2b",
    "startedAt": "2026-10-03T16:31:32+03:00",
    "finishedAt": "2026-10-03T18:46:47+03:00"
  },
  "tests": {
    "baselineFrontend": 65,
    "frontendUnit": 65,
    "productionBrowser": 9,
    "lint": "passed",
    "typecheck": "passed",
    "build": "passed",
    "dockerFrontend": "passed",
    "responsiveWidths": [
      1440,
      1024,
      390
    ],
    "existingRouteSmoke": "passed",
    "finalCtaFocusContrast": 8.36
  },
  "debt": {
    "placeholders": [
      "Concept issues, dates and photos",
      "Demo form without transmission",
      "Social contacts and legal documents"
    ],
    "assumptions": [
      "One isolated route with scoped CSS",
      "Local Golos Text and Lora fonts",
      "Archive themes change locally"
    ],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": {
    "found": 0,
    "fixed": 0,
    "deferred": 0,
    "source": "Independent original 38-section user prompt versus spec; original conversation used while archive copy is being written"
  },
  "concerns": [],
  "reviewers": {
    "manifestSpec": "root T0 inline",
    "craft": "/root/final_review",
    "blind": "/root/test_home_blind",
    "memory": "/root/test_home_memory",
    "memoryResult": "One source-verified /test note in AGENTS.md; paths checked."
  },
  "blind": {
    "checked": 37,
    "matched": 37,
    "mismatches": [],
    "reviewer": "/root/test_home_blind",
    "runtime": "passed",
    "source": "acceptance.md",
    "note": "All 38 brief sections read. Functional sections 1-37 accepted; section 38 delivery report prepared by root in report.md and final response."
  },
  "reportFile": "report.md"
}
