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
    "updatedAt":  "2026-10-08T21:31:23+03:00",
    "finishedAt":  "2026-10-08T21:31:23+03:00",
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
                       "finishedAt":  "2026-10-08T20:53:45+03:00"
                   },
                   {
                       "id":  "build",
                       "status":  "done",
                       "startedAt":  "2026-10-08T20:53:45+03:00",
                       "finishedAt":  "2026-10-08T21:18:43+03:00"
                   },
                   {
                       "id":  "review",
                       "status":  "done",
                       "startedAt":  "2026-10-08T21:18:43+03:00",
                       "finishedAt":  "2026-10-08T21:20:23+03:00"
                   },
                   {
                       "id":  "final",
                       "status":  "done",
                       "startedAt":  "2026-10-08T21:20:23+03:00",
                       "finishedAt":  "2026-10-08T21:31:23+03:00"
                   }
               ],
    "requirements":  {
                         "total":  7,
                         "done":  7,
                         "inTicket":  0,
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
                    }
                ],
    "singlePass":  null,
    "tests":  "73 unit/16 files; lint/typecheck/build passed; 17 focused dev; 43 production browser; independent visual PASS; 194 source hashes unchanged; Docker recreated; commit697edaa pushed main",
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
                     "verdict":  "clean"
                 },
    "concerns":  [

                 ],
    "reviewers":  {
                      "manifestSpec":  "/root/live_hero_spec",
                      "craft":  "/root/live_hero_craft"
                  },
    "blind":  "/root/live_hero_acceptance: behavioral/visual PASS; delivery receipt verified by root"
}