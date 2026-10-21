#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  printf 'Usage: %s <8443|9443|10443>\n' "$0" >&2
  exit 2
fi

port="$1"
case "$port" in
  8443|9443|10443) ;;
  *) printf 'Refusing unapproved HTTPS port: %s\n' "$port" >&2; exit 2 ;;
esac

if ! command -v ss >/dev/null 2>&1; then
  printf 'Cannot check local listeners: ss is unavailable. Stop without changing services.\n' >&2
  exit 2
fi

listeners="$(ss -H -ltn sport = ":$port")"
if [[ -n "$listeners" ]]; then
  printf 'TCP/%s is already listening; do not change its owner.\n%s\n' "$port" "$listeners" >&2
  exit 1
fi

printf 'TCP/%s has no local listener. Confirm firewall/provider reachability with the temporary external probe before issuing a certificate.\n' "$port"
