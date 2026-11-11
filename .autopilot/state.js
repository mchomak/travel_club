window.STATE =
{
  "slug": "repository-architecture",
  "dir": "2026-11-11-repository-architecture--wip",
  "title": "\u0410\u0440\u0445\u0438\u0442\u0435\u043a\u0442\u0443\u0440\u043d\u0430\u044f \u0440\u0435\u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0446\u0438\u044f Travel Club",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T3",
  "briefFile": "2026-11-11-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-11-11T01:22:47+03:00",
  "updatedAt": "2026-11-11T03:02:47+03:00",
  "finishedAt": null,
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-11-11T01:22:47+03:00",
      "finishedAt": "2026-11-11T01:24:58+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-11-11T01:24:58+03:00",
      "finishedAt": "2026-11-11T01:39:24+03:00"
    },
    {
      "id": "briefing",
      "status": "done",
      "finishedAt": "2026-11-11T01:39:24+03:00"
    },
    {
      "id": "spec",
      "status": "done",
      "finishedAt": "2026-11-11T01:39:24+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "finishedAt": "2026-11-11T01:39:24+03:00"
    },
    {
      "id": "build",
      "status": "active",
      "startedAt": "2026-11-11T01:39:24+03:00"
    },
    {
      "id": "review",
      "status": "pending"
    },
    {
      "id": "final",
      "status": "pending"
    }
  ],
  "requirements": {
    "total": 270,
    "done": 0,
    "inTicket": 270,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "Website",
      "requirements": [
        "R01-R97"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "apps/website/"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-11-11T01:39:24+03:00",
      "finishedAt": "2026-11-11T03:02:47+03:00",
      "commit": "7267dd3",
      "tests": {
        "passed": 13,
        "failed": 0
      }
    },
    {
      "id": "02",
      "title": "Trip Constructor",
      "requirements": [
        "R01-R97"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "apps/trip-constructor/"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-11-11T01:39:24+03:00",
      "finishedAt": "2026-11-11T01:57:26+03:00",
      "commit": "0359fc4",
      "tests": {
        "passed": 173,
        "failed": 0
      }
    },
    {
      "id": "03",
      "title": "Interviews",
      "requirements": [
        "R01-R97"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "apps/interviews/"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 2,
      "handoffs": 0,
      "startedAt": "2026-11-11T01:39:24+03:00",
      "finishedAt": "2026-11-11T02:52:15+03:00",
      "commit": "a74c9e6 + f84039e + 5e3c01c",
      "tests": {
        "passed": 51,
        "failed": 0
      },
      "repairFindings": [
        "Default build does not set isolated static prefix",
        "Deep-link return target lost after login"
      ]
    },
    {
      "id": "04",
      "title": "Routing and cleanup",
      "requirements": [
        "R01-R97"
      ],
      "blockedBy": [
        "01",
        "02",
        "03"
      ],
      "wave": 2,
      "zone": [
        "root and infrastructure"
      ],
      "status": "in-progress",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-11-11T02:28:55+03:00",
      "note": "Gateway groundwork only; legacy cleanup waits for Website"
    },
    {
      "id": "05",
      "title": "Acceptance and documentation",
      "requirements": [
        "R01-R267",
        "G01-G03"
      ],
      "blockedBy": [
        "04"
      ],
      "wave": 3,
      "zone": [
        "docs and acceptance"
      ],
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    }
  ],
  "singlePass": null,
  "tests": {
    "passed": 177,
    "failed": 0
  },
  "debt": {
    "placeholders": [],
    "assumptions": [],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": {
    "found": 12,
    "fixed": 12,
    "deferred": 0
  },
  "concerns": [],
  "reviewers": {
    "manifestSpec": null,
    "craft": null
  },
  "blind": null
}
