window.STATE =
{
    "slug":  "trip-calendar-planner",
    "dir":  "2026-09-29-trip-calendar-planner",
    "title":  "Календарь конструктора поездок",
    "mode":  "full",
    "depth":  "normal",
    "polish":  null,
    "tier":  "T2",
    "briefFile":  "2026-09-29-brief.md",
    "memoryFile":  "AGENTS.md",
    "skillDir":  "C:/Users/McHomak/.agents/skills/autopilot",
    "startedAt":  "2026-09-29T16:41:32+03:00",
    "updatedAt":  "2026-09-30T00:41:55+03:00",
    "finishedAt":  "2026-09-30T00:41:55+03:00",
    "stages":  [
                   {
                       "id":  "preflight",
                       "status":  "done",
                       "startedAt":  "2026-09-29T16:41:32+03:00",
                       "finishedAt":  "2026-09-29T16:48:34+03:00"
                   },
                   {
                       "id":  "manifest",
                       "status":  "done",
                       "startedAt":  "2026-09-29T16:48:34+03:00",
                       "finishedAt":  "2026-09-29T16:54:02+03:00"
                   },
                   {
                       "id":  "briefing",
                       "status":  "done",
                       "startedAt":  "2026-09-29T16:54:02+03:00",
                       "finishedAt":  "2026-09-29T17:14:30+03:00",
                       "note":  "R03: местное время без пересчёта; с этапа спецификации — полный автомат"
                   },
                   {
                       "id":  "spec",
                       "status":  "done",
                       "startedAt":  "2026-09-29T17:14:30+03:00",
                       "finishedAt":  "2026-09-29T17:25:47+03:00"
                   },
                   {
                       "id":  "plan",
                       "status":  "done",
                       "startedAt":  "2026-09-29T17:25:47+03:00",
                       "finishedAt":  "2026-09-29T17:28:04+03:00",
                       "note":  "8 тасков, ярус T2 (три добавлены после проверок)"
                   },
                   {
                       "id":  "build",
                       "status":  "done",
                       "startedAt":  "2026-09-29T17:28:04+03:00",
                       "note":  "8 из 8 тасков готовы",
                       "finishedAt":  "2026-09-30T00:26:22+03:00"
                   },
                   {
                       "id":  "review",
                       "status":  "done",
                       "startedAt":  "2026-09-29T17:51:58+03:00",
                       "note":  "проверено 8 из 8",
                       "finishedAt":  "2026-09-30T00:26:22+03:00"
                   },
                   {
                       "id":  "final",
                       "status":  "done",
                       "startedAt":  "2026-09-30T00:26:22+03:00",
                       "finishedAt":  "2026-09-30T00:41:55+03:00"
                   }
               ],
    "requirements":  {
                         "total":  16,
                         "done":  16,
                         "inTicket":  0,
                         "inSpec":  0,
                         "placeholder":  0,
                         "deferred":  0,
                         "dropped":  0
                     },
    "tickets":  [
                    {
                        "wave":  1,
                        "handoffs":  0,
                        "id":  "01",
                        "repairs":  1,
                        "retries":  0,
                        "blockedBy":  [

                                      ],
                        "requirements":  [
                                             "R03",
                                             "R06",
                                             "R07",
                                             "R13"
                                         ],
                        "zone":  [
                                     "backend/app/",
                                     "backend/migrations/",
                                     "backend/tests/",
                                     "frontend/src/lib/contracts.ts",
                                     "frontend/src/lib/trips.ts",
                                     "frontend/src/lib/trip-ui.ts"
                                 ],
                        "status":  "done",
                        "title":  "Сохранение расписания и статусов",
                        "startedAt":  "2026-09-29T17:28:26+03:00",
                        "repairFindings":  [
                                               "Расчёт отклоняет end_day_id с днём вне текущего диапазона тура"
                                           ],
                        "finishedAt":  "2026-09-29T18:07:17+03:00",
                        "commit":  "6999149",
                        "files":  [
                                      "backend/app/models.py",
                                      "backend/app/schemas.py",
                                      "backend/app/trips.py",
                                      "backend/migrations/versions/8b97c412e6af_schedule_fields.py",
                                      "backend/tests/test_trips.py",
                                      "frontend/src/lib/contracts.ts",
                                      "frontend/src/lib/trips.ts",
                                      "frontend/src/lib/trip-ui.ts"
                                  ],
                        "tests":  {
                                      "passed":  55,
                                      "failed":  0
                                  }
                    },
                    {
                        "wave":  2,
                        "handoffs":  0,
                        "id":  "02",
                        "repairs":  0,
                        "retries":  0,
                        "blockedBy":  [
                                          "01"
                                      ],
                        "requirements":  [
                                             "R01",
                                             "R02",
                                             "R03",
                                             "R08",
                                             "R09",
                                             "R12",
                                             "R16"
                                         ],
                        "zone":  [
                                     "frontend/src/lib/calendar*",
                                     "frontend/src/components/trips/trip-calendar*"
                                 ],
                        "status":  "done",
                        "title":  "Календарное расписание",
                        "startedAt":  "2026-09-29T18:07:17+03:00",
                        "finishedAt":  "2026-09-29T18:16:24+03:00",
                        "commit":  "59fbb4c",
                        "files":  [
                                      "frontend/src/lib/calendar.ts",
                                      "frontend/src/lib/calendar.test.ts",
                                      "frontend/src/components/trips/trip-calendar.tsx",
                                      "frontend/src/components/trips/trip-calendar.test.tsx"
                                  ],
                        "tests":  {
                                      "passed":  65,
                                      "failed":  0
                                  }
                    },
                    {
                        "wave":  2,
                        "handoffs":  0,
                        "id":  "03",
                        "repairs":  1,
                        "retries":  0,
                        "blockedBy":  [
                                          "01"
                                      ],
                        "requirements":  [
                                             "R04",
                                             "R06",
                                             "R07",
                                             "R13"
                                         ],
                        "zone":  [
                                     "frontend/src/components/trips/item-form.tsx",
                                     "frontend/src/components/trips/editor-panels.tsx",
                                     "frontend/src/components/trips/ui.tsx"
                                 ],
                        "status":  "done",
                        "title":  "Формы дня и события",
                        "startedAt":  "2026-09-29T18:07:17+03:00",
                        "repairFindings":  [
                                               "Старый ночной пункт последнего дня можно открыть и сохранить без потери данных"
                                           ],
                        "finishedAt":  "2026-09-29T18:42:57+03:00",
                        "commit":  "83f0ecc",
                        "files":  [
                                      "frontend/src/components/trips/item-form.tsx",
                                      "frontend/src/components/trips/editor-panels.tsx",
                                      "frontend/src/components/trips/ui.tsx",
                                      "frontend/src/components/trips/item-form.test.tsx",
                                      "frontend/src/components/trips/editor-panels.test.tsx"
                                  ],
                        "tests":  {
                                      "passed":  66,
                                      "failed":  0
                                  }
                    },
                    {
                        "wave":  3,
                        "handoffs":  0,
                        "id":  "04",
                        "repairs":  1,
                        "retries":  0,
                        "blockedBy":  [
                                          "02",
                                          "03"
                                      ],
                        "requirements":  [
                                             "R01",
                                             "R02",
                                             "R03",
                                             "R04",
                                             "R05",
                                             "R06",
                                             "R08",
                                             "R09",
                                             "R10",
                                             "R11",
                                             "R12",
                                             "R13",
                                             "R16"
                                         ],
                        "zone":  [
                                     "frontend/src/components/trips/trip-editor.tsx",
                                     "frontend/src/app/globals.css",
                                     "frontend/e2e/",
                                     "docs/acceptance.md"
                                 ],
                        "status":  "done",
                        "title":  "Календарный конструктор и адаптация",
                        "startedAt":  "2026-09-29T18:42:57+03:00",
                        "repairFindings":  [
                                               "Пункты только с одним заполненным временем видны в списке без валидного интервала"
                                           ],
                        "finishedAt":  "2026-09-29T22:14:46+03:00",
                        "commit":  "eca4721",
                        "files":  [
                                      "frontend/src/components/trips/trip-editor.tsx",
                                      "frontend/src/app/globals.css",
                                      "frontend/e2e/constructor.spec.ts",
                                      "docs/acceptance.md"
                                  ],
                        "tests":  {
                                      "note":  "E2E 19/21 после Compose, ремонт в таске 06",
                                      "failed":  0,
                                      "passed":  66
                                  }
                    },
                    {
                        "wave":  6,
                        "handoffs":  0,
                        "id":  "05",
                        "repairs":  0,
                        "retries":  0,
                        "blockedBy":  [
                                          "07",
                                          "08"
                                      ],
                        "requirements":  [
                                             "R14",
                                             "R15"
                                         ],
                        "zone":  [
                                     ".autopilot/",
                                     "docs/",
                                     "Git",
                                     "Docker Compose"
                                 ],
                        "status":  "done",
                        "title":  "Выпуск main и запуск Docker",
                        "startedAt":  "2026-09-30T00:41:55+03:00",
                        "finishedAt":  "2026-09-30T00:41:55+03:00",
                        "commit":  "main",
                        "files":  [
                                      ".autopilot/",
                                      "AGENTS.md",
                                      "docs/adr/"
                                  ],
                        "tests":  {
                                      "passed":  94,
                                      "failed":  0
                                  }
                    },
                    {
                        "wave":  4,
                        "handoffs":  0,
                        "id":  "06",
                        "startedAt":  "2026-09-29T22:14:46+03:00",
                        "repairs":  0,
                        "retries":  0,
                        "blockedBy":  [
                                          "04"
                                      ],
                        "requirements":  [
                                             "R03",
                                             "R05",
                                             "R07",
                                             "R08",
                                             "R09",
                                             "R13"
                                         ],
                        "zone":  [
                                     "frontend/src/components/trips/item-form.tsx",
                                     "frontend/src/components/trips/item-form.test.tsx",
                                     "frontend/e2e/constructor.spec.ts",
                                     "frontend/src/app/globals.css"
                                 ],
                        "status":  "done",
                        "title":  "Ночной ввод и сквозная приёмка",
                        "finishedAt":  "2026-09-29T22:44:06+03:00",
                        "commit":  "a0e80a8",
                        "files":  [
                                      "frontend/src/components/trips/item-form.tsx",
                                      "frontend/src/components/trips/item-form.test.tsx",
                                      "frontend/e2e/constructor.spec.ts"
                                  ],
                        "tests":  {
                                      "passed":  87,
                                      "failed":  0
                                  }
                    },
                    {
                        "wave":  5,
                        "handoffs":  0,
                        "id":  "07",
                        "startedAt":  "2026-09-29T22:44:06+03:00",
                        "repairs":  0,
                        "retries":  0,
                        "blockedBy":  [
                                          "06"
                                      ],
                        "requirements":  [
                                             "R03",
                                             "R06",
                                             "R07",
                                             "R13"
                                         ],
                        "zone":  [
                                     "backend/tests/test_trips.py",
                                     "frontend/src/components/trips/item-form.test.tsx",
                                     "frontend/src/components/trips/editor-panels.test.tsx"
                                 ],
                        "status":  "done",
                        "title":  "Проверки сохранения и форм",
                        "finishedAt":  "2026-09-30T00:25:05+03:00",
                        "commit":  "096c736",
                        "files":  [
                                      "backend/tests/test_trips.py",
                                      "frontend/src/components/trips/item-form.test.tsx",
                                      "frontend/src/components/trips/editor-panels.test.tsx"
                                  ],
                        "tests":  {
                                      "passed":  73,
                                      "failed":  0
                                  }
                    },
                    {
                        "wave":  5,
                        "handoffs":  0,
                        "id":  "08",
                        "startedAt":  "2026-09-29T22:44:06+03:00",
                        "repairs":  0,
                        "retries":  0,
                        "blockedBy":  [
                                          "06"
                                      ],
                        "requirements":  [
                                             "R02",
                                             "R04",
                                             "R05",
                                             "R08",
                                             "R09",
                                             "R12",
                                             "R13"
                                         ],
                        "zone":  [
                                     "frontend/src/components/trips/trip-calendar.tsx",
                                     "frontend/src/components/trips/trip-calendar.test.tsx",
                                     "frontend/src/app/globals.css",
                                     "frontend/e2e/constructor.spec.ts"
                                 ],
                        "status":  "done",
                        "title":  "Доступность календаря и точная приёмка",
                        "finishedAt":  "2026-09-30T00:26:22+03:00",
                        "commit":  "c44506c",
                        "files":  [
                                      "frontend/src/components/trips/trip-calendar.tsx",
                                      "frontend/src/components/trips/trip-calendar.test.tsx",
                                      "frontend/src/app/globals.css",
                                      "frontend/e2e/constructor.spec.ts"
                                  ],
                        "tests":  {
                                      "passed":  94,
                                      "failed":  0
                                  }
                    }
                ],
    "singlePass":  null,
    "tests":  {
                  "build":  "passed",
                  "backend":  50,
                  "lint":  "passed",
                  "passed":  94,
                  "alembic":  "8b97c412e6af head",
                  "typecheck":  "passed",
                  "e2e":  21,
                  "docker":  "healthy",
                  "frontend":  23,
                  "failed":  0,
                  "ruff":  "passed"
              },
    "debt":  {
                 "placeholders":  [

                                  ],
                 "assumptions":  [
                                     "Календарь показывает 7/3/1 дня по ширине экрана",
                                     "Статус дня необязателен и допускает произвольный текст",
                                     "Ссылки доступны в закрытом редакторе, клиентский preview остаётся строгим allowlist"
                                 ],
                 "emptyEnv":  [

                              ]
             },
    "additions":  [

                  ],
    "coverage":  {
                     "deferred":  0,
                     "found":  0,
                     "fixed":  0,
                     "note":  "Независимая проверка: пропусков и частичного покрытия нет; дополнительные истории являются уточнениями R.n."
                 },
    "concerns":  [
                     "ИСПРАВЛЕНО 06–08: слабые E2E проверки времени, дат, маркеров, ссылки и сохранения; клики и наложение полосы",
                     "ИСПРАВЛЕНО 07: тесты дубликата, конечного дня и форм",
                     "ОТЧЁТ: историческая запись, созданная до миграции, не проверялась отдельной фикстурой; работающая БД прошла миграцию",
                     "ОТЧЁТ: тест подсказки статуса зависит от datalist, а защита maxLength и нетронутые часы отеля не проверены отдельными пользовательскими сценариями",
                     "СНЯТО: возможная неэффективность useMemo при небольшой видимой неделе не влияет на наблюдаемое поведение",
                     "СНЯТО: дублирование проверки пересечения отеля — локальный код без расхождения поведения",
                     "СНЯТО: E2E длинного статуса проверяет положение полосы, но не всю видимость текста; визуальный сценарий 820px прошёл"
                 ],
    "reviewers":  {
                      "manifestSpec":  "/root/review_spec",
                      "craft":  "/root/review_craft_fresh"
                  },
    "blind":  {
                  "checked":  16,
                  "resolved":  2,
                  "mismatches":  [

                                 ],
                  "matched":  16,
                  "initialFindings":  [
                                          "R14 — первый обзор увидел неподтянутые локальные коммиты; исправлено push",
                                          "R15 — первый обзор увидел предыдущий frontend-образ; исправлено build/up"
                                      ]
              }
}