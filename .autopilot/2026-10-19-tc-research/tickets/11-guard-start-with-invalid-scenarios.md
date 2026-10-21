# Ticket 11 — Disable interview start when scenario configuration is unavailable

## Review concern

The Ticket 10 detail page keeps historical snapshots readable when the current bank is missing or malformed. A craft review found that a draft respondent with an empty scenario list still shows an enabled “Начать интервью” button, even though starting requires a valid configured scenario and the backend will reject the request.

## Сделать

In `frontend/src/components/research/respondent-detail.tsx`, disable the start action when the current scenario configuration is missing, empty, or structurally unusable. Show a concise explanation next to the disabled action. Keep the saved respondent and snapshot data readable. Do not disable the action when a valid scenario configuration is loaded, and do not change backend behavior.

Add a regression test in `respondent-detail.test.tsx` proving that an empty or unavailable scenario config leaves the button disabled and does not call `researchApi.startInterview`, while the existing valid-config path still starts normally.

## Проверка

- New test is red before the guard and green after it.
- Existing detail component tests pass.
- `npm.cmd run lint`, `npm.cmd run typecheck`, and `git diff --check` pass.
- Only the respondent detail component and its test change.


## Execution result

- Commit: `97d8842` (`fix(11): guard interview start on invalid config`).
- Start is disabled for missing, failed, or invalid config and for a missing/invalid selected scenario. The handler has the same guard. Empty `question_codes` remains valid and can be followed by manual question additions. Persisted snapshots remain visible.
- Regression cases cover no scenarios, config fetch failure, global validation errors, and a fully loaded config with an empty selected route. Independent spec review found both test-gap fixes addressed.
- Focused component tests: 8 passed. Full frontend suite: 130 passed in 31 files. Lint, typecheck, `git diff --check`, and production build passed.
