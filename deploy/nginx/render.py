#!/usr/bin/env python3
"""Render a parameterized Travel Club host Nginx vhost without extra packages."""

from __future__ import annotations

import argparse
import ipaddress
import re
import sys
from pathlib import Path


TEMPLATE_DIR = Path(__file__).parent / "templates"
HTTPS_PORTS = {8443, 9443, 10443}
SAFE_PATH = re.compile(r"^/[A-Za-z0-9_./-]+$")


def checked_ip(value: str) -> str:
    try:
        parsed = ipaddress.ip_address(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("PUBLIC_IP must be a valid IPv4 address") from exc
    if parsed.version != 4:
        raise argparse.ArgumentTypeError("PUBLIC_IP must be IPv4 for this Nginx template")
    return str(parsed)


def checked_port(value: str) -> int:
    try:
        port = int(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("HTTPS_PORT must be an integer") from exc
    if port not in HTTPS_PORTS:
        allowed = ", ".join(str(port) for port in sorted(HTTPS_PORTS))
        raise argparse.ArgumentTypeError(f"HTTPS_PORT must be one of: {allowed}")
    return port


def checked_path(value: str, name: str) -> str:
    if not SAFE_PATH.fullmatch(value) or "/../" in f"{value}/":
        raise argparse.ArgumentTypeError(f"{name} must be an absolute path using letters, digits, /, _, ., or -")
    return value.rstrip("/") or "/"


def checked_upstream(value: str) -> str:
    host, separator, raw_port = value.rpartition(":")
    if not separator or not re.fullmatch(r"[0-9]{1,5}", raw_port) or not 1 <= int(raw_port) <= 65535:
        raise argparse.ArgumentTypeError("FRONTEND_UPSTREAM must be a loopback or RFC1918 IPv4 address and port")
    try:
        parsed = ipaddress.ip_address(host)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("FRONTEND_UPSTREAM must be a loopback or RFC1918 IPv4 address and port") from exc
    private_networks = (
        ipaddress.ip_network("10.0.0.0/8"),
        ipaddress.ip_network("172.16.0.0/12"),
        ipaddress.ip_network("192.168.0.0/16"),
    )
    if parsed.version != 4 or not (parsed.is_loopback or any(parsed in network for network in private_networks)):
        raise argparse.ArgumentTypeError("FRONTEND_UPSTREAM must be a loopback or RFC1918 IPv4 address and port")
    return f"{parsed}:{int(raw_port)}"


def render(template_name: str, replacements: dict[str, str]) -> str:
    template = (TEMPLATE_DIR / template_name).read_text(encoding="utf-8")
    for name, value in replacements.items():
        template = template.replace(f"@{name}@", value)
    unresolved = re.findall(r"@[A-Z][A-Z0-9_]*@", template)
    if unresolved:
        raise ValueError(f"unresolved template values: {', '.join(sorted(set(unresolved)))}")
    return template


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    commands = root.add_subparsers(dest="kind", required=True)

    for name in ("http", "probe", "https"):
        command = commands.add_parser(name)
        command.add_argument("--public-ip", required=True, type=checked_ip)
        command.add_argument("--https-port", required=True, type=checked_port)
        if name == "http":
            command.add_argument("--acme-webroot", required=True, type=lambda value: checked_path(value, "ACME_WEBROOT"))
        if name == "https":
            command.add_argument("--cert-dir", required=True, type=lambda value: checked_path(value, "CERT_DIR"))
            command.add_argument("--frontend-upstream", default="172.19.0.4:3000", type=checked_upstream)
    return root


def main() -> int:
    args = parser().parse_args()
    replacements = {
        "PUBLIC_IP": args.public_ip,
        "HTTPS_PORT": str(args.https_port),
    }
    template = {
        "http": "http.conf.template",
        "probe": "port-probe.conf.template",
        "https": "https.conf.template",
    }[args.kind]
    if args.kind == "http":
        replacements["ACME_WEBROOT"] = args.acme_webroot
    elif args.kind == "https":
        replacements["CERT_DIR"] = args.cert_dir
        replacements["FRONTEND_UPSTREAM"] = args.frontend_upstream
    try:
        sys.stdout.write(render(template, replacements))
    except (OSError, ValueError) as exc:
        print(f"render failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
