# Travel Club preview deployment runbook

This runbook describes how to publish the existing site on a VPS at a runtime URL of `https://<public-ip>:<HTTPS_PORT>`. The checked-in Nginx files are templates and commands only; they do not configure a server or mean that deployment is complete. The public IP, selected HTTPS port, resulting link, and certificate paths are set from verified runtime values and are not committed into the templates.

The workflow keeps host Nginx separate from the `travel_club` Compose project, leaves TCP/443 and existing services alone, and uses a short-lived Let’s Encrypt IP certificate. Carrying it out makes server and firewall changes; it requires the owner's separate authorization to deploy after the unified commit is pushed. This runbook or a prepared commit alone is not that authorization. Never copy or print `.env`, passwords, private keys, database credentials, or SSH credentials. The project bootstrap prompts for the administrator password without putting it in command arguments.

## 1. Confirm the pushed revision

From the repository root on the workstation, stage the entire intended working tree for the single shared commit. Review the staged paths and changes; ensure `.env`, credentials, logs, and generated local state are excluded. Do not proceed if anything unexpected is staged. Do not use a force push.

```powershell
git status --short
git add -A
git diff --cached --check
git diff --cached --stat
git diff --cached --name-only
$envPaths = git diff --cached --name-only | Where-Object { $_ -match '(^|/)\.env($|\.)' -and $_ -notmatch '(^|/)\.env\.example$' }
if ($envPaths) { throw 'A local .env file is staged; remove it from the commit before continuing.' }
# Review locally; do not copy diff output into logs or chats.
git diff --cached
git commit -m "Deploy Travel Club preview"
$dirty = git status --porcelain
if ($dirty) { throw 'Working tree is not clean after the aggregate commit; stop before push.' }
$localCommit = git rev-parse HEAD
git push origin HEAD:main
$remoteCommit = (git ls-remote origin refs/heads/main | ForEach-Object { $_.Split()[0] })
if ($localCommit -ne $remoteCommit) { throw 'origin/main does not point to the aggregate commit; stop before SSH.' }
```

This creates one aggregate commit for all intended tracked and untracked work-tree changes, then verifies the tree is clean before pushing. If the push is rejected, the clean-tree check fails, or the IDs differ, stop; do not begin SSH changes.

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

Set the values from verified deployment facts. The default frontend upstream is the loopback mapping `127.0.0.1:3000`; keep it loopback-only. The IP and HTTPS port determine the final public link at run time. Set the certificate lineage name/path in the same deployment shell; do not commit the IP, link, or certificate files.
Keep these values in the same administrative shell session for the remaining Bash commands. The external workstation commands use their own matching values.

```bash
PUBLIC_IP='<confirmed-public-ipv4>'
HTTPS_PORT=8443
ACME_WEBROOT=/var/www/travel-club-acme
FRONTEND_UPSTREAM=127.0.0.1:3000
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

Render TLS using only the certificate paths. The template contains no certificate or key material and proxies only to the configured loopback frontend:

```bash
sudo python3 deploy/nginx/render.py https \
  --public-ip "$PUBLIC_IP" \
  --https-port "$HTTPS_PORT" \
  --frontend-upstream "$FRONTEND_UPSTREAM" \
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

Start the `travel_club` Compose project only with its source-free deployment file and images already loaded. Wait for PostgreSQL health and successful migrations before creating the initial administrator. Do not use `docker compose down -v`.

```bash
docker compose -p travel_club -f compose.deploy.yaml ps
docker compose -p travel_club -f compose.deploy.yaml exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT login FROM users ORDER BY login;"'
docker compose -p travel_club -f compose.deploy.yaml exec backend python -m app.bootstrap
```

The read-only query lists logins in the isolated `travel_club` database without exposing password hashes. If the database is not healthy, migrations have not completed, or the query fails, stop before bootstrap. If `traveladmin` is already listed, do not bootstrap with that login: choose a unique unused suffix from the listed names and enter it when prompted. If it is absent, use `traveladmin`. Run bootstrap interactively so the password is entered through `getpass`; never put a password in command arguments, files, shell history, fixtures, or logs.

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

The deployment is acceptable only if the three new services are healthy, the existing containers remain up without new restarts, there is no new OOM event, at least 300 MiB memory is available, and at least 3 GiB disk remains free. If any threshold fails, do not create an administrator; stop only the `travel_club` Compose project and report the measurements. Do not stop Nginx, VPN, Telegram, or any other service.

## Rollback boundary

If ingress setup fails, remove only `/etc/nginx/conf.d/travel-club-http.conf`, `/etc/nginx/conf.d/travel-club-https.conf`, or the temporary probe file created by these steps. Run `nginx -t` and gracefully reload Nginx after each removal. Never delete another site's configuration, change TCP/443, stop a listener to free a port, or remove any Docker volume.
