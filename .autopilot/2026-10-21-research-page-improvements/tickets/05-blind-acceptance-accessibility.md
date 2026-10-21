# 05 — Close blind-acceptance gaps in respondent rows and disclosures

**Requirements:** R10, R12
**Blocked by:** —
**Zone:** `frontend/src/components/research/respondent-list.tsx`, the respondent-list test, Research CSS, interviewer hint disclosure and its tests
**Wave:** 1
**Status:** done

## Acceptance

- The entire non-interactive area of each respondent table row opens that respondent. Keyboard users can focus the row and activate it with Enter or Space; preserve table semantics, visible focus, and existing link behavior without double navigation.
- Every Research disclosure heading, including the interviewer hints summary, stays on one line at desktop and narrow widths. Long text truncates visually while its accessible text remains available.
- Add regression tests before implementation for keyboard activation and the hints summary styling/behavior. Do not weaken existing tests.
- Do not change unrelated Research behavior, interview versioning, auth, public pages, or other worktrees.

## Why this ticket exists

Blind acceptance found that the row worked by pointer but not keyboard, and that the interviewer hints disclosure did not explicitly enforce the requested single-line heading. Both findings belong to existing brief requirements R10 and R12.

## Verification

- Run focused respondent-list and disclosure tests.
- Run frontend lint and typecheck.
- Return the standard ticket contract with changed paths and exact command results.

## Result

Implemented keyboard activation for the whole respondent row and kept native disclosure keyboard behavior. Focused Research tests, lint, and typecheck passed; Manifest+Spec and Craft re-reviews reported no blockers.
