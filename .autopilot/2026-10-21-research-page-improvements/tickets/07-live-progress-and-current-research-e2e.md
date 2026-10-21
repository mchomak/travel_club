# 07 — Keep live interview progress and align Research E2E flows

**Requirements:** R01, R15, R17, R22
**Blocked by:** —
**Zone:** `frontend/src/components/research/respondent-detail.tsx`, `frontend/e2e/research.spec.ts`, focused tests for these public flows
**Wave:** final repair
**Status:** done

## Acceptance

- In an active interview, after entering a non-empty answer and moving focus away, the progress count and bar still include that answer; clearing it removes it. Cover the browser-visible behavior with an assertion that fails against the current runtime.
- Update the existing Research E2E login-without-`next` expectations to `/home`, then continue the test from its required Research route.
- Update completed-interview E2E steps to edit and explicitly save a new version. Verify the newest version is selected by default and an earlier version remains available/read-only without overwriting it.
- Keep unrelated Research history, network recovery, export, and responsive coverage intact.
- Do not weaken existing assertions to make the suite pass. Keep changes in this ticket's zone.

## Evidence prompting this repair

The blind browser pass saved two answers in an in-progress interview, blurred the fields, and still saw `0 из 12`; after completion the same record correctly showed `2 из 12`. The final spec review also found that `research.spec.ts` still expects `/admin/trips` after login without a target and edits completed answers using the old autosave contract.

## Verification

- First run the focused progress regression against the existing implementation and confirm it fails because progress returns to zero after blur.
- Run `npm.cmd exec playwright test e2e/research.spec.ts -- --workers=1` against the isolated Research backend.
- Run relevant frontend unit tests, lint, and typecheck.

## Final verification and review

- `npm.cmd exec playwright test e2e/research.spec.ts -- --workers=1 --retries=0`: 3 passed.
- `npm.cmd exec playwright test e2e/research-filter-alignment.spec.ts -- --workers=1 --retries=0`: 1 passed.
- Frontend Vitest: 38 files / 161 passed; lint, typecheck and production build passed (all 38 routes generated).
- Clean isolated Compose database: backend pytest 156 passed; Ruff passed; Alembic has one head, `a2f7c91b4d60`.
- Manifest/spec review: PASS. Craft review: no blockers; two non-blocking maintainability suggestions are recorded in run concerns.
