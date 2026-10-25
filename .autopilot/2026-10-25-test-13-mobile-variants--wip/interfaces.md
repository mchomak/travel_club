# Interfaces

## Boundaries decided in the specification

| Unit | Owns | Exposes | Hides |
|---|---|---|---|
| Route `/test_15` | Long-scroll composition, sticky chapter links, active-section tracking | Default Next.js page | Scroll/index state and route CSS |
| Route `/test_16` | One-chapter reader, direct chapter selection, previous/next | Default Next.js page; query `spread=1..7` | Selection presentation and control styling |
| Route `/test_17` | Chapter-card index and selected chapter view | Default Next.js page; query `spread=1..7` | Index/reading mode composition and styling |
| `test_mobile` static rendering | Wrap one existing spread as a mobile-readable vertical sequence of source pages | `MobileIssueSpread({ index: number; className?: string })` | Route state/navigation and source issue content |
| Existing test13 issue source | Original content, facts, photos, and destinations | `SPREADS` and `MagazineSpread({ index, reveal: "static" })` | Desktop experience and page-turn machinery |

## Project rules for executors

- Frontend: Next.js App Router, React, TypeScript, CSS modules; use `npm.cmd` in PowerShell.
- Read only existing `/test_13` issue exports and assets. Do not modify `/test_13`, `/test_12`, or shared magazine source/styles to implement the mobile routes.
- New code belongs to `frontend/src/components/test_mobile/`, `frontend/src/components/test_15/`, `frontend/src/components/test_16/`, `frontend/src/components/test_17/`, and matching `frontend/src/app/test_15/`, `test_16/`, `test_17/` paths. Each ticket owns only its listed route zone.
- Keep all routes noindex and outside shared navigation. Preserve source copy and destinations; no new content claims.
- Do not install packages or edit lockfiles. If a required dependency is absent, return `BLOCKED`.
- Minimum acceptance: body text ≥16px, controls ≥44px, no document-level horizontal overflow at 320×700, 390×844, or 844×390; clear focus; reduced motion; keyboard operation.
- Use semantic links/buttons, useful image alt text from the source, and no mandatory gestures or WebGL.

## Verification commands

From `frontend/`:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test -- --run --testTimeout=15000
npm.cmd run build
npm.cmd exec playwright test e2e/test-15-mobile.spec.ts e2e/test-16-mobile.spec.ts e2e/test-17-mobile.spec.ts -- --workers=3
```

Browser checks must inspect all three routes at 320×700, 390×844, and 844×390, and exercise direct links, navigation, keyboard controls, and document overflow.

## Deployment boundary

Only ticket 04 may change external state. Follow `docs/deployment-preview.md`, including intended-revision push and external preflight. Never stage unrelated dirty workspace files, expose secrets, change TCP/443, stop unrelated services, or remove volumes. If any SSH/runbook prerequisite fails, stop before server changes and mark deployment blocked with non-secret evidence.
