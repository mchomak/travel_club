from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import pytest


RENDERER = Path(__file__).resolve().parents[1] / "nginx" / "render.py"


def run_renderer(*arguments: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(RENDERER), *arguments],
        check=False,
        capture_output=True,
        text=True,
    )


def test_https_renderer_uses_a_domain_for_host_and_vhost_headers() -> None:
    result = run_renderer(
        "https",
        "--public-ip",
        "192.0.2.24",
        "--server-name",
        "research.example.test",
        "--https-port",
        "9443",
        "--cert-dir",
        "/etc/letsencrypt/live/tc-research",
    )

    assert result.returncode == 0, result.stderr
    assert "server_name research.example.test;" in result.stdout
    assert "proxy_set_header Host research.example.test:9443;" in result.stdout
    assert "proxy_set_header X-Forwarded-Host research.example.test:9443;" in result.stdout


def test_http_renderer_redirects_to_the_configured_domain() -> None:
    result = run_renderer(
        "http",
        "--public-ip",
        "192.0.2.24",
        "--server-name",
        "research.example.test",
        "--https-port",
        "9443",
        "--acme-webroot",
        "/var/www/acme",
    )

    assert result.returncode == 0, result.stderr
    assert "server_name research.example.test;" in result.stdout
    assert "return 308 https://research.example.test:9443$request_uri;" in result.stdout


def test_http_renderer_keeps_ipv4_defaults_when_server_name_is_omitted() -> None:
    result = run_renderer(
        "http",
        "--public-ip",
        "192.0.2.24",
        "--https-port",
        "9443",
        "--acme-webroot",
        "/var/www/acme",
    )

    assert result.returncode == 0, result.stderr
    assert "server_name 192.0.2.24;" in result.stdout
    assert "return 308 https://192.0.2.24:9443$request_uri;" in result.stdout


def test_renderer_accepts_an_ipv4_server_name() -> None:
    result = run_renderer(
        "https",
        "--public-ip",
        "192.0.2.24",
        "--server-name",
        "198.51.100.7",
        "--https-port",
        "9443",
        "--cert-dir",
        "/etc/letsencrypt/live/tc-research",
    )

    assert result.returncode == 0, result.stderr
    assert "server_name 198.51.100.7;" in result.stdout
    assert "proxy_set_header Host 198.51.100.7:9443;" in result.stdout


def test_renderer_rejects_server_name_injection() -> None:
    result = run_renderer(
        "https",
        "--public-ip",
        "192.0.2.24",
        "--server-name",
        "research.example.test; return 200;",
        "--https-port",
        "9443",
        "--cert-dir",
        "/etc/letsencrypt/live/tc-research",
    )

    assert result.returncode != 0
    assert result.stdout == ""
    assert "--server-name" in result.stderr


@pytest.mark.parametrize(
    ("kind", "options", "routing"),
    [
        (
            "http",
            ("--acme-webroot", "/var/www/acme"),
            "return 308 https://192.0.2.24:9443$request_uri;",
        ),
        (
            "https",
            ("--cert-dir", "/etc/letsencrypt/live/travel-club"),
            "proxy_pass http://172.19.0.4:3000;",
        ),
    ],
)
def test_share_link_requests_keep_routing_without_logging_the_token(
    kind: str, options: tuple[str, ...], routing: str
) -> None:
    result = run_renderer(
        kind, "--public-ip", "192.0.2.24", "--https-port", "9443", *options
    )

    assert result.returncode == 0, result.stderr
    location = "location ~* ^/(?:trip|api/public/trips)(?:/|$) {"
    assert location in result.stdout
    share_location = result.stdout.split(location, 1)[1].split("}", 1)[0]
    assert "access_log off;" in share_location
    assert "error_log /dev/null;" in share_location
    assert routing in share_location
    assert "access_log off;" not in result.stdout.replace(share_location, "")
    assert "error_log /dev/null;" not in result.stdout.replace(share_location, "")
