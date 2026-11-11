# Travel Club Website

Public Next.js application for the company website. Its source, routes, approved Lato design system, CSS, assets, and photo editor live in `apps/website/`.

## Routes

Current application routes include `/`, `/formats`, `/services/route`, `/services/turnkey`, `/tours`, `/payment`, `/archive`, `/start`, `/thanks`, `/legal`, `/privacy`, and `/personal-data`. There are no `/archive/[slug]` or `/tours/[slug]` detail routes in this app at this revision.

The `(publication)` route group uses the shared `SiteShell`. Routes in `(public)` currently use a separate local layout and CSS in `src/app/(public)/`. Both layouts belong to this app; this documents their current routing structure.

## Run independently

From this directory, run `npm.cmd ci`, then `npm.cmd run dev` (port 3100). For a production server run `npm.cmd run build` then `npm.cmd start`. `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd test -- --run --testTimeout=15000` run the app checks.

From the repository root, the same commands are available through `npm.cmd run dev:website`, `build:website`, `lint:website`, `typecheck:website`, and `test:website`.

The public demo form validates answers in the browser and does not transmit or persist personal information. `BACKEND_URL` is available to configure the existing FastAPI proxy for `/api`; the Website does not own a separate backend or database. For a common local origin, the gateway sends unmatched public routes to this app and serves its Next assets under `/_app/website/`.

## Design system

The approved Website design system is in `src/styles/travel-club-design-system.css` and is loaded by the app root layout. Use its Lato family, typography, palette and layout tokens. Keep visual code inside Website; do not import styles from Constructor or Interviews. See [`docs/design-system.md`](../../docs/design-system.md).

## Legacy archive

The tracked source for the former root `frontend/` app has been removed from the active app tree. Local ignored/untracked artifacts may remain on disk; they are not part of the monorepo source. Former route paths are preserved only in the local archive tag and historical documents. For current boundaries, see [`docs/architecture/REPOSITORY_ARCHITECTURE.md`](../../docs/architecture/REPOSITORY_ARCHITECTURE.md).
