# 06 — Align Research filter labels and controls

**Requirements:** R07
**Blocked by:** —
**Zone:** `frontend/src/components/research/respondent-list.tsx`, `frontend/src/components/research/research.module.css`, Research list tests
**Wave:** final repair
**Status:** done

## Acceptance

- On the desktop Research list, all filter labels occupy a consistent single-line label row and their input/select controls start on the same horizontal line. Include the sort label with its icon.
- At narrow widths, filter labels and controls remain aligned within the stacked layout and no label wraps into the control area.
- Add or update a browser-level regression check that measures label/control geometry at desktop and narrow viewports; keep existing behavior and tests.
- Confirm the result in the browser at the width where blind acceptance found the sort select lower than the other filters, and at 390 px.
- Keep the change limited to Research filter layout and its regression coverage.

## Why this ticket exists

The final blind acceptance found the sort label wraps while the other labels remain one line, placing its select below the shared control row. This leaves R07 only partially delivered, so this ticket closes the original requirement before shipment.

## Verification

- Run the targeted browser-level filter alignment check at desktop and 390 px.
- Run frontend lint, typecheck, and the relevant tests.

## Result

Aligned the four filter labels and controls; added a browser geometry regression check. The targeted Playwright test passed (1 test), as did lint, typecheck, and the respondent-list Vitest test. Browser acceptance confirmed equal 7 px label/control gaps and vertical stacking at 390 px. Manifest+Spec and Craft reviews found no blockers; the spec reference is corrected in the manifest.
