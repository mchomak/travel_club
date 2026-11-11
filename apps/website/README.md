# Travel Club Website

Public Next.js application for the company website. Its source, routes, approved Lato design system, CSS, assets, and photo editor live in `apps/website/`.

## Routes

Current application routes include `/`, `/formats`, `/services/route`, `/services/turnkey`, `/tours`, `/payment`, `/archive`, `/start`, `/thanks`, `/legal`, `/privacy`, and `/personal-data`. There are no `/archive/[slug]` or `/tours/[slug]` detail routes in this app at this revision.

Every Website route uses the shared `SiteShell`, applied once by `src/app/layout.tsx`. The shell, shared `SiteHeader`, `SiteFooter`, navigation, and their styles are in `src/components/public-site/`; both `(publication)` and `(public)` layouts are transparent route-group layouts. There are no `/about`, `/archive/[slug]`, or `/tours/[slug]` routes at this revision.

## Run independently

From this directory, run `npm.cmd ci`, then `npm.cmd run dev` (port 3100). For a production server run `npm.cmd run build` then `npm.cmd start`. `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd test -- --run --testTimeout=15000` run the app checks.

From the repository root, the same commands are available through `npm.cmd run dev:website`, `build:website`, `lint:website`, `typecheck:website`, and `test:website`.

The `/start` form lets a visitor choose one of the configured products and one preferred contact channel. It submits to the shared FastAPI gateway at `POST /api/leads`; the browser never connects to PostgreSQL. A short-lived signed receipt is checked through `GET /api/leads/receipt` before `/thanks` confirms a saved request. Repeated submissions use an idempotency key, and server-side validation remains authoritative. The [lead-system guide](../../docs/website/LEADS_SYSTEM.md) documents database and notification setup.

The privacy and personal-data pages currently contain outlines rather than approved legal text. The form labels its consent checkbox and links to those pages, but the documents remain a blocker for public production launch until the team approves and publishes their contents.

`BACKEND_URL` is available to configure the existing FastAPI proxy for `/api`; the Website does not connect to a database directly. For a common local origin, the gateway sends unmatched public routes to this app and serves its Next assets under `/_app/website/`.

## Design system

The approved Website design system is in `src/styles/travel-club-design-system.css` and is loaded by the app root layout. Use its Lato family, type roles, palette, spacing, container, border, and focus tokens. `src/components/public-site/site-tokens.ts` only maps existing `--pub-*` names onto approved `--tc-*` values. Keep visual code inside Website; do not import styles from Constructor or Interviews. See [`docs/design-system.md`](../../docs/design-system.md) and [`src/components/public-site/README.md`](src/components/public-site/README.md).

## Legacy archive

The tracked source for the former root `frontend/` app has been removed from the active app tree. Local ignored/untracked artifacts may remain on disk; they are not part of the monorepo source. Former route paths are preserved only in the local archive tag and historical documents. For current boundaries, see [`docs/architecture/REPOSITORY_ARCHITECTURE.md`](../../docs/architecture/REPOSITORY_ARCHITECTURE.md).
