# 08 — Keep Research screening labels and controls aligned

**Requirements:** R07
**Blocked by:** —
**Zone:** `frontend/src/components/research/screening-form.tsx`, `frontend/src/components/research/research.module.css`, screening-form tests or focused browser coverage
**Wave:** final repair
**Status:** dropped after review

## Acceptance

- Labels in the new respondent and screening forms do not wrap into neighboring control rows at desktop widths; each field's control begins at a consistent vertical offset within its grid row.
- Long labels remain readable and aligned at narrow widths, where the form stacks to one column; no horizontal page overflow is introduced.
- Keep all form labels and controls accessible and preserve existing validation, choices, free-text city entry, and save behavior.
- Add focused coverage for the public layout contract; do not alter Research list filters already handled by T06.

## Evidence prompting this repair

Blind acceptance found that long labels in two-column new-respondent form rows wrap to multiple lines and shift neighboring controls, although the filter toolbar itself is aligned after T06.

## Verification

- Verify the form at desktop and 390px in a browser.
- Run focused screening-form tests, frontend lint, and typecheck.

## Final disposition

Manifest+Spec review found this extended R07 beyond its specified Research filter panel into the separate screening form. The CSS and Playwright changes were removed; T06's filter alignment remains. This observation is recorded in run concerns and is not shipped as part of this scope.
