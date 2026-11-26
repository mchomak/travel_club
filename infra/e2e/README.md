# Isolated browser E2E contour

This Compose file uses a dedicated PostgreSQL volume, test-only credentials and
no host database port. It does not load the project's `.env`. Use a fresh,
unique Compose project name containing `e2e`, `test` or `check`; check that
both the project and its `postgres_data` volume do not already exist before
starting. The gateway binds only `127.0.0.1:3301`; ensure this port is free.

From the repository root (PowerShell):

```powershell
docker compose --env-file .env.example -p travel-e2e-example -f infra/e2e/compose.yaml config --quiet
docker compose --env-file .env.example -p travel-e2e-example -f infra/e2e/compose.yaml up -d --build --wait
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:3301'
$env:PLAYWRIGHT_BACKEND_CONTAINER = 'travel-e2e-example-backend-1'
$env:PLAYWRIGHT_TEST_BACKEND_CONTAINER = 'travel-e2e-example-backend-1'
```

The existing E2E global setup verifies the container labels, gateway port,
actual database connection, volume ownership and other consumers before tests
can modify data. Create only synthetic users/data in this contour. Stopping
containers does not remove the volume; never remove an existing volume without
separately verifying its identity and obtaining authorization.
