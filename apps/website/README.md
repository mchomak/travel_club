# Travel Club Website

Public Next.js application for the company website. It owns public routes, the approved Lato design system in `src/styles/travel-club-design-system.css`, CSS, assets, and photo editor.

## Run independently

From this directory, run `npm ci`, `npm.cmd run dev` (port 3100), or `npm.cmd run build` then `npm.cmd start` (production server on port 3100). `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd test -- --run --testTimeout=15000` run the app checks.

The public demo form validates answers in the browser and does not transmit or persist personal information. `/api` can be proxied to the existing FastAPI service with `BACKEND_URL`. The shared-origin gateway routes `/` and public pages here and serves the app's Next assets under `/_app/website/`. The team login link on placeholder pages is routed to Trip Constructor when using that gateway.

The source `frontend/` remains the legacy integration point until the gateway ticket retires it.
