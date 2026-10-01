window.STATE =
{
  "slug": "calendar-usability-updates",
  "dir": "2026-10-01-calendar-usability-updates",
  "title": "Правки календаря по аннотациям",
  "mode": "full",
  "depth": "normal",
  "polish": null,
  "tier": "T0",
  "briefFile": "2026-10-01-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/McHomak/.agents/skills/autopilot",
  "startedAt": "2026-10-01T00:26:17+03:00",
  "updatedAt": "2026-10-01T12:44:50+03:00",
  "finishedAt": "2026-10-01T12:44:50+03:00",
  "stages": [
    { "id": "preflight", "status": "done", "startedAt": "2026-10-01T00:26:17+03:00", "finishedAt": "2026-10-01T00:51:57+03:00" },
    { "id": "manifest", "status": "done", "startedAt": "2026-10-01T00:51:57+03:00", "finishedAt": "2026-10-01T00:55:08+03:00" },
    { "id": "briefing", "status": "skipped", "note": "полный автомат — самобрифинг" },
    { "id": "spec", "status": "done", "startedAt": "2026-10-01T00:55:08+03:00", "finishedAt": "2026-10-01T01:56:56+03:00", "note": "G2: независимая проверка не нашла пропусков; уточнения привязаны к R02/R03." },
    { "id": "plan", "status": "done", "startedAt": "2026-10-01T01:56:56+03:00", "finishedAt": "2026-10-01T04:03:33+03:00", "note": "G4 показал пропуск в R03; добавлен ticket 01 для исправления." },
    { "id": "build", "status": "done", "startedAt": "2026-10-01T02:00:18+03:00", "finishedAt": "2026-10-01T12:32:51+03:00", "note": "50 unit, 21 E2E; lint, typecheck и production build passed; Docker frontend пересобран локально и Compose healthy." },
    { "id": "review", "status": "done", "startedAt": "2026-10-01T12:20:00+03:00", "finishedAt": "2026-10-01T12:26:20+03:00", "note": "Оси manifest/spec/craft проверены; уточнение R03 внесено по D01." },
    { "id": "final", "status": "done", "startedAt": "2026-10-01T12:26:20+03:00", "finishedAt": "2026-10-01T12:44:50+03:00", "note": "G4: все три пункта подтверждены; Docker healthy, изменения готовы к публикации в main." }
  ],
  "requirements": { "total": 3, "done": 3, "inTicket": 0, "inSpec": 0, "placeholder": 0, "deferred": 0, "dropped": 0 },
  "tickets": [
    {
      "id": "01",
      "title": "Видимо увеличить календарь",
      "requirements": ["R03"],
      "zone": ["frontend/src/components/trips/trip-calendar.tsx", "frontend/src/components/trips/trip-calendar.test.tsx", "frontend/e2e/constructor.spec.ts"],
      "status": "done",
      "wave": 1,
      "blockedBy": [],
      "startedAt": "2026-10-01T04:03:33+03:00",
      "finishedAt": "2026-10-01T12:26:20+03:00",
      "handoffs": 0,
      "repairs": 0,
      "retries": 0,
      "commit": "0cfd227",
      "files": ["frontend/src/components/trips/trip-calendar.tsx", "frontend/src/components/trips/trip-calendar.test.tsx", "frontend/e2e/constructor.spec.ts"],
      "tests": { "passed": 13, "failed": 0, "e2ePassed": 1 }
    }
  ],
  "singlePass": { "startedAt": "2026-10-01T02:00:18+03:00", "finishedAt": "2026-10-01T12:32:51+03:00", "files": ["frontend/src/components/trips/trip-calendar.tsx", "frontend/src/components/trips/trip-calendar.test.tsx", "frontend/src/app/globals.css", "frontend/e2e/constructor.spec.ts"], "tests": { "passed": 50, "failed": 0, "e2ePassed": 21, "lint": "passed", "typecheck": "passed", "build": "passed", "docker": "healthy" }, "commit": "ticket 01 0cfd227; итоговые файлы прогона добавлены в историю main" },
  "tests": { "lint": "passed", "typecheck": "passed", "failed": 0, "passed": 50, "e2ePassed": 21, "build": "passed", "docker": "healthy" },
  "debt": { "placeholders": [], "assumptions": ["Увеличить видимую временную область до 90vh (минимум 740px), сохраняя прокрутку до конца суток."], "emptyEnv": [] },
  "additions": [],
  "coverage": { "found": 3, "fixed": 3, "deferred": 0, "note": "Проверяющий отметил карандаш с областью 44×44 и планшетную адаптацию. Первоначальная высота 70vh не покрыла короткие окна; G4 нашёл это, после чего R03 уточнён до 90vh и минимума 740px. Все три требования выполнены." },
  "concerns": [],
  "reviewers": { "manifestSpec": "/root/spec_coverage", "craft": null },
  "blind": { "status": "resolved", "finding": "R01 и R02 подтверждены компонентными тестами: подсказки нет, карандаш доступен и редактирует выбранный день. R03 подтверждён высотой 90vh/740px, компонентными и браузерными проверками при 768px и 900px; полный день доступен внутренней прокруткой. Финальный конструкторский прогон: 21 passed. Проверяющий не открывал авторизованный экран напрямую; предметные свойства сверены по компоненту и тестам.", "action": "Первоначальная G4-сверка выявила недостаточный рост календаря. Исправлено ticket 01; повторная G4-сверка подтвердила все пункты. Временная тестовая учётная запись удалена, поездки и существующие учётные записи не менялись." }
}
