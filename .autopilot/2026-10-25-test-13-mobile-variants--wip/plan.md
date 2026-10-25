# Plan — three phone layouts for the Travel Club issue

**Tier T2, 4 tickets.** This is one editorial feature with three independent route layouts and a final preview-server deployment. A shared static renderer must land first; the two remaining route variants can then be built in parallel; deployment is the final dependent step.

## Waves

| Wave | Tickets | Why they can run together |
|---|---|---|
| 1 | 01 — shared content renderer + `/test_15` | Establishes the reusable static mobile spread and demonstrates the first layout. |
| 2 | 02 — `/test_16`; 03 — `/test_17` | Both depend on ticket 01 and own separate route/component/test directories. |
| 3 | 04 — preview deployment | Requires all three complete variants, a pushed intended revision, and successful server preflight. |

## Merge pass

The shared renderer stays with the first route because it is the prerequisite that makes the later variants small and coherent. `/test_16` and `/test_17` do not touch ticket 01's zones and are safe to build in parallel. Deployment cannot be combined with a page ticket: it has different external effects and must follow the runbook checks.

## Verification

- Each route ticket owns a uniquely named Playwright spec and runs it at phone dimensions.
- After all three routes land, run frontend lint, typecheck, Vitest, production build, and the combined Playwright specs at 320×700, 390×844, and 844×390.
- Deployment ticket follows `docs/deployment-preview.md` exactly. If a prerequisite fails, stop before changing the VPS and leave this ticket blocked with the non-secret evidence.
