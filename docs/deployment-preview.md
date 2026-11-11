# Travel Club preview deployment runbook

This runbook describes how to publish the Travel Club Website, Trip Constructor, and Interview Platform through one gateway on a VPS at a runtime URL of `https://<public-ip>:<HTTPS_PORT>`. The checked-in Nginx files are templates and commands only; they do not configure a server or mean that deployment is complete. The public IP, selected HTTPS port, resulting link, and certificate paths are set from verified runtime values and are not committed into the templates.

The workflow keeps host Nginx separate from the `travel_club` Compose project and routes to the gateway at its private Docker bridge address without publishing an application host port. The gateway routes requests to the three Next.js applications, the shared internal backend, and (when the `website-leads` profile is enabled) the isolated Website leads API. It leaves TCP/443 and existing services alone, and uses a short-lived Let’s Encrypt IP certificate. Carrying it out makes server and firewall changes and requires the owner's separate authorization to deploy. A prepared or reviewed change alone is not that authorization. Never copy or print `.env`, passwords, private keys, database credentials, or SSH credentials. The project bootstrap prompts for the administrator password without putting it in command arguments.

## 1. Review and select an approved revision

From the repository root on the workstation, inspect the current branch and both staged and unstaged changes. Preserve pre-existing changes and staged work; do not use `git add -A`, create an aggregate commit, merge into `main`, or push directly to `main` as part of this runbook. Review the intended revision through the repository's normal branch/PR review process. Continue only when that revision has been approved and is available in the local checkout for building. Deployment still requires the owner's separate authorization.

```powershell
git status --short
git branch --show-current
git diff --check
git diff --stat
git diff --cached --check
git diff --cached --stat
git diff --name-only
git diff --cached --name-only
```

Review the listed paths and diffs locally. Confirm that local `.env` files, credentials, logs, and generated state are not included in the approved revision. Never print or transfer secrets. Do not continue if the working tree contains changes outside the approved revision or if the selected revision has not passed review.

Build the source-free Linux/amd64 images from the approved revision available in the local checkout. These commands do not use `.env` values. Keep the resulting tar files out of Git and transfer them to the VPS using the approved artifact-transfer path.

```powershell
docker buildx build --platform linux/amd64 --file infra/local/next.Dockerfile --build-arg APP=website --build-arg WEBSITE_LEADS_API_URL=http://website-api:8001 --build-arg NEXT_ASSET_PREFIX=/_app/website/_next --tag travel-club-website:preview --load .
docker save --output travel-club-website-amd64.tar travel-club-website:preview
docker buildx build --platform linux/amd64 --file infra/local/next.Dockerfile --build-arg APP=trip-constructor --build-arg NEXT_ASSET_PREFIX=/_app/constructor/_next --build-arg NEXT_PUBLIC_INTERVIEWS_URL= --tag travel-club-trip-constructor:preview --load .
docker save --output travel-club-trip-constructor-amd64.tar travel-club-trip-constructor:preview
docker buildx build --platform linux/amd64 --file infra/local/next.Dockerfile --build-arg APP=interviews --build-arg NEXT_ASSET_PREFIX=/_app/interviews --build-arg NEXT_PUBLIC_CONSTRUCTOR_URL= --tag travel-club-interviews:preview --load .
docker save --output travel-club-interviews-amd64.tar travel-club-interviews:preview
docker buildx build --platform linux/amd64 --file infra/local/gateway.Dockerfile --tag travel-club-gateway:preview --load .
docker save --output travel-club-gateway-amd64.tar travel-club-gateway:preview
docker buildx build --platform linux/amd64 --tag travel-club-backend:preview --build-context shared=./shared --load ./backend
docker save --output travel-club-backend-amd64.tar travel-club-backend:preview
docker buildx build --platform linux/amd64 --file infra/website-db/Dockerfile --tag travel-club-website-postgres:preview --load .
docker save --output travel-club-website-postgres-amd64.tar travel-club-website-postgres:preview
```

## 2. Connect and record the baseline

Use the operator-approved SSH destination. The IP used below must be the same confirmed public IPv4 address as the SSH destination; do not infer it from DNS or use an address copied from an old deployment note.

```bash
cd /opt/travel_club
date -Is
uname -m
nproc
free -h
swapon --show
df -h /
uptime
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
sudo ss -ltnp
```

Record CPU, available memory, swap, disk, load, listening ports, and existing container names/status. Identify the TCP/443 VPN owner and Telegram bot port/listener from this fresh snapshot. Set the Telegram port from the observed listener, then record both exact listener records and the relevant container status as the comparison baseline:

