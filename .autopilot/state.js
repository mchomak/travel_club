window.STATE =
{
  "slug": "trip-day-maps",
  "dir": "2026-10-17-trip-day-maps--wip",
  "title": "Travel Club \u2014 \u043a\u0430\u0440\u0442\u0430 \u0438 \u043c\u0430\u0440\u0448\u0440\u0443\u0442\u044b \u0434\u043d\u044f",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T2",
  "briefFile": "2026-10-17-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-17T00:59:41+03:00",
  "updatedAt": "2026-10-17T01:22:56+03:00",
  "finishedAt": null,
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-10-17T00:59:41+03:00",
      "finishedAt": "2026-10-17T01:01:56+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "finishedAt": "2026-10-17T01:01:56+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "note": "full: existing answers and self-briefing"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-17T01:01:56+03:00",
      "finishedAt": "2026-10-17T01:07:08+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "startedAt": "2026-10-17T01:07:08+03:00",
      "finishedAt": "2026-10-17T01:07:08+03:00",
      "note": "T2: 5 tasks / 4 waves"
    },
    {
      "id": "build",
      "status": "active",
      "startedAt": "2026-10-17T01:07:08+03:00"
    },
    {
      "id": "review",
      "status": "active",
      "startedAt": "2026-10-17T01:22:56+03:00"
    },
    {
      "id": "final",
      "status": "pending"
    }
  ],
  "requirements": {
    "total": 25,
    "done": 0,
    "inTicket": 24,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 1,
    "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "Place persistence",
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "backend aggregate",
        "frontend shared DTO"
      ],
      "status": "review",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-10-17T01:07:08+03:00"
    },
    {
      "id": "02",
      "title": "Geoapify service",
      "blockedBy": [
        "01"
      ],
      "wave": 2,
      "zone": [
        "backend maps",
        "runtime configuration",
        "setup docs"
      ],
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    },
    {
      "id": "03",
      "title": "Day route logic",
      "blockedBy": [
        "01"
      ],
      "wave": 2,
      "zone": [
        "frontend/src/lib/day-route.ts"
      ],
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    },
    {
      "id": "04",
      "title": "Day map UI",
      "blockedBy": [
        "01",
        "02",
        "03"
      ],
      "wave": 3,
      "zone": [
        "frontend trips UI",
        "frontend maps client",
        "frontend packages"
      ],
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    },
    {
      "id": "05",
      "title": "Local acceptance",
      "blockedBy": [
        "04"
      ],
      "wave": 4,
      "zone": [
        "e2e map",
        "QA docs"
      ],
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    }
  ],
  "singlePass": null,
  "tests": {
    "frontendBaseline": "94 passed /21files"
  },
  "debt": {
    "placeholders": [],
    "assumptions": [],
    "emptyEnv": [
      "GEOAPIFY_MAPS_API_KEY",
      "GEOAPIFY_API_KEY"
    ]
  },
  "additions": [],
  "coverage": {
    "found": 2,
    "fixed": 2,
    "deferred": 0,
    "note": "G2 independent: details location and reproducible provider setup clarified.",
    "reviewedBy": "/root/map_spec_gate"
  },
  "concerns": [],
  "reviewers": {
    "manifestSpec": "/root/map_review_spec",
    "craft": "/root/map_review_craft"
  },
  "blind": null
}
