# Website lead system

This document describes the public `/start` submission path, isolated Website leads storage, notification delivery, and the private operator workflow.

## Architecture and data boundaries

The Website form sends JSON to `POST /api/leads` through the gateway. The gateway forwards `/api/leads/**` to a Website-only FastAPI process built from the existing backend image and codebase. That process validates and normalizes the request, writes to the Website leads database, and queues a Telegram notification in the same database transaction. A separate Compose worker polls and sends queued notifications. The public success page verifies a short-lived signed receipt through `GET /api/leads/receipt?token=...`; the token contains no contact information. If the database write fails, the API does not issue a receipt. Telegram delivery failure does not remove the saved lead.

Lead records live in the `travel_club_website` database on a dedicated PostgreSQL service named `website-postgres` with its own `website_postgres_data` volume. It has no published host port. This is a separate PostgreSQL instance from the shared Constructor and Interviews database service. It has three isolated roles:

| Role | Use | Permissions |
|---|---|---|
| `website_cluster_admin` | PostgreSQL image initialization and operator backup/restore | Cluster administrator; credentials are used only by the `website-postgres` container |
| `travel_club_website_migrator` | Website Alembic migration job | Owns the Website leads database and schema; can change its schema |
| `travel_club_website_app` | Backend API, notification worker, and local CLI | Connects to the Website database; can use the public schema and read/write its tables and sequences |

The Website-only API and worker receive `WEBSITE_DATABASE_URL`; the one-shot migration service receives only `WEBSITE_MIGRATION_DATABASE_URL`. The internal backend receives no Website URL or signing secrets, while the Website-only process receives no Constructor/Interviews credentials. The backend image shares code, not database access. No browser connects directly to either database.

The Website database schema is managed by the separate `backend/website_alembic.ini` migration chain. It includes the lead record and notification outbox, plus short-lived anti-abuse records. Anti-abuse records retain an HMAC digest of the network address and timestamps only; raw IP addresses are not stored. Lead table fields are described by the migration and model in `backend/app/leads/`. The lead row contains its generated `TC-` reference, timestamps, stable product ID, contact channel and normalized contact, optional name/message/source, consent record, processing status, and notification state. The outbox row records delivery attempts and their result without becoming a second source of lead data.

## Public API and validation

The public form and Website API use the shared product catalogue in `shared/website-products.json`, so the browser and server accept the same IDs and labels. Product IDs become durable references as soon as a lead is saved: never delete or rename a saved ID. To stop offering a product, retain its ID and label and mark it `available: false`; older leads and notifications still need the original product identity.

`POST /api/leads` accepts `application/json` with the fields `product_id`, `contact_method`, `contact_value`, optional `name`, optional `message`, `source`, consent, and the honeypot field. The browser sends a UUID `Idempotency-Key` header. A successful response contains a lead number and a short-lived receipt token. The receipt endpoint returns only the lead number after validating that token.

