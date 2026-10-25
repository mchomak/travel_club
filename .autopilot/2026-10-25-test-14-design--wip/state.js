window.STATE =
{
  "updatedAt": "2026-10-24T22:07:52.3081655+00:00",
  "reviewers": {
    "manifestSpec": "/root/spec_coverage",
    "blind": "/root/blind_acceptance",
    "memory": "/root/test14_memory",
    "craft": "/root/design_review"
  },
  "debt": {
    "emptyEnv": [],
    "placeholders": [],
    "assumptions": [
      "Retain desktop support boundary and factual content. Final design system follows approval of test_14."
    ]
  },
  "mode": "full",
  "dir": "2026-10-25-test-14-design--wip",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "requirements": {
    "inTicket": 0,
    "deferred": 2,
    "inSpec": 0,
    "placeholder": 0,
    "total": 14,
    "done": 12,
    "dropped": 0
  },
  "startedAt": "2026-10-25T00:14:14.4036271+03:00",
  "memoryFile": "AGENTS.md",
  "tickets": [],
  "concerns": [
    "Production build blocked EPERM on unrelated prerender routes",
    "Docker engine access denied; localhost3000 not updated",
    "Prior ignored nested screenshot design-system-final.png accidentally removed during executor cleanup; no tracked source affected",
    "Root full unit rerun stalled without result; initial executor161passed is only completed unit result"
  ],
  "slug": "test-14-design",
  "finishedAt": "2026-10-24T22:07:52.3081655+00:00",
  "polish": null,
  "tier": "T0",
  "title": "Travel Club / test_14",
  "depth": "normal",
  "briefFile": "2026-10-25-brief.md",
  "stages": [
    {
      "id": "preflight",
      "status": "done"
    },
    {
      "id": "manifest",
      "status": "done"
    },
    {
      "id": "briefing",
      "status": "skipped"
    },
    {
      "id": "spec",
      "status": "done"
    },
    {
      "id": "plan",
      "status": "skipped",
      "note": "T0: one coherent frontend iteration, single executor"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-25T00:15:40.1820421+03:00",
      "finishedAt": "2026-10-25T01:06:39.6627693+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-25T01:02:23.9521918+03:00",
      "finishedAt": "2026-10-25T01:06:39.6627693+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-25T01:06:39.6627693+03:00",
      "finishedAt": "2026-10-24T22:07:52.3081655+00:00",
      "note": "Implemented and locally checked; production integration remains blocked by environment"
    }
  ],
  "singlePass": {
    "startedAt": "2026-10-25T00:15:40.1820421+03:00",
    "commit": null,
    "files": [
      "frontend/src/app/test_14/",
      "frontend/src/components/test_14/",
      "frontend/public/test_14/",
      "frontend/e2e/test-14-design.spec.ts",
      "frontend/qa-test14-offline.cjs",
      "frontend/qa-test14-bundle.cjs",
      "frontend/qa-test14-behavior.cjs"
    ],
    "finishedAt": "2026-10-24T22:07:52.3081655+00:00",
    "tests": {
      "lint": "passed",
      "HTTPIntegration": "environment blocked",
      "staticStatesPassed": 10,
      "unitPassed": 161,
      "typecheck": "passed",
      "productionBuild": "environment blocked",
      "mountedClient": "passed"
    }
  },
  "coverage": {
    "found": 2,
    "verdict": "PASS after font-selection and folder-access clarification; ISSUE selected text confirmed in browser comment",
    "deferred": 0,
    "fixed": 2
  },
  "tests": {
    "lint": "passed",
    "HTTPIntegration": "environment blocked",
    "staticStatesPassed": 10,
    "unitPassed": 161,
    "typecheck": "passed",
    "productionBuild": "environment blocked",
    "mountedClient": "passed"
  },
  "blind": {
    "verdict": "Static accepted; mounted source-client behavior independently reviewed; real HTTP/prerender unverified",
    "drift": [],
    "agent": "/root/blind_acceptance"
  }
}
