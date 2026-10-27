window.STATE =
{
    "slug":  "trip-wizard-forms",
    "dir":  "2026-10-27-trip-wizard-forms",
    "title":  "Анкеты перелётов и проживания, редактирование дня",
    "mode":  "full",
    "depth":  "normal",
    "polish":  null,
    "tier":  "T1",
    "briefFile":  "2026-10-27-brief.md",
    "memoryFile":  "AGENTS.md",
    "skillDir":  "C:/Users/McHomak/.agents/skills/autopilot",
    "startedAt":  "2026-10-27T09:12:40+03:00",
    "updatedAt":  "2026-10-27T10:06:48+03:00",
    "finishedAt":  "2026-10-27T10:06:48+03:00",
    "stages":  [
                   {
                       "id":  "preflight",
                       "status":  "done",
                       "startedAt":  "2026-10-27T09:12:40+03:00",
                       "finishedAt":  "2026-10-27T09:13:18+03:00"
                   },
                   {
                       "id":  "manifest",
                       "status":  "done",
                       "startedAt":  "2026-10-27T09:13:18+03:00",
                       "finishedAt":  "2026-10-27T09:15:53+03:00"
                   },
                   {
                       "id":  "briefing",
                       "status":  "skipped",
                       "startedAt":  "2026-10-27T09:15:53+03:00",
                       "finishedAt":  "2026-10-27T09:15:53+03:00",
                       "note":  "Самобрифинг по умолчанию"
                   },
                   {
                       "id":  "spec",
                       "status":  "done",
                       "startedAt":  "2026-10-27T09:15:53+03:00",
                       "finishedAt":  "2026-10-27T09:25:54+03:00"
                   },
                   {
                       "id":  "plan",
                       "status":  "done",
                       "startedAt":  "2026-10-27T09:25:54+03:00",
                       "finishedAt":  "2026-10-27T09:31:17+03:00",
                       "note":  "2 таска, ярус T1"
                   },
                   {
                       "id":  "build",
                       "status":  "done",
                       "startedAt":  "2026-10-27T09:31:39+03:00",
                       "finishedAt":  "2026-10-27T09:55:42+03:00",
                       "note":  "2 из 2 тасков завершены"
                   },
                   {
                       "id":  "review",
                       "status":  "done",
                       "startedAt":  "2026-10-27T09:52:38+03:00",
                       "finishedAt":  "2026-10-27T09:55:42+03:00",
                       "note":  "Оба таска проверены; одно неблокирующее замечание сохранено"
                   },
                   {
                       "id":  "final",
                       "status":  "done",
                       "startedAt":  "2026-10-27T09:55:42+03:00",
                       "finishedAt":  "2026-10-27T10:06:48+03:00",
                       "note":  "Слепая приёмка 5/5; полные тесты прошли"
                   }
               ],
    "requirements":  {
                         "total":  15,
                         "done":  15,
                         "inTicket":  0,
                         "inSpec":  0,
                         "placeholder":  0,
                         "deferred":  0,
                         "dropped":  0
                     },
    "tickets":  [
                    {
                        "id":  "01",
                        "title":  "Автоподстановка страны и история мест перелёта",
                        "requirements":  [
                                             "R05",
                                             "R06",
                                             "R07"
                                         ],
                        "blockedBy":  [

                                      ],
                        "wave":  1,
                        "zone":  [
                                     "backend/app/maps.py",
                                     "backend/app/schemas.py",
                                     "backend/tests/test_maps.py",
                                     "frontend/src/lib/",
                                     "frontend/src/components/trips/country-city.tsx",
                                     "frontend/src/components/trips/item-form.tsx"
                                 ],
                        "status":  "done",
                        "retries":  0,
                        "repairs":  1,
                        "handoffs":  0,
                        "startedAt":  "2026-10-27T09:31:39+03:00",
                        "finishedAt":  "2026-10-27T09:52:21+03:00",
                        "commit":  "6e82447",
                        "tests":  [
                                      "backend maps 48 passed",
                                      "frontend focused 29 passed",
                                      "frontend full 256 passed",
                                      "backend full 177 passed",
                                      "Playwright trip-builder 5 passed",
                                      "lint/typecheck passed"
                                  ]
                    },
                    {
                        "id":  "02",
                        "title":  "Встроенные анкеты и редактор дня",
                        "requirements":  [
                                             "R01",
                                             "R02",
                                             "R03",
                                             "R04",
                                             "R08",
                                             "R09",
                                             "R10",
                                             "R11",
                                             "R12",
                                             "R13",
                                             "R14",
                                             "R15"
                                         ],
                        "blockedBy":  [

                                      ],
                        "wave":  1,
                        "zone":  [
                                     "frontend/src/components/trips/trip-builder.tsx",
                                     "frontend/src/components/trips/trip-editor.tsx",
                                     "frontend/e2e/"
                                 ],
                        "status":  "done",
                        "retries":  0,
                        "repairs":  0,
                        "handoffs":  1,
                        "startedAt":  "2026-10-27T09:31:39+03:00",
                        "finishedAt":  "2026-10-27T09:55:42+03:00",
                        "commit":  "2e018ee",
                        "tests":  [
                                      "T02 component tests 24 passed",
                                      "frontend full 256 passed",
                                      "backend full 177 passed",
                                      "Playwright trip-builder 5 passed",
                                      "lint/typecheck passed"
                                  ]
                    }
                ],
    "singlePass":  null,
    "tests":  null,
    "debt":  {
                 "placeholders":  [

                                  ],
                 "assumptions":  [

                                 ],
                 "emptyEnv":  [

                              ]
             },
    "additions":  [

                  ],
    "coverage":  {
                     "missing":  0,
                     "partial":  0,
                     "unrequestedDetails":  9,
                     "reviewRounds":  3,
                     "verdict":  "pass",
                     "resolvedFindings":  [
                                              {
                                                  "requirement":  "R15",
                                                  "resolution":  "Specified origin/master as the current origin/HEAD default branch."
                                              },
                                              {
                                                  "requirement":  "R02,R09",
                                                  "resolution":  "Specified that all existing ItemForm controls, defaults, actions, and validation remain."
                                              },
                                              {
                                                  "requirement":  "R05",
                                                  "resolution":  "All selectable city results carry ISO country codes; free text remains a manual-entry path."
                                              }
                                          ]
                 },
    "concerns":  [
                     {
                         "ticket":  "02",
                         "axis":  "craft",
                         "file":  "frontend/src/components/trips/trip-editor.tsx",
                         "line":  162,
                         "blocking":  false,
                         "finding":  "submitInline duplicates item/rate assembly and position transfer from modal onSubmit; both modes should share the save path.",
                         "triage":  "report",
                         "resolution":  "Неблокирующее дублирование пути сохранения оставлено для отдельного рефакторинга."
                     }
                 ],
    "reviewers":  {
                      "manifestSpec":  "/root/manifest_spec_review",
                      "craft":  "/root/craft_review"
                  },
    "blind":  {
                  "matched":  5,
                  "checked":  5,
                  "mismatches":  [

                                 ],
                  "note":  "Слепая приёмка подтвердила 5 пунктов. origin/HEAD указывает на master; отдельная origin/main существует как не-default ветка."
              }
};