The server accepts only configured product identifiers and the supported contact methods. It rejects unexpected fields, invalid types, overlong values, malformed JSON, non-JSON content types, disallowed origins, bodies above 16 KiB, missing consent, and invalid contacts. It limits requests to three per minute and twenty per day per HMAC-derived network identity. For the Website leads route, the gateway replaces `X-Forwarded-For` with the socket peer address unless that immediate peer belongs to `GATEWAY_TRUSTED_PROXY_CIDRS`. For a trusted proxy, it walks the forwarded chain from right to left and skips configured proxies before choosing the client address. The Website API then accepts that canonical address only when its immediate peer matches `WEBSITE_TRUSTED_PROXY_CIDRS` (the gateway's exact source range). Leave either setting blank unless the corresponding proxy source is known and controlled. Other application routes retain their existing forwarding headers.

The idempotency key prevents a retry of the same form submission from creating a second lead. SQL access uses SQLAlchemy bound parameters. User text is stored as data, escaped on display, and escaped or omitted in Telegram output; it is never evaluated as HTML. Public errors do not contain database details or personal data. No public endpoint lists or changes stored leads.

## Local setup and migrations

From the repository root, initialize environment files and validate Compose configuration:

```powershell
python scripts/init_env.py
docker compose config --quiet
docker compose --profile website-leads config --quiet
```

To run all services including lead intake, add the `website-leads` profile:

```powershell
docker compose --profile website-leads up -d --build --wait
```

The normal setup creates `.env` if it is absent and `.env.website` for the isolated Website database. It preserves existing values, adds only missing Website settings, and never prints generated credentials. To create the extra ignored credentials file for disposable PostgreSQL integration checks, run `python scripts/init_env.py --website-check`; regular setup does not create test credentials. Keep all generated `.env` files out of source control. The root `.env` continues to hold shared backend settings and optional Telegram variables. If `.env` existed before Telegram support, add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_LEADS_CHAT_ID` there yourself when configuring delivery.

The profile starts `website-postgres`, then runs the one-shot `website-migrate` service with `python -m alembic -c website_alembic.ini upgrade head`. The API stays in a separate process with no internal database credentials. A Website database outage does not prevent the shared API from serving Constructor or Interviews. The notification worker starts only after the migration job succeeds. When deploying a new backend image, run the migration job before exposing the new form version; if migration fails, inspect its logs and resolve it before expecting lead submissions to succeed.

For a Website started directly with `npm run dev:website`, start the Website database and migration, then the profile's API service. The API publishes `127.0.0.1:8001` only in local Compose so the host dev server can reach it; the check overlay removes this publication, and deployment Compose never publishes the API port. Set `WEBSITE_LEADS_API_URL=http://127.0.0.1:8001` in `apps/website/.env.local` (see `apps/website/.env.example`) before starting Next.js. Compose-built Website images use the internal `http://website-api:8001` service address instead.

```powershell
docker compose --profile website-leads up -d --wait website-postgres
docker compose --profile website-leads run --rm website-migrate
docker compose --profile website-leads up -d --wait website-api
npm.cmd run dev:website
```

Useful operations:

```powershell
docker compose --profile website-leads logs website-postgres website-migrate website-api website-notification-worker
docker compose --profile website-leads run --rm website-migrate
docker compose --profile website-leads exec website-api python -m app.leads.cli list
docker compose --profile website-leads exec website-api python -m app.leads.cli list --status new --limit 50
docker compose --profile website-leads exec website-api python -m app.leads.cli show TC-000123
docker compose --profile website-leads exec website-api python -m app.leads.cli status TC-000123 in_progress
docker compose --profile website-leads exec website-api python -m app.leads.cli retry TC-000123
```

PostgreSQL integration and concurrency checks use a separate `travel-club-leads-check-run2` Compose project, a separate `travel-club-leads-check-run2_website_postgres_data` volume, and the guarded database `travel_club_website_check`. These commands never connect to the regular development project's database:

```powershell
python scripts/init_env.py --website-check
docker compose -p travel-club-leads-check-run2 -f compose.yaml -f compose.website-check.yaml --profile website-leads up -d website-postgres
docker compose -p travel-club-leads-check-run2 -f compose.yaml -f compose.website-check.yaml --profile website-leads run --rm website-migrate
docker compose -p travel-club-leads-check-run2 -f compose.yaml -f compose.website-check.yaml --profile website-leads --profile website-leads-check run --rm website-leads-check
```

Do not add `down -v` to these commands; the check project's volume is independent from the developer and preview volumes.

The private API access log is disabled so the signed receipt token in the query string is not written to container logs. The gateway also does not log request URLs or bodies.

The CLI runs inside the backend container using the application role. Access to Docker and the backend container is privileged. The `status` command accepts `new`, `in_progress`, or `closed`; `retry` requeues notification delivery without creating a new lead.

## Telegram setup and delivery

Create a bot with Telegram's BotFather, add it to each intended private team chat, and determine each chat ID using an approved bot administration method. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_LEADS_CHAT_ID` in the ignored root `.env`; the latter accepts one chat ID or a comma-separated list. Duplicate IDs are ignored while preserving the configured order. Do not paste values into source files or build arguments. The token and chat IDs are passed only to the notification worker. Restart the worker after changing its environment. It sends one message per chat using the official Telegram Bot API with an outbound request timeout and retries transient failures, including rate limiting, while retaining the outbox record for later retry. If delivery succeeds in one chat but fails transiently in another, a retry may deliver the notification again to the chat that already received it; the worker does not include personal lead details in these messages.

The notification currently contains only the lead number and product ID/name. It does not include a contact value, name, or free-text comment. Do not expand that payload until the team's approved privacy notice and consent explicitly cover sending those personal data to Telegram. The database remains the source of truth even when Telegram is unavailable. If Telegram is not configured, the worker remains running, periodically removes expired anti-abuse records, logs the missing configuration once on startup, and skips delivery attempts. The service uses `restart: on-failure` so this idle cleanup does not cause a restart loop.

## Personal data, retention, and launch readiness

The form should collect only the selected product, one contact method and value, optional name, optional trip comment, and the required consent. Do not add contact data to URLs, analytics, or ordinary application logs. The privacy and personal-data pages must contain text approved by the Travel Club team before the public form is enabled for real customers. The consent wording and retention period are team decisions; this document does not invent legal language or a statutory retention term. Before production, approve a retention schedule, implement and verify deletion/anonymization against that schedule, and confirm whether Telegram may receive contact details and comments.

## Backup and restore

Back up the Website database independently from the shared Constructor/Interviews database. Treat the dump as personal data: store it in access-controlled encrypted storage and never commit it.

```powershell
docker compose --profile website-leads exec -T website-postgres pg_dump -U website_cluster_admin -d travel_club_website -Fc > website-leads.dump
docker compose --profile website-leads exec -T website-postgres pg_restore --list < website-leads.dump
```

Test restoration into a fresh disposable database first. Do not use `--clean` against the active leads database as a routine restore step. After confirming the dump and target, an operator can create an isolated restore database and restore the dump there:

```powershell
docker compose --profile website-leads exec website-postgres createdb -U website_cluster_admin -O travel_club_website_migrator travel_club_website_restore
docker compose --profile website-leads exec -T website-postgres pg_restore -U website_cluster_admin --no-owner --role=travel_club_website_migrator -d travel_club_website_restore < website-leads.dump
```

Confirm the restored schema and records using the CLI against that isolated database before planning any production cutover. Keep backup retention aligned with the approved personal-data retention policy and securely remove expired dumps.

## Production checklist

- Create strong independent database credentials in the deployment secret store; never use the committed placeholders.
- Keep the Website database private, with no public port, and allow only the backend runtime and migration job to reach it.
- Apply the Website migration before publishing the form that depends on it.
- Configure Telegram credentials only in the secret store and test delivery to the private team chat.
- Approve `/privacy`, `/personal-data`, consent wording, retention/deletion procedures, and Telegram personal-data transfer before public collection.
- Set `GATEWAY_TRUSTED_PROXY_CIDRS` to the exact reverse-proxy source CIDR immediately in front of the gateway, and set `WEBSITE_TRUSTED_PROXY_CIDRS` to the gateway's exact source CIDR as seen by the Website API. The deployment preview defaults to the Docker bridge gateway (`172.19.0.1/32`) and the gateway container (`172.19.0.4/32`); verify these addresses against the selected network before starting it. Nginx must use `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for` so the gateway can select the rightmost untrusted client address.
- Verify API validation, idempotent retry, unauthorized lead access, database outage behavior, Telegram outage/retry, and receipt expiration.
- Create a backup and successfully restore it into a disposable database before launch.
- Review application and proxy logs to confirm contact values, messages, tokens, and database credentials are absent.
