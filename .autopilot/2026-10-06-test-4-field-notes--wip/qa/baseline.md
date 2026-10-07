# T01 — safe copy baseline

The source `/test_2` was captured before creating `/test_4`. Both routes were served by the same local Next development process at `http://127.0.0.1:3001`; Docker at port 3000 was not rebuilt. Source content and design were not changed.

## Visual evidence

All three reduced-motion full-page PNG pairs are byte-for-byte equal, which proves identical decoded pixels. Body text, ordered anchors, element IDs, page height, and viewport widths also match. No horizontal overflow or browser JavaScript errors occurred.

| Size | Source before copying | Copy | PNG comparison |
| --- | --- | --- | --- |
| 1440×900 | [baseline](baseline-1440x900-reduced.png) | [copy](copy-1440x900-reduced.png) | identical |
| 1280×800 | [baseline](baseline-1280x800-reduced.png) | [copy](copy-1280x800-reduced.png) | identical |
| 390×844 | [baseline](baseline-390x844-reduced.png) | [copy](copy-390x844-reduced.png) | identical |

Normal-motion opening evidence: [source](baseline-1440x900-normal-opening.png), [copy](copy-1440x900-normal-opening.png). Native scroll changes the cover transform, reverse scroll restores it, keyboard activation of “К сайту” reaches `#start`, and “Начать историю” reaches the visible contact field at `#story` on both routes.

The QA capture hides the Next development toolbar and forces local lazy images to eager loading solely for deterministic screenshots; production files contain neither adjustment. See [capture script](capture-safe-copy.mjs), [source DOM evidence](baseline-dom.json), [copy DOM evidence](copy-dom.json), and [screenshot SHA-256](screenshot-sha256.json).

## Source integrity

225 tracked project files outside `.autopilot/` were covered by SHA-256. The pre-copy check had zero mismatches. The final check has zero mismatches: [before](tracked-sha256-before.json), [after copy](tracked-sha256-after-copy.json). This covers original routes, shared assets/components, backend, admin, package files, and configuration.

Next dev automatically created `frontend/AGENTS.md` and `frontend/CLAUDE.md` and switched `next-env.d.ts` to development type paths. These startup effects were removed/restored before copying; the environment declaration's final original checkout CRLF was restored from clean HEAD (`core.autocrlf=true`), and its baseline digest was canonicalized accordingly. Final product changes are limited to the new `test_4` directories.

All nine copied component files are byte-for-byte equal to `test_2`. The copied page is equal after substituting its three `@/components/test_2/` imports with `@/components/test_4/`. See [copy comparison](copy-comparison.json). Existing immutable photographs/fonts and the pre-existing `../test/data` and `../test/lead` imports remain shared.

## Executed checks

- Original Vitest baseline before copying: `npm.cmd test` → 14 files, 67 passed.
- After copying: `npm.cmd run typecheck` → passed; `npm.cmd test` → 14 files, 67 passed.
- Selected existing test: `npm.cmd test -- src/components/test_3/application-form.test.tsx` → 2 passed.
- `node ../.autopilot/2026-10-06-test-4-field-notes--wip/qa/capture-safe-copy.mjs baseline` → passed.
- The same command with `copy` → passed, including three deterministic PNG comparisons and navigation behavior.

An initial selected-test invocation used a nonexistent `src/components/test/lead.test.ts` path; no tests ran. It was corrected to the existing test path above. No new unit tests were added for this unchanged copy.
