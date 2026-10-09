#!/bin/sh
set -eu

if [ "${RENEWED_LINEAGE:-}" != "/etc/letsencrypt/live/travel-club-preview" ]; then
    exit 0
fi

/usr/sbin/nginx -t
/bin/systemctl reload nginx
