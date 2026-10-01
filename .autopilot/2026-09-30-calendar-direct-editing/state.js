window.STATE =
{
  "slug": "calendar-direct-editing",
  "dir": "2026-09-30-calendar-direct-editing",
  "title": "Прямое редактирование календаря поездки",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T1",
  "briefFile": "2026-09-30-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-09-30T01:22:30+03:00",
  "updatedAt": "2026-09-30T23:14:29+03:00",
  "finishedAt": "2026-09-30T23:14:29+03:00",
  "stages": [
    {
      "status": "done",
      "startedAt": "2026-09-30T01:22:30+03:00",
      "id": "preflight",
      "finishedAt": "2026-09-30T01:29:14+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-09-30T01:29:14+03:00",
      "finishedAt": "2026-09-30T13:26:44+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "note": "полный автомат — самобрифинг"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-09-30T13:26:44+03:00",
      "finishedAt": "2026-09-30T13:54:17+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "startedAt": "2026-09-30T13:54:17+03:00",
      "finishedAt": "2026-09-30T13:54:17+03:00",
      "note": "4 таска, ярус T1"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-09-30T13:54:17+03:00",
      "note": "4 из 4 тасков готовы; 48 unit и 23 E2E проходят",
      "finishedAt": "2026-09-30T22:57:17+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-09-30T14:43:37+03:00",
      "note": "все таски проверены; G4 замечание исправлено",
      "finishedAt": "2026-09-30T22:57:17+03:00"
    },
    {
      "id": "final",
      "status": "done",
      "startedAt": "2026-09-30T22:29:23+03:00",
      "finishedAt": "2026-09-30T23:14:29+03:00",
      "note": "G4 повторно прошёл; Docker healthy; 48 unit, 23 E2E, 50 backend"
    }
  ],
  "requirements": {
    "done": 18,
    "inTicket": 0,
    "inSpec": 0,
    "total": 18,
    "deferred": 0,
    "dropped": 0,
    "placeholder": 0
  },
  "tickets": [
    {
      "wave": 1,
      "handoffs": 0,
      "id": "01",
      "repairs": 1,
      "retries": 0,
      "blockedBy": [],
      "requirements": [
        "R03",
        "R04",
        "R05",
        "R08",
        "R09",
        "R18i"
      ],
      "zone": [
        "frontend/src/components/trips/trip-calendar.tsx",
        "frontend/src/lib/calendar-interaction.ts"
      ],
      "status": "done",
      "title": "Управление событиями на календаре",
      "startedAt": "2026-09-30T13:56:38+03:00",
      "repairFindings": [
        "R08: end-of-day creation must use 15-minute grid and valid 60-minute tap interval",
        "R18i: normal touch swipe on event or hotel should allow scrolling",
        "R09: overnight move preview must cover next-day segment"
      ],
      "finishedAt": "2026-09-30T15:48:44+03:00",
      "commit": "0738003",
      "tests": {
        "passed": 42,
        "failed": 0
      },
      "files": [
        "frontend/src/components/trips/trip-calendar.tsx",
        "frontend/src/components/trips/trip-calendar.test.tsx",
        "frontend/src/lib/calendar-interaction.ts",
        "frontend/src/lib/calendar-interaction.test.ts"
      ]
    },
    {
      "wave": 1,
      "handoffs": 0,
      "id": "02",
      "repairs": 2,
      "retries": 0,
      "blockedBy": [],
      "requirements": [
        "R06",
        "R07",
        "R11",
        "R12",
        "R13",
        "R14",
        "R15",
        "R16"
      ],
      "zone": [
        "frontend/src/components/trips/item-form.tsx",
        "frontend/src/components/trips/ui.tsx"
      ],
      "status": "done",
      "title": "Контекстная боковая форма",
      "startedAt": "2026-09-30T13:56:38+03:00",
      "repairFindings": [
        "R12: поля заселения/выселения показываются не-гостиничному типу при режиме hotel",
        "R12: non-hotel + hotel calculation mode must remain correctable, not hidden-invalid"
      ],
      "finishedAt": "2026-09-30T15:06:00+03:00",
      "commit": "629a4db",
      "tests": {
        "passed": 40,
        "failed": 0
      },
      "files": [
        "frontend/src/components/trips/item-form.tsx",
        "frontend/src/components/trips/item-form.test.tsx",
        "frontend/src/components/trips/ui.tsx",
        "frontend/src/components/trips/ui.test.tsx"
      ]
    },
    {
      "wave": 2,
      "handoffs": 1,
      "id": "03",
      "repairs": 2,
      "retries": 0,
      "blockedBy": [
        "01",
        "02"
      ],
      "requirements": [
        "R01",
        "R02",
        "R03",
        "R04",
        "R05",
        "R06",
        "R07",
        "R08",
        "R09",
        "R10",
        "R17i",
        "R18i"
      ],
      "zone": [
        "frontend/src/components/trips/trip-editor.tsx",
        "frontend/src/app/globals.css",
        "frontend/e2e/constructor.spec.ts"
      ],
      "status": "done",
      "title": "Единый рабочий экран",
      "startedAt": "2026-09-30T15:49:24+03:00",
      "finishedAt": "2026-09-30T22:29:23+03:00",
      "commit": "71a3dee, 913c6b8, 2aacea9, bbdb515",
      "repairFindings": [
        "E2E: creation gesture and old price labels; HH:MM:SS saved-item drag",
        "Financial: unknown calculation displayed false zero; hotel retained hidden generic times",
        "Category switch hotel to timed type lost the selected interval"
      ],
      "tests": {
        "passed": 48,
        "failed": 0,
        "e2ePassed": 22
      },
      "note": "Первый исполнитель прерван лимитом агента; незакоммиченная работа передана преемнику через handoff-03-1.md."
    },
    {
      "wave": 3,
      "handoffs": 0,
      "id": "04",
      "repairs": 0,
      "retries": 0,
      "blockedBy": [
        "03"
      ],
      "requirements": [
        "R07"
      ],
      "zone": [
        "frontend/src/app/globals.css",
        "frontend/src/components/trips/ui.test.tsx",
        "frontend/e2e/constructor.spec.ts"
      ],
      "status": "done",
      "startedAt": "2026-09-30T22:38:42+03:00",
      "title": "Выдвижение панели на всю ширину",
      "finishedAt": "2026-09-30T22:57:17+03:00",
      "commit": "7b952db",
      "tests": {
        "passed": 48,
        "failed": 0,
        "e2ePassed": 23
      }
    }
  ],
  "singlePass": null,
  "tests": {
    "lint": "passed",
    "typecheck": "passed",
    "failed": 0,
    "passed": 48,
    "e2ePassed": 23,
    "backendPassed": 50,
    "build": "passed"
  },
  "debt": {
    "emptyEnv": [],
    "placeholders": [],
    "assumptions": [
      "Заголовок дня показывает сумму цен визуально присутствующих событий; многодневная цена повторяется в нескольких заголовках, но общая смета поездки не меняется.",
      "Создание интервала на сетке открывает новый пункт с обязательным выбором типа; обычные кнопки добавления сразу задают тип.",
      "Перемещение события сохраняет длительность, а выход за границы поездки отменяется без изменения данных."
    ]
  },
  "additions": [],
  "coverage": {
    "deferred": 0,
    "found": 3,
    "fixed": 3,
    "note": "Независимая сверка выявила проживание, наборы полей и буквальный показатель стоимости; спецификация исправлена."
  },
  "concerns": [
    "Исправлено: последняя четверть часа выбирает 23:45–23:59, так как серверный формат времени не допускает 24:00."
  ],
  "reviewers": {
    "craft": "/root/review_craft_new",
    "manifestSpec": "/root/review_manifest_spec"
  },
  "blind": {
    "status": "resolved",
    "finding": "R07: первоначальный сдвиг панели 28 px был лишь частичным выполнением.",
    "action": "Таск 04: полное выдвижение; независимый повторный G4 и браузерная проверка прошли."
  }
}
