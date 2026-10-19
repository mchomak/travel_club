# HTTPS-поддомен TC Research

Эта инструкция описывает конфигурацию; DNS и сервер в рамках этой работы не менялись. Укажите значения, подтверждённые владельцем VPS и DNS-провайдером. Не добавляйте их в код или Git.

## DNS и окружение

Создайте DNS-запись `A` для `research.<ваш-домен>` на фактический публичный IPv4 VPS. Запись `AAAA` добавляйте только если VPS и входящий Nginx действительно настроены на IPv6. TCP/80 нужен для HTTP-01 проверки сертификата; для HTTPS renderer поддерживает порты `8443`, `9443` и `10443`.

На VPS в отдельной административной shell-сессии задайте:

```bash
RESEARCH_HOST='research.<ваш-домен>'
PUBLIC_IP='<публичный IPv4 VPS>'
HTTPS_PORT=8443
ACME_WEBROOT=/var/www/tc-research-acme
CERT_DIR=/etc/letsencrypt/live/tc-research
ACME_EMAIL='<адрес для уведомлений сертификата>'
FRONTEND_UPSTREAM=172.19.0.4:3000
```

Замените все значения в угловых скобках. HTTPS-порт выберите из списка выше и используйте его во всех командах и URL. `compose.deploy.yaml` назначает frontend адрес `172.19.0.4:3000` во внутренней сети и не публикует его порт на хосте; перед запуском Compose проверьте, что сеть `172.19.0.0/16` не пересекается с другими сетями VPS.

## Nginx и сертификат

Подготовьте отдельные файлы vhost. HTTP-конфигурация обслуживает ACME challenge и перенаправляет остальной трафик на HTTPS с выбранным портом:

```bash
sudo install -d -m 0755 "$ACME_WEBROOT/.well-known/acme-challenge" /etc/nginx/conf.d
sudo python3 deploy/nginx/render.py http \
  --public-ip "$PUBLIC_IP" \
  --server-name "$RESEARCH_HOST" \
  --https-port "$HTTPS_PORT" \
  --acme-webroot "$ACME_WEBROOT" \
  | sudo tee /etc/nginx/conf.d/tc-research-http.conf >/dev/null
sudo nginx -t
sudo systemctl reload nginx
```

Убедитесь, что DNS уже указывает на этот VPS, входящий TCP/80 открыт в firewall VPS и провайдера, а challenge-файл действительно отдаётся снаружи по `http://$RESEARCH_HOST/.well-known/acme-challenge/...`. Затем выпустите обычный сертификат для DNS-имени:

```bash
sudo certbot certonly --webroot \
  --webroot-path "$ACME_WEBROOT" \
  --domain "$RESEARCH_HOST" \
  --cert-name tc-research \
  --non-interactive --agree-tos --email "$ACME_EMAIL"
```

После успешной выдачи сертификата добавьте отдельный TLS-vhost. Он проксирует запросы на существующий frontend; Next.js сохраняет маршрут `/api` и проксирует его к backend внутри Compose:

```bash
sudo python3 deploy/nginx/render.py https \
  --public-ip "$PUBLIC_IP" \
  --server-name "$RESEARCH_HOST" \
  --https-port "$HTTPS_PORT" \
  --frontend-upstream "$FRONTEND_UPSTREAM" \
  --cert-dir "$CERT_DIR" \
  | sudo tee /etc/nginx/conf.d/tc-research-https.conf >/dev/null
sudo nginx -t
sudo systemctl reload nginx
```

Откройте выбранный HTTPS-порт в фактическом firewall VPS и провайдера. Убедитесь, что Certbot timer включён и `sudo certbot renew --dry-run` проходит. Штатный `deploy/certbot/nginx-deploy-hook.sh` обслуживает только lineage `travel-club-preview`, поэтому для Research установите отдельный deploy hook, который перезагружает Nginx только после обновления его сертификата:

```bash
sudo install -d -m 0755 /etc/letsencrypt/renewal-hooks/deploy
sudo tee /etc/letsencrypt/renewal-hooks/deploy/30-tc-research-reload-nginx >/dev/null <<'EOF'
#!/bin/sh
set -eu
[ "${RENEWED_LINEAGE:-}" = "/etc/letsencrypt/live/tc-research" ] || exit 0
/usr/sbin/nginx -t
/bin/systemctl reload nginx
EOF
sudo chmod 0755 /etc/letsencrypt/renewal-hooks/deploy/30-tc-research-reload-nginx
systemctl list-timers --all | grep -Ei 'certbot|snap\.certbot'
sudo certbot renew --dry-run
```

Renderer передаёт `Host` и `X-Forwarded-Host` как выбранное имя с HTTPS-портом, а `X-Forwarded-Proto` как `https`. Откройте `https://research.<ваш-домен>:<HTTPS_PORT>/research`. Главная `/` остаётся маршрутом основного сайта.

## Origin и вход администратора

В серверном `.env` задайте точный origin Research без завершающего `/`, например по шаблону `https://research.<ваш-домен>:<HTTPS_PORT>`. Сохраните текущее `ALLOWED_ORIGIN` основного сайта: `RESEARCH_ORIGIN` добавляется отдельно и не заменяет его. Не редактируйте `.env.example` вместо серверного `.env`.

После изменения окружения пересоздайте только backend:

```bash
docker compose -p travel_club -f compose.deploy.yaml up -d --no-deps backend
docker compose -p travel_club -f compose.deploy.yaml ps backend
```

Поддомен использует тот же backend, таблицу администраторов и защищённый механизм Travel Club. Войдите на Research существующим администратором; из-за отдельного hostname браузер хранит для него свою `HttpOnly`, `Secure` сессию. Новых ролей или паролей не требуется.

Проверьте HTTPS без обхода проверки сертификата, затем отдельно проверьте анонимный доступ: `/research` должен запросить вход, а защищённый API не должен отдавать данные без действующей сессии. Реальный VPS не развёрнут и сертификат не выпущен.
