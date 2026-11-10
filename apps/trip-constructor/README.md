# Trip Constructor

Independent Next.js app for private itinerary planning. It owns `/admin/**` and the protected `/home` product launcher, including its visual tokens, styles and route components.

## Run

From the repository root, install dependencies for this app with `npm ci --prefix apps/trip-constructor`, then run `npm run dev:constructor`. The standalone app listens on port `3101`. It needs the existing FastAPI backend at `BACKEND_URL` for sign-in, trips and maps; it does not need the Website or Interviews app to run.

When the shared-origin router is not running, set `NEXT_PUBLIC_INTERVIEWS_URL=http://localhost:3102` in `apps/trip-constructor/.env.local` to open Interviews from `/home`. Behind the shared-origin router, leave that variable empty so `/research` stays on the common origin.

## Checks

From the repository root: `npm run lint:constructor`, `npm run typecheck:constructor`, `npm run test:constructor`, `npm run build:constructor`. E2E tests for the builder and map are in `e2e/`.

## Design system

Constructor tokens are in `src/design-system/tokens.css`; global and component styles are local to this app. Keep visual imports within `apps/trip-constructor`.

## Backend settings

`BACKEND_URL` is app-server configuration for FastAPI. PostgreSQL credentials and map provider keys belong to the existing backend `.env`, not this frontend. See the repository architecture documentation for shared variables and database ownership.
