window.STATE = {
  "singlePass": null,
  "dir": "2026-10-05-test-2-editorial-polish",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "tier": "T1",
  "startedAt": "2026-10-05T03:09:43+03:00",
  "blind": {
    "matched": 11,
    "checked": 11,
    "mismatches": []
  },
  "finishedAt": "2026-10-05T13:53:18+03:00",
  "requirements": {
    "deferred": 0,
    "inTicket": 0,
    "total": 14,
    "done": 14,
    "dropped": 0,
    "placeholder": 0,
    "inSpec": 0
  },
  "tickets": [
    {
      "id": "01",
      "blockedBy": [],
      "wave": 1,
      "status": "done",
      "zone": [
        "test_2/living-issue"
      ],
      "retries": 0,
      "handoffs": 0,
      "title": "Плавное открытие журнала",
      "requirements": [
        "R01",
        "R13"
      ],
      "repairs": 2,
      "startedAt": "2026-10-05T03:19:45+03:00",
      "repairFindings": [
        "Разворот скрыт при reduced motion и от ассистивных технологий; R01 требует доступного содержимого.",
        "При reduced motion и экране 800–1440×501px разворот обрезан viewport; R01 требует доступного содержимого."
      ],
      "finishedAt": "2026-10-05T12:48:57+03:00",
      "files": [
        "frontend/src/components/test_2/living-issue.tsx",
        "frontend/src/components/test_2/living-issue.module.css",
        "frontend/src/components/test_2/issue-content.ts"
      ],
      "tests": {
        "failed": 0,
        "passed": 67
      },
      "commit": "51ec520"
    },
    {
      "id": "02",
      "blockedBy": [],
      "wave": 1,
      "status": "done",
      "zone": [
        "test_2/editorial TSX",
        "test_2/editorial CSS initial copy"
      ],
      "retries": 0,
      "handoffs": 0,
      "title": "Русский контент и визуальные блоки",
      "requirements": [
        "R05",
        "R08",
        "R09",
        "R10",
        "R11",
        "R13"
      ],
      "repairs": 0,
      "startedAt": "2026-10-05T03:19:45+03:00",
      "finishedAt": "2026-10-05T12:45:33+03:00",
      "files": [
        "frontend/src/components/test_2/editorial-home.tsx",
        "frontend/src/components/test_2/lead-form.tsx",
        "frontend/src/components/test_2/data.ts",
        "frontend/src/components/test_2/format-motif.tsx",
        "frontend/src/components/test_2/editorial.module.css",
        "frontend/e2e/living-issue.spec.ts"
      ],
      "tests": {
        "failed": 0,
        "passed": 67
      },
      "commit": "3c88094"
    },
    {
      "id": "03",
      "blockedBy": [
        "02"
      ],
      "wave": 2,
      "status": "done",
      "zone": [
        "test_2/editorial CSS",
        "frontend/public/test"
      ],
      "retries": 0,
      "handoffs": 0,
      "title": "Читаемость, фото и Docker",
      "requirements": [
        "R02",
        "R03",
        "R04",
        "R05",
        "R06",
        "R07",
        "R08",
        "R09",
        "R11",
        "R12",
        "R14"
      ],
      "repairs": 1,
      "startedAt": "2026-10-05T12:45:33+03:00",
      "repairFindings": [
        "R02: три обычных абзаца на ПК оставались прежнего размера; исправлено. Замечание по подписи обложки снято после пересчёта."
      ],
      "finishedAt": "2026-10-05T13:36:06+03:00",
      "commit": "5a6f2fc",
      "tests": {
        "failed": 0,
        "passed": 67
      }
    }
  ],
  "briefFile": "2026-10-05-brief.md",
  "tests": {
    "passed": 107,
    "failed": 0
  },
  "coverage": {
    "found": 3,
    "fixed": 3,
    "deferred": 0
  },
  "slug": "test-2-editorial-polish",
  "concerns": [
    "Снято: e2e локализации не перечисляет aria/alt/placeholders; видимый русский текст подтверждён независимой браузерной приёмкой, доступность разворота проверена отдельно.",
    "Снято: e2e печатных вставок проверяет количество; содержимое и внешний вид подтверждены независимой браузерной приёмкой.",
    "Снято: увеличенные мобильные абзацы не создают горизонтального переполнения, проверено в браузере на 390 px."
  ],
  "depth": "normal",
  "updatedAt": "2026-10-05T13:53:18+03:00",
  "title": "Travel Club — правки страницы /test_2",
  "stages": [
    {
      "id": "preflight",
      "startedAt": "2026-10-05T03:09:43+03:00",
      "status": "done",
      "finishedAt": "2026-10-05T03:10:31+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-10-05T03:10:31+03:00",
      "finishedAt": "2026-10-05T03:17:17+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "note": "полный автомат — самобрифинг"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-10-05T03:17:17+03:00",
      "finishedAt": "2026-10-05T03:18:26+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "startedAt": "2026-10-05T03:18:26+03:00",
      "finishedAt": "2026-10-05T03:19:19+03:00",
      "note": "3 таска, ярус T1"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-10-05T03:19:19+03:00",
      "note": "3 из 3 тасков готовы",
      "finishedAt": "2026-10-05T13:36:15+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-10-05T03:34:00+03:00",
      "note": "все 3 таска проверены",
      "finishedAt": "2026-10-05T13:36:15+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-10-05T13:36:06+03:00",
      "finishedAt": "2026-10-05T13:53:18+03:00"
    }
  ],
  "debt": {
    "emptyEnv": [],
    "assumptions": [
      "«на сайте» означает запрошенную /test_2",
      "равный размер касается фото в блоке выбора выпуска",
      "новые снимки — лицензированные иллюстрации, не участники"
    ],
    "placeholders": []
  },
  "polish": null,
  "mode": "full",
  "additions": [],
  "memoryFile": "AGENTS.md",
  "reviewers": {
    "craft": "/root/craft_review",
    "manifestSpec": "/root/spec_coverage"
  }
}
