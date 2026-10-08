window.STATE = {
    "slug":  "test-5-live-hero",
    "dir":  "2026-10-08-test-5-live-hero",
    "title":  "Travel Club /test_5 - live homepage inside right page",
    "mode":  "full",
    "depth":  "normal",
    "tier":  "T1",
    "polish":  null,
    "briefFile":  "2026-10-08-brief.md",
    "memoryFile":  "AGENTS.md",
    "skillDir":  "C:/Users/McHomak/.agents/skills/autopilot",
    "startedAt":  "2026-10-08T20:52:03+03:00",
    "updatedAt":  "2026-10-09T00:45:00+03:00",
    "finishedAt":  null,
    "stages":  [
                   {
                       "id":  "preflight",
                       "status":  "done",
                       "startedAt":  "2026-10-08T20:52:03+03:00",
                       "finishedAt":  "2026-10-08T20:52:03+03:00"
                   },
                   {
                       "id":  "manifest",
                       "status":  "done",
                       "startedAt":  "2026-10-08T20:52:03+03:00",
                       "finishedAt":  "2026-10-08T20:52:03+03:00"
                   },
                   {
                       "id":  "briefing",
                       "status":  "skipped",
                       "note":  "Full mode, bounded follow-up; self-briefing"
                   },
                   {
                       "id":  "spec",
                       "status":  "done",
                       "startedAt":  "2026-10-08T20:52:03+03:00",
                       "finishedAt":  "2026-10-08T20:53:45+03:00"
                   },
                   {
                       "id":  "plan",
                       "status":  "done",
                       "startedAt":  "2026-10-08T20:53:45+03:00",
                       "finishedAt":  "2026-10-09T00:45:00+03:00"
                   },
                   {
                       "id":  "build",
                       "status":  "done",
                       "startedAt":  "2026-10-08T23:49:00+03:00",
                       "finishedAt":  "2026-10-09T00:45:00+03:00",
                       "note":  "frontend checks и production Docker green"
                   },
                   {
                       "id":  "review",
                       "status":  "done",
                       "startedAt":  "2026-10-09T00:40:00+03:00",
                       "finishedAt":  "2026-10-09T00:45:00+03:00",
                       "note":  "Manifest/Spec clean; 3 Craft concerns nonblocking"
                   },
                   {
                       "id":  "final",
                       "status":  "active",
                       "startedAt":  "2026-10-09T00:45:00+03:00"
                   }
               ],
    "requirements":  {
                         "total":  11,
                         "done":  9,
                         "inTicket":  2,
                         "inSpec":  0,
                         "placeholder":  0,
                         "deferred":  0,
                         "dropped":  0
                     },
    "tickets":  [
                    {
                        "id":  "01",
                        "title":  "Live hero and smoother right-page camera",
                        "requirements":  [
                                             "R01",
                                             "R02",
                                             "R03",
                                             "R04",
                                             "R05",
                                             "R06",
                                             "R07"
                                         ],
                        "blockedBy":  [

                                      ],
                        "wave":  1,
                        "zone":  [
                                     "test_5"
                                 ],
                        "status":  "done",
                        "startedAt":  "2026-10-08T20:53:45+03:00",
                        "retries":  0,
                        "repairs":  0,
                        "handoffs":  0,
                        "finishedAt":  "2026-10-08T21:31:23+03:00",
                        "commit":  "697edaa"
                    },
                    {
                        "id":  "02",
                        "title":  "Opening realism and vertical stability",
                        "requirements":  [
                                             "R08",
                                             "R09"
                                         ],
                        "status":  "done",
                        "startedAt":  "2026-10-08T21:53:57+03:00",
                        "retries":  0,
                        "repairs":  0,
                        "handoffs":  0,
                        "zone":  [
                                     "test_5"
                                 ],
                        "finishedAt":  "2026-10-08T23:07:03+03:00"
                    },
                    {
                        "id":  "03",
                        "title":  "Continue the real homepage inside the magazine page",
                        "requirements":  [
                                             "R10",
                                             "R11"
                                         ],
                        "blockedBy":  [
                                          "02"
                                      ],
                        "wave":  3,
                        "zone":  [
                                     "frontend/src/components/test_5/",
                                     "frontend/e2e/test-5-camera.spec.ts"
                                 ],
                        "status":  "review",
                        "startedAt":  "2026-10-08T23:49:00+03:00",
                        "retries":  0,
                        "repairs":  0,
                        "handoffs":  0
                    }
                ],
    "singlePass":  null,
    "tests":  "35 production Playwright passed;73 unit/16 files;7 dev camera checks+1 continuation acceptance;lint/typecheck/build passed;Docker healthy;194 protected source files unchanged",
    "debt":  {
                 "placeholders":  [

                                  ],
                 "assumptions":  [
                                     "Continue on test_5; source routes preserved",
                                     "Frontend-only Docker rebuild/restart, database untouched"
                                 ],
                 "emptyEnv":  [

                              ]
             },
    "additions":  [

                  ],
    "coverage":  {
                     "findings":  0,
                     "verdict":  "clean: R10/R11 covered; mobile behavior clarification recorded"
                 },
    "concerns":  [
                     "test-5-camera.spec.ts: continuation test locates paper by CSS-module class substring",
                     "test-5-camera.spec.ts: hit-testing assertion should also assert rendered visibility",
                     "test-5-camera.spec.ts: no explicit maximum-gap assertion for blank area after the form"
                 ],
    "reviewers":  {
                      "manifestSpec":  "/root/page_continuation_g2",
                      "craft":  "pending"
                  },
    "blind":  "/root/opening_acceptance: implemented within retained brief; desktop hinged leaf + authorized simplified mobile"
}