```bash
sudo ss -ltnp sport = :443
TELEGRAM_PORT='<observed-telegram-tcp-port>'
sudo ss -ltnp sport = :"$TELEGRAM_PORT"
```

Record these non-secret listener lines and the Telegram container name, if applicable, for the post-deploy comparison. Re-enter the same observed Telegram port in the deployment shell below.

Do not stop, restart, inspect environment variables from, or change existing containers, volumes, networks, Nginx sites, or firewall rules outside the exact ingress ports below.

## 3. Check tools and choose ingress ports

Use Nginx and Certbot supplied by trusted host package sources. Check both before changing the host:

```bash
nginx -v
certbot --version
```

Certbot must be version 5.4 or newer for IP certificates through webroot. If Nginx or a suitable Certbot is unavailable, stop and arrange the approved host package source; do not install anything on the workstation. See [Let’s Encrypt’s Certbot instructions for IP and six-day certificates](https://letsencrypt.org/2026/03/11/shorter-certs-certbot).

Set the values from verified deployment facts. `compose.deploy.yaml` assigns the gateway the private bridge address `172.19.0.4` on subnet `172.19.0.0/16`; it does not publish a host port. Confirm that subnet does not overlap an existing Docker or VPN network before starting Compose. Nginx proxies to `172.19.0.4:3000` from the host over the private bridge; the expected Nginx peer as seen by the gateway is the bridge gateway `172.19.0.1`, configured as the exact `GATEWAY_TRUSTED_PROXY_CIDRS` default. The Nginx template appends the socket peer with `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for`; the gateway trusts that chain only from the configured Nginx peer, then replaces it with the rightmost untrusted client address for `/api/leads/**`. The Website API separately trusts only the gateway source `172.19.0.4/32` via `WEBSITE_TRUSTED_PROXY_CIDRS`. Verify both source addresses against the selected Docker network before starting Compose. If the subnet changes, update the Compose IPAM subnet, gateway address, `GATEWAY_TRUSTED_PROXY_CIDRS`, `WEBSITE_TRUSTED_PROXY_CIDRS`, and upstreams together. The gateway routes `/admin/**` and `/home` to Constructor, `/research/**` to Interviews, `/api/leads/**` to the Website-only API when profile `website-leads` is enabled, other `/api/**` paths to the internal backend, and the distinct `/_app/<application>/_next/**` prefixes to their owning apps. The IP and HTTPS port determine the final public link at run time. Set the certificate lineage name/path in the same deployment shell; do not commit the public IP, link, or certificate files.
Keep these values in the same administrative shell session for the remaining Bash commands. The external workstation commands use their own matching values.

```bash
PUBLIC_IP='<confirmed-public-ipv4>'
HTTPS_PORT=8443
ACME_WEBROOT=/var/www/travel-club-acme
GATEWAY_UPSTREAM=172.19.0.4:3000
ACME_EMAIL='<operator-email-for-certificate-notices>'
TELEGRAM_PORT='<same-observed-telegram-tcp-port>'
CERT_NAME=travel-club-preview
CERT_DIR="/etc/letsencrypt/live/$CERT_NAME"
```

Check TCP/80 and the candidate HTTPS port before adding any listener:

```bash
sudo ss -ltnp sport = :80
sudo bash deploy/certbot/check-https-port.sh "$HTTPS_PORT"
```

TCP/80 may be used only if it is free, or if the owner is the host Nginx and `sudo nginx -T` confirms a dedicated exact-IP virtual host can be added without changing another site's behavior. If another service owns port 80, or a safe Nginx virtual host cannot be established, stop. Never stop or reconfigure the current owner to free TCP/80.

Choose only `8443`, `9443`, or `10443`, in that order. If `check-https-port.sh` reports a listener, do not alter that listener; try the next candidate. The script checks only local listeners. Before issuing a certificate, the temporary external probe in step 5 must also succeed from a network outside the VPS. If none of the candidate ports is locally free and reachable from outside, stop.

Check the active host firewall and provider firewall without changing unrelated rules. If UFW is installed, inspect it with:

```bash
sudo ufw status verbose
```

If UFW is active and one of these exact ingress rules is absent, add only TCP/80 and the selected `$HTTPS_PORT`:

```bash
sudo ufw allow 80/tcp comment 'Travel Club HTTP-01'
sudo ufw allow "${HTTPS_PORT}/tcp" comment 'Travel Club HTTPS'
sudo ufw status numbered
```

If UFW is absent or inactive, inspect the actual host/provider firewall manager and make only the equivalent exact-port change. Make no rule for TCP/443 or any other service port. If the provider firewall cannot be safely adjusted for these exact ports, stop.

## 4. Prepare the HTTP-01 webroot

Create only the dedicated public challenge directory and the directory for the new vhost:

```bash
sudo install -d -o root -g root -m 0755 "$ACME_WEBROOT/.well-known/acme-challenge"
sudo install -d -o root -g root -m 0755 /etc/nginx/conf.d
```

Render the HTTP vhost with the confirmed IP, HTTPS port, and webroot. It serves only challenge files beneath the exact ACME path; missing challenge files return 404, and ordinary HTTP requests redirect to the configured HTTPS port.

```bash
sudo python3 deploy/nginx/render.py http \
  --public-ip "$PUBLIC_IP" \
  --https-port "$HTTPS_PORT" \
  --acme-webroot "$ACME_WEBROOT" \
  | sudo tee /etc/nginx/conf.d/travel-club-http.conf >/dev/null
sudo nginx -t
```

If Nginx is already active, use a graceful reload. If it is inactive, check the fresh `sudo ss -ltnp` snapshot and `sudo nginx -T` for unexpected listeners before starting it. Never stop Nginx to make a port available.

```bash
if sudo systemctl is-active --quiet nginx; then
  sudo systemctl reload nginx
else
  sudo systemctl start nginx
fi
```

Verify TCP/80 from outside the VPS before asking the ACME server to validate it. This marker is public test text, not a credential:

```bash
printf 'travel-club-http01-probe\n' | sudo tee "$ACME_WEBROOT/.well-known/acme-challenge/travel-club-http01-probe" >/dev/null
```

From an external workstation, request `http://<PUBLIC_IP>/.well-known/acme-challenge/travel-club-http01-probe` and confirm the exact marker body. For Windows PowerShell:

```powershell
$PublicIp = '<confirmed-public-ipv4>'
curl.exe --fail --show-error --silent "http://$PublicIp/.well-known/acme-challenge/travel-club-http01-probe"
```

If external HTTP-01 cannot reach this marker, stop. Do not request either staging or production certificates. Only correct a specifically verified TCP/80 firewall rule; do not change TCP/443 or another service. Remove the marker after the check:

```bash
sudo rm "$ACME_WEBROOT/.well-known/acme-challenge/travel-club-http01-probe"
```

## 5. Verify external HTTPS-port reachability

The probe briefly serves one fixed, non-sensitive HTTP response on the selected candidate port. It does not claim that a port is externally reachable until the request succeeds from outside the VPS.

```bash
sudo bash deploy/certbot/check-https-port.sh "$HTTPS_PORT"
sudo python3 deploy/nginx/render.py probe \
  --public-ip "$PUBLIC_IP" \
  --https-port "$HTTPS_PORT" \
  | sudo tee /etc/nginx/conf.d/travel-club-port-probe.conf >/dev/null
sudo nginx -t
sudo systemctl reload nginx
```

From the external workstation, check both TCP and the probe response:

```powershell
$PublicIp = '<confirmed-public-ipv4>'
$HttpsPort = 8443
if (-not (Test-NetConnection -ComputerName $PublicIp -Port $HttpsPort -WarningAction SilentlyContinue).TcpTestSucceeded) {
  throw 'Selected HTTPS TCP port is not reachable from this external workstation.'
}
curl.exe --fail --show-error --silent "http://${PublicIp}:$HttpsPort/__travel_club_port_probe"
```

Both checks must succeed. Use the selected `$HTTPS_PORT` as `$HttpsPort` if it is not 8443. The TCP test is external; a successful local `ss` check alone is not enough. If either external check fails, remove only the probe vhost, run `nginx -t`, gracefully reload, and stop. Do not open a port owned by another service or switch to an unverified port.

After the external probe succeeds, confirm `HTTPS_PORT` in the deployment shell matches the port that passed; that is the final selection. Compute the public link now. If the selected port changes later, repeat the external probe and recompute the link.

```bash
SITE_URL="https://${PUBLIC_IP}:${HTTPS_PORT}"
```

```bash
sudo rm /etc/nginx/conf.d/travel-club-port-probe.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Issue a staging certificate first

Confirm Certbot is at least 5.4. Use the IP identifier, `shortlived` profile, and webroot authenticator; do not use Certbot’s Nginx or Apache installer plugin for an IP certificate.

```bash
sudo certbot certonly --staging \
  --preferred-profile shortlived \
  --webroot --webroot-path "$ACME_WEBROOT" \
  --ip-address "$PUBLIC_IP" \
  --cert-name travel-club-preview-staging \
  --non-interactive --agree-tos --email "$ACME_EMAIL"
```

If staging issuance fails for any reason, stop here. Do not request a production certificate, create an administrator, or use a self-signed fallback. Record the non-secret error summary and resolve the verified HTTP-01 cause before a new deployment attempt.

## 7. Issue the trusted short-lived certificate and enable TLS

Only after staging succeeds, request the trusted certificate with a distinct stable lineage name:

```bash
sudo certbot certonly \
  --preferred-profile shortlived \
  --webroot --webroot-path "$ACME_WEBROOT" \
  --ip-address "$PUBLIC_IP" \
  --cert-name "$CERT_NAME" \
  --non-interactive --agree-tos --email "$ACME_EMAIL"
```

The `shortlived` profile is valid for about six days, so automatic renewal is required. If trusted issuance fails, stop; do not bootstrap an administrator or substitute a self-signed certificate.

After production issuance succeeds, remove the temporary staging lineage created above:

```bash
sudo certbot delete --cert-name travel-club-preview-staging
```

Render TLS using only the certificate paths. The template contains no certificate or key material and proxies only to the configured private IPv4 gateway. The Nginx renderer retains the `--frontend-upstream` option name for this single public entrypoint:

```bash
sudo python3 deploy/nginx/render.py https \
  --public-ip "$PUBLIC_IP" \
  --https-port "$HTTPS_PORT" \
  --frontend-upstream "$GATEWAY_UPSTREAM" \
  --cert-dir "$CERT_DIR" \
  | sudo tee /etc/nginx/conf.d/travel-club-https.conf >/dev/null
sudo nginx -t
sudo systemctl reload nginx
```

If `nginx -t` fails, do not reload. Remove only the new Travel Club TLS vhost, preserve all existing Nginx configuration, report the error, and stop.

## 8. Enable renewal and verify the live site

Install the deploy hook so a renewed Travel Club certificate is applied through a graceful Nginx reload. It ignores other certificate lineages and validates Nginx before reload:

```bash
sudo install -d -o root -g root -m 0755 /etc/letsencrypt/renewal-hooks/deploy
sudo install -o root -g root -m 0755 \
  deploy/certbot/nginx-deploy-hook.sh \
  /etc/letsencrypt/renewal-hooks/deploy/20-travel-club-reload-nginx
sudo sh -n /etc/letsencrypt/renewal-hooks/deploy/20-travel-club-reload-nginx
```

Confirm that the host’s Certbot timer is enabled and runs more frequently than the certificate lifetime. Common timer names are `certbot.timer` and `snap.certbot.renew.timer`; use the one supplied by the trusted Certbot installation and stop if there is no working timer.

```bash
systemctl list-unit-files --type=timer | grep -Ei 'certbot|snap\.certbot'
if systemctl list-unit-files --no-legend certbot.timer | grep -q '^certbot.timer'; then
  sudo systemctl enable --now certbot.timer
elif systemctl list-unit-files --no-legend snap.certbot.renew.timer | grep -q '^snap.certbot.renew.timer'; then
  sudo systemctl enable --now snap.certbot.renew.timer
else
  echo 'No Certbot renewal timer found; stop.' >&2
  exit 1
fi
systemctl list-timers --all | grep -Ei 'certbot|snap\.certbot'
sudo certbot renew --dry-run
```

If the installed package uses `snap.certbot.renew.timer`, enable that unit instead of `certbot.timer`. Verify its next run is within 24 hours and that `certbot renew --dry-run` succeeds. Do not shorten or disable another service’s timer.

From an external workstation, verify the trusted chain and IP SAN by requesting the site without an insecure TLS bypass. Also verify the HTTP redirect uses the chosen HTTPS port:

```powershell
$PublicIp = '<confirmed-public-ipv4>'
$HttpsPort = 8443
curl.exe --fail --show-error --silent --head "https://${PublicIp}:$HttpsPort/"
curl.exe --silent --show-error --head "http://$PublicIp/"
Test-NetConnection -ComputerName $PublicIp -Port $HttpsPort -InformationLevel Quiet
```

The HTTPS request must validate normally; do not add `-k`. The HTTP response must be a redirect to `https://<PUBLIC_IP>:<HTTPS_PORT>/`. Confirm public editorial pages and local Next.js assets load, while unauthenticated `/admin/` and protected API requests remain denied.

Print the externally verified final link from the runtime values for the deployment record:

```bash
printf 'Public link: %s\n' "$SITE_URL"
```

## 9. Finish the application checks

Load the six required images transferred from the reviewed workstation build, then start the `travel_club` Compose project only with its source-free deployment file. The existing deployment remains available without the optional leads profile. To enable lead intake, provision `.env.website` on the server with independent Website database, application, migration, receipt, and rate-limit secrets. Set `WEBSITE_ALLOWED_ORIGINS` in the server `.env` to the exact public HTTPS origin. Verify the bridge source addresses from the prior step and set `GATEWAY_TRUSTED_PROXY_CIDRS` to the exact Nginx peer and `WEBSITE_TRUSTED_PROXY_CIDRS` to the gateway address; the configured defaults are `172.19.0.1/32` and `172.19.0.4/32`. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_LEADS_CHAT_ID` only when the team has approved Telegram notifications. Never use the committed placeholders. Before enabling public collection, confirm that the privacy and personal-data documents and consent have team-approved wording and that the approved policy covers the current Telegram payload (lead number and product only).

Start the stack with `--profile website-leads` only when that configuration is ready. The profile creates a separate PostgreSQL instance and volume, runs the Website migration job, and starts the leads-only API and notification worker. The Website API gets no internal database credentials; the worker gets only the Website runtime URL and Telegram credentials. The worker remains active without Telegram settings so it can clean up expired anti-abuse rows; it logs missing settings once and skips sends. Its `on-failure` restart policy does not loop on missing Telegram configuration. Wait for both databases and migrations before creating the internal administrator. Do not use `docker compose down -v`.

```bash
docker load --input travel-club-website-amd64.tar
docker load --input travel-club-trip-constructor-amd64.tar
docker load --input travel-club-interviews-amd64.tar
docker load --input travel-club-gateway-amd64.tar
docker load --input travel-club-backend-amd64.tar
docker load --input travel-club-website-postgres-amd64.tar
docker compose -p travel_club -f compose.deploy.yaml --profile website-leads up -d
docker compose -p travel_club -f compose.deploy.yaml ps
docker compose -p travel_club -f compose.deploy.yaml exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT login FROM users ORDER BY login;"'
docker compose -p travel_club -f compose.deploy.yaml exec backend python -m app.bootstrap
```

The read-only query lists logins in the internal `travel_club` database without exposing password hashes. Confirm that both `postgres` and `website-postgres` are healthy and that the `website-migrate` one-shot completed successfully before expecting lead submissions to work. If the internal database is not healthy, its migrations have not completed, or the query fails, stop before bootstrap. If `traveladmin` is already listed, do not bootstrap with that login: choose a unique unused suffix from the listed names and enter it when prompted. If it is absent, use `traveladmin`. Run bootstrap interactively so the password is entered through `getpass`; never put a password in command arguments, files, shell history, fixtures, or logs.

Repeat the baseline measurements and checks:

```bash
date -Is
free -h
df -h /
uptime
docker compose -p travel_club -f compose.deploy.yaml ps
docker stats --no-stream
sudo journalctl -k --since '<deployment-start-time>' | grep -Ei 'oom|out of memory|killed process' || true
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
sudo ss -ltnp
sudo ss -ltnp sport = :443
sudo ss -ltnp sport = :"$TELEGRAM_PORT"
```

Compare the TCP/443 owner and Telegram listener port/process/PID with the baseline from step 2; they must be unchanged. If the Telegram listener belongs to a container, that same container must remain up with no new restart. Treat any difference as a failed deployment, stop only the `travel_club` Compose project, and report it without restarting the VPN, Telegram bot, or another service.

The deployment is acceptable only if the gateway and three Next.js application services are healthy, the existing containers remain up without new restarts, there is no new OOM event, at least 300 MiB memory is available, and at least 3 GiB disk remains free. If any threshold fails, do not create an administrator; stop only the `travel_club` Compose project and report the measurements. Do not stop Nginx, VPN, Telegram, or any other service.

## Rollback boundary

If ingress setup fails, remove only `/etc/nginx/conf.d/travel-club-http.conf`, `/etc/nginx/conf.d/travel-club-https.conf`, or the temporary probe file created by these steps. Run `nginx -t` and gracefully reload Nginx after each removal. Never delete another site's configuration, change TCP/443, stop a listener to free a port, or remove any Docker volume.
