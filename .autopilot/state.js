window.AUTOPILOT = {
  "slug": "test-20-annotated-updates",
  "dir": "2026-10-26-test-20-annotated-updates",
  "title": "test_20 visual updates",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T0",
  "briefFile": "2026-10-28-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:\\Users\\McHomak\\.agents\\skills\\autopilot",
  "startedAt": "2026-10-26T12:49:31+03:00",
  "updatedAt": "2026-10-28T12:50:37+03:00",
  "finishedAt": "2026-10-28T12:50:37+03:00",
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-26T12:49:31+03:00",
      "finishedAt": "2026-10-26T12:50:14+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-28T12:13:24+03:00",
      "finishedAt": "2026-10-28T12:20:05+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "startedAt": "2026-10-28T12:20:05+03:00",
      "finishedAt": "2026-10-28T12:20:05+03:00",
      "note": "continued the existing project run; no additional briefing needed"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-28T12:22:14+03:00",
      "finishedAt": "2026-10-28T12:23:12+03:00"
    },
    {
      "id": "plan",
      "status": "skipped",
      "startedAt": "2026-10-28T12:23:12+03:00",
      "finishedAt": "2026-10-28T12:23:57+03:00",
      "note": "T0 single pass; no tickets"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-28T12:23:57+03:00",
      "finishedAt": "2026-10-28T12:50:37+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-28T12:50:37+03:00",
      "finishedAt": "2026-10-28T12:50:37+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-28T12:50:37+03:00",
      "finishedAt": "2026-10-28T12:50:37+03:00"
    }
  ],
  "requirements": {
    "total": 26,
    "done": 26,
    "inTicket": 0,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [],
  "singlePass": {
    "startedAt": "2026-10-28T12:23:57+03:00",
    "finishedAt": "2026-10-28T12:50:37+03:00",
    "files": [
      "frontend/src/components/test_20/concept-home.tsx",
      "frontend/src/components/test_20/concept.module.css",
      "frontend/public/test_20/china-pattern.svg",
      "frontend/e2e/test-20-visual-corrections.spec.ts"
    ],
    "tests": {
      "passed": 286,
      "failed": 0
    },
    "status": "done"
  },
  "tests": {
    "passed": 286,
    "failed": 0
  },
  "debt": {
    "placeholders": [],
    "assumptions": [],
    "emptyEnv": []
  },
  "additions": [],
  "concerns": [],
  "reviewers": {
    "manifestSpec": "G2 recheck passed: 0 missing, 0 partial; R22 clarification covered.",
    "craft": "T0 inline review passed across Manifest, Spec, and Craft; staged diff reviewed."
  },
  "blind": {
    "matched": 5,
    "checked": 5,
    "mismatches": [],
    "evidence": "HTTP 200 at /test_20; focused browser verification passed 5/5."
  },
  "coverage": {
    "missing": 0,
    "partial": 0,
    "unrequestedDetails": 7,
    "reviewRounds": 2,
    "verdict": "pass",
    "resolvedFindings": [
      {
        "requirement": "R21",
        "resolution": "Light backing wraps only the service number and English name."
      },
      {
        "requirement": "R22",
        "resolution": "One two-line note appears at poster lower left; the conflicting badge is removed."
      },
      {
        "requirement": "R23",
        "resolution": "FIELD NOTES icon uses #CE3C28."
      },
      {
        "requirement": "R24",
        "resolution": "Year is upper right; trip caption remains lower left at desktop and mobile."
      },
      {
        "requirement": "R25",
        "resolution": "Muted local SVG ornament repeats under the China section content."
      },
      {
        "requirement": "R26",
        "resolution": "Default remote confirmed as origin/master; unrelated commits excluded."
      }
    ]
  }
};
