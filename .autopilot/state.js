window.STATE =
{
    "slug":  "deploy-travel-club-preview",
    "dir":  "2026-10-09-deploy-travel-club-preview--wip",
    "title":  "Travel Club public deployment and trip constructor",
    "mode":  "full",
    "depth":  "normal",
    "polish":  null,
    "tier":  "T2",
    "briefFile":  "2026-10-09-brief.md",
    "memoryFile":  "AGENTS.md",
    "skillDir":  "C:/Users/McHomak/.agents/skills/autopilot",
    "startedAt":  "2026-10-09T13:32:36+03:00",
    "updatedAt":  "2026-10-09T19:20:00+03:00",
    "finishedAt":  null,
    "stages":  [
                   {
                       "id":  "preflight",
                       "status":  "done",
                       "startedAt":  "2026-10-09T13:32:36+03:00",
                       "finishedAt":  "2026-10-09T13:33:21+03:00"
                   },
                   {
                       "id":  "manifest",
                       "status":  "done",
                       "startedAt":  "2026-10-09T13:33:21+03:00",
                       "finishedAt":  "2026-10-09T13:36:47+03:00"
                   },
                   {
                       "id":  "briefing",
                       "status":  "skipped",
                       "startedAt":  "2026-10-09T13:36:47+03:00",
                       "finishedAt":  "2026-10-09T13:36:47+03:00",
                       "note":  "full mode — self-briefing; решений и уточнений достаточно"
                   },
                    {
                        "id":  "spec",
                        "status":  "done",
                        "startedAt":  "2026-10-09T13:36:47+03:00",
                        "finishedAt":  "2026-10-09T14:08:19+03:00"
                    },
                    {
                        "id":  "plan",
                        "status":  "done",
                        "startedAt":  "2026-10-09T14:08:19+03:00",
                        "finishedAt":  "2026-10-09T14:14:07+03:00",
                        "note":  "3 таска T2, одна волна — три независимых зоны"
                    },
                    {
                        "id":  "build",
                        "status":  "done",
                        "startedAt":  "2026-10-09T14:14:07+03:00",
                        "finishedAt":  "2026-10-09T16:35:00+03:00"
                   },
                   {
                       "id":  "review",
                       "status":  "active",
                       "startedAt":  "2026-10-09T16:35:00+03:00"
                   },
                   {
                       "id":  "final",
                       "status":  "pending"
                   }
               ],
    "requirements":  {
                         "total":  9,
                         "done":  0,
                          "inTicket":  9,
                          "inSpec":  0,
                         "placeholder":  0,
                         "deferred":  0,
                         "dropped":  0
                     },
    "tickets":  [
                      {
                          "id":  "01",
                          "title":  "Смена пароля администратора",
                          "requirements":  ["R08", "A01"],
                          "blockedBy":  [],
                          "wave":  1,
                          "zone":  ["backend/app/auth.py", "backend/app/schemas.py", "backend/tests/", "frontend/src/app/admin/(private)/account/", "frontend/src/app/admin/(private)/layout.tsx", "frontend/src/lib/api.ts", "frontend/src/**/*.test.tsx"],
                          "status":  "in-progress",
                          "startedAt":  "2026-10-09T14:14:07+03:00",
                          "retries":  0,
                          "repairs":  0,
                          "handoffs":  0
                      },
                      {
                          "id":  "02",
                          "title":  "Изолированный Compose и локальные образы",
                          "requirements":  ["R02", "R05", "R06", "R07", "R08", "D01"],
                          "blockedBy":  [],
                          "wave":  1,
                          "zone":  ["compose.deploy.yaml", ".env.example", "backend/Dockerfile", "backend/requirements.txt"],
                          "status":  "in-progress",
                          "startedAt":  "2026-10-09T14:14:07+03:00",
                          "retries":  1,
                          "repairs":  0,
                          "handoffs":  0
                      },
                      {
                          "id":  "03",
                          "title":  "HTTPS по IP и безопасный ingress",
                          "requirements":  ["R01", "R03", "R04", "R05", "R07", "R09"],
                          "blockedBy":  [],
                          "wave":  1,
                          "zone":  ["deploy/nginx/", "deploy/certbot/", "docs/deployment-preview.md"],
                          "status":  "done",
                          "startedAt":  "2026-10-09T14:14:07+03:00",
                          "retries":  0,
                          "repairs":  0,
                          "handoffs":  0
                      }
                  ],
    "singlePass":  null,
    "tests":  null,
    "debt":  {
                 "placeholders":  [

                                  ],
                 "assumptions":  [
                                     "Use the confirmed SSH IP and first externally reachable free port from 8443/9443/10443; preserve VPN on 443; renew short-lived IP certificate via HTTP-01 on 80/tcp.",
                                     "Use an isolated Compose project and PostgreSQL volume in /opt/travel_club.",
                                     "Keep public pages open and constructor/API protected by existing admin session auth.",
                                     "Build frontend and backend images locally to reduce peak on the 2 GiB VPS; verify resource budget before and after startup.",
                                     "Assume a small demo workload; use 300 MiB available RAM and 3 GiB disk as stop thresholds because expected concurrency was not specified.",
                                     "Use login traveladmin and generate a unique password; expose password only in the requested chat response."
                                 ],
                 "emptyEnv":  [

                              ]
             },
    "additions":  [
                      "A01 — R08: смена пароля администратора в закрытом кабинете с проверкой текущего пароля"
                  ],
     "coverage":  {
                       "independentReader":  "coverage_final — brief.md + spec.md only",
                       "missing":  0,
                       "halfCovered":  0,
                       "extraInSpec":  0,
                       "actions":  []
                   },
    "concerns":  [

                 ],
    "reviewers":  {
                      "manifestSpec":  "/root/review_manifest_spec",
                      "craft":  "/root/review_craft"
                  },
    "blind":  null
}
