"""Authenticated boundary for map providers. Provider payloads stay server-side."""

import ipaddress
import json
import logging
import math
import re
import socket
from concurrent.futures import ThreadPoolExecutor
from typing import Annotated, Literal
from urllib.parse import parse_qs, unquote_plus, urljoin, urlsplit

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import Field, ValidationError

from app.auth import Admin
from app.config import get_settings
from app.schemas import DTO, CountryCode, MapPlace, TravelMode

router = APIRouter(prefix="/api/maps", tags=["maps"])
PROVIDER_TIMEOUT = httpx.Timeout(8.0, connect=3.0)
MAX_PROVIDER_BYTES = 2_000_000
DNS_POOL = ThreadPoolExecutor(max_workers=3, thread_name_prefix="maps-dns")


class _RedactProviderRequests(logging.Filter):
    def filter(self, record):
        if "api.geoapify.com" in record.getMessage():
            record.msg = "Geoapify HTTP request (URL redacted)"
            record.args = ()
            record.exc_info = None
            record.exc_text = None
        return True


# httpx logs full URLs at INFO, including apiKey. Redact before any handler sees them.
logging.getLogger("httpx").addFilter(_RedactProviderRequests())


class SearchResult(DTO):
    places: list[MapPlace]


class ReverseResult(DTO):
    place: MapPlace


class RouteInput(DTO):
    from_place: MapPlace = Field(alias="from")
    to: MapPlace
    mode: TravelMode


class LineString(DTO):
    type: Literal["LineString"] = "LineString"
    coordinates: list[tuple[float, float]] = Field(min_length=2, max_length=20000)


class RouteResult(DTO):
    status: Literal["ok", "unavailable"]
    distance_m: float | None = None
    duration_s: float | None = None
    geometry: LineString | None = None
    approximate: bool = False
    message: str | None = None


class LinkInput(DTO):
    url: str = Field(min_length=1, max_length=2000)


class LinkResult(DTO):
    place: MapPlace | None = None
    query: str | None = None


@router.get("/config")
def map_config(admin: Admin):
    settings = get_settings()
    enabled = bool(settings.geoapify_api_key.get_secret_value().strip())
    return {
        "maps_key": settings.geoapify_maps_api_key.get_secret_value().strip() or None,
        "search_enabled": enabled,
        "routing_enabled": enabled,
    }


def require_provider():
    if not get_settings().geoapify_api_key.get_secret_value().strip():
        raise HTTPException(
            503,
            {
                "code": "provider_not_configured",
                "message": "Добавьте ключ Geoapify в настройках сервера",
            },
        )


def provider_error(status=502, code="provider_unavailable"):
    return HTTPException(
        status,
        {
            "code": code,
            "message": "Geoapify недоступен. Повторите позже или задайте место вручную",
        },
    )


def provider_json(path: str, params: dict):
    require_provider()
    params = {**params, "apiKey": get_settings().geoapify_api_key.get_secret_value().strip()}
    # Do not log URLs/exceptions: the provider requires the secret in its query string.
    try:
        with httpx.Client(
            timeout=PROVIDER_TIMEOUT, follow_redirects=False, trust_env=False
        ) as client:
            with client.stream(
                "GET", f"https://api.geoapify.com/v1/{path}", params=params
            ) as response:
                if response.status_code == 429:
                    raise provider_error(503, "provider_rate_limited")
                if response.status_code != 200:
                    raise provider_error()
                body = bytearray()
                for chunk in response.iter_bytes(chunk_size=65536):
                    body.extend(chunk)
                    if len(body) > MAX_PROVIDER_BYTES:
                        raise provider_error()
                result = json.loads(body)
                if not isinstance(result, dict):
                    raise provider_error()
                return result
    except (httpx.HTTPError, ValueError, UnicodeError, RecursionError):
        raise provider_error() from None


def geocoded_places(
    result: dict, limit: int, *, require_country_code: bool = False
) -> list[MapPlace]:
    try:
        rows = result["results"]
        if not isinstance(rows, list):
            raise ValueError()
        places = []
        for row in rows:
            if not isinstance(row, dict):
                raise ValueError()
            country_code = row.get("country_code")
            if not isinstance(country_code, str):
                if require_country_code:
                    continue
                if country_code is not None:
                    raise ValueError()
                country_code = None
            elif country_code:
                country_code = country_code.upper()
            elif require_country_code:
                continue
            places.append(
                MapPlace(
                    name=(row.get("name") or row.get("address_line1") or row["formatted"])[:200],
                    address=row.get("formatted", "")[:500],
                    country_code=country_code,
                    latitude=row["lat"],
                    longitude=row["lon"],
                    provider="geoapify",
                    provider_place_id=row.get("place_id"),
                )
            )
            if len(places) == limit:
                break
        return places
    except (KeyError, TypeError, ValueError, ValidationError):
        raise provider_error() from None


@router.get("/search", response_model=SearchResult)
def search(
    admin: Admin,
    q: Annotated[str, Query(min_length=2, max_length=500)],
    kind: Literal["city"] | None = None,
    country_code: CountryCode | None = None,
):
    q = q.strip()
    if len(q) < 2 or "\x00" in q:
        raise HTTPException(422, "Введите название или адрес места")
    params = {"text": q, "format": "json", "limit": 5}
    if kind == "city":
        params["type"] = "city"
    if country_code:
        params["filter"] = f"countrycode:{country_code.lower()}"
    return {
        "places": geocoded_places(
            provider_json(
                "geocode/search",
                params,
            ),
            5,
            require_country_code=kind == "city",
        )
    }


@router.get("/reverse", response_model=ReverseResult)
def reverse(
    admin: Admin,
    latitude: Annotated[float, Query(ge=-90, le=90, allow_inf_nan=False)],
    longitude: Annotated[float, Query(ge=-180, le=180, allow_inf_nan=False)],
):
    places = geocoded_places(
        provider_json(
            "geocode/reverse",
            {
                "lat": latitude,
                "lon": longitude,
                "format": "json",
                "limit": 1,
            },
        ),
        1,
    )
    if not places:
        raise HTTPException(404, {"code": "place_not_found", "message": "Адрес не найден"})
    return {"place": places[0]}


def route_result(result: dict, mode: TravelMode) -> RouteResult:
    features = result.get("features")
    if features == []:
        return RouteResult(
            status="unavailable", approximate=mode == "transit", message="Нет данных"
        )
    try:
        feature = features[0]
        properties = feature["properties"]
        distance, duration = properties["distance"], properties["time"]
        for value in (distance, duration):
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise ValueError()
            if not math.isfinite(value) or value < 0:
                raise ValueError()
        geometry = feature["geometry"]
        if geometry["type"] == "MultiLineString":
            lines = geometry["coordinates"]
        elif geometry["type"] == "LineString":
            lines = [geometry["coordinates"]]
        else:
            raise ValueError()
        if not isinstance(lines, list) or not lines:
            raise ValueError()
        coordinates = []
        for line in lines:
            if not isinstance(line, list) or len(line) < 2:
                raise ValueError()
            if coordinates and coordinates[-1] != line[0]:
                raise ValueError()  # Do not draw a fabricated connection across broken geometry.
            for point in line:
                if not isinstance(point, list) or len(point) != 2:
                    raise ValueError()
                for value, bound in zip(point, (180, 90), strict=True):
                    if isinstance(value, bool) or not isinstance(value, (int, float)):
                        raise ValueError()
                    if not math.isfinite(value) or abs(value) > bound:
                        raise ValueError()
            coordinates.extend(line if not coordinates else line[1:])
            if len(coordinates) > 20000:
                raise ValueError()
        return RouteResult(
            status="ok",
            distance_m=distance,
            duration_s=duration,
            geometry=LineString(coordinates=coordinates),
            approximate=mode == "transit",
            message="Примерно, без гарантии расписания на дату поездки"
            if mode == "transit"
            else None,
        )
    except (KeyError, IndexError, TypeError, ValueError, OverflowError):
        raise provider_error() from None


@router.post("/route", response_model=RouteResult)
def route(data: RouteInput, admin: Admin):
    require_provider()
    try:
        params = {
            "waypoints": f"{data.from_place.latitude},{data.from_place.longitude}|"
            f"{data.to.latitude},{data.to.longitude}",
            "mode": data.mode,
            "units": "metric",
            "format": "geojson",
        }
        raw = provider_json("routing", params)
        if data.mode == "transit" and raw.get("features") == []:
            # A missing route is the only fallback trigger. Never retry quota/network/config errors.
            raw = provider_json("routing", {**params, "mode": "approximated_transit"})
            result = route_result(raw, data.mode)
            if result.status == "ok":
                result.message = "Использован приближённый транспорт, без гарантии расписания"
            return result
        return route_result(raw, data.mode)
    except HTTPException as exc:
        return RouteResult(
            status="unavailable",
            approximate=data.mode == "transit",
            message=exc.detail["message"],
        )


GOOGLE_MAP_HOSTS = {
    "google.com",
    "www.google.com",
    "maps.google.com",
    "google.ru",
    "www.google.ru",
    "maps.google.ru",
    "google.co.uk",
    "www.google.co.uk",
    "maps.google.co.uk",
    "google.de",
    "www.google.de",
    "maps.google.de",
    "google.fr",
    "www.google.fr",
    "maps.google.fr",
    "google.co.jp",
    "www.google.co.jp",
    "maps.google.co.jp",
}
SHORT_HOSTS = {"maps.app.goo.gl", "goo.gl"}
NUMBER = r"[-+]?(?:\d+(?:\.\d*)?|\.\d+)"
PAIR = re.compile(rf"(?:loc:)?\s*({NUMBER})\s*,\s*({NUMBER})\s*", re.I)


def valid_google_url(url: str):
    try:
        if len(url) > 2000 or any(ord(c) < 33 or ord(c) == 127 for c in url) or "\\" in url:
            raise ValueError()
        parsed = urlsplit(url)
        if any(ord(c) < 32 or ord(c) == 127 for c in unquote_plus(parsed.path + parsed.query)):
            raise ValueError()
        host = parsed.hostname
        if (
            parsed.scheme != "https"
            or parsed.port not in {None, 443}
            or parsed.username is not None
            or parsed.password is not None
            or host not in GOOGLE_MAP_HOSTS | SHORT_HOSTS
        ):
            raise ValueError()
        if host == "goo.gl" and not parsed.path.startswith("/maps/"):
            raise ValueError()
        if host in GOOGLE_MAP_HOSTS and not (
            host.startswith("maps.") or parsed.path == "/maps" or parsed.path.startswith("/maps/")
        ):
            raise ValueError()
        return parsed
    except ValueError:
        raise HTTPException(
            422,
            {
                "code": "invalid_google_link",
                "message": "Вставьте HTTPS-ссылку Google Maps",
            },
        ) from None


def parse_google_place(url: str, source_url: str) -> LinkResult:
    parsed = valid_google_url(url)
    path = unquote_plus(parsed.path)
    params = parse_qs(parsed.query)
    query = next((params[key][0].strip() for key in ("query", "q") if params.get(key)), "")
    label_match = re.search(r"/maps/(?:place|search)/([^/@]+)", path)
    label = label_match[1].strip() if label_match else ""
    selected = re.search(rf"!3d({NUMBER})!4d({NUMBER})(?:!|/|$)", path)
    match = selected or PAIR.fullmatch(query)
    if match:
        latitude, longitude = float(match[1]), float(match[2])
        if (
            math.isfinite(latitude)
            and math.isfinite(longitude)
            and (-90 <= latitude <= 90 and -180 <= longitude <= 180)
        ):
            return LinkResult(
                place=MapPlace(
                    name=(label or f"{latitude}, {longitude}")[:200],
                    address=label[:500],
                    latitude=latitude,
                    longitude=longitude,
                    provider="google_link",
                    source_url=source_url,
                )
            )
    # @lat,lon and ll parameters describe the camera, never the selected place.
    candidate = query or label
    if candidate and not re.match(r"(?:place_id:|cid:|0x|ChIJ)", candidate, re.I):
        if not PAIR.fullmatch(candidate) and "\x00" not in candidate:
            return LinkResult(query=candidate[:500])
    return LinkResult()


def link_error():
    return HTTPException(
        502,
        {
            "code": "link_unavailable",
            "message": "Не удалось раскрыть ссылку. Найдите место по названию",
        },
    )


def public_google_ip(host: str) -> str:
    future = DNS_POOL.submit(socket.getaddrinfo, host, 443, type=socket.SOCK_STREAM)
    try:
        addresses = [ipaddress.ip_address(row[4][0]) for row in future.result(timeout=3)]
    except (OSError, ValueError, TimeoutError):
        future.cancel()
        raise link_error() from None
    if not addresses or any(not ip.is_global or ip.is_multicast for ip in addresses):
        raise HTTPException(
            422,
            {
                "code": "invalid_google_link",
                "message": "Ссылка ведёт на недопустимый адрес",
            },
        )
    return str(addresses[0])


def expand_short_link(url: str) -> str:
    for _ in range(3):
        parsed = valid_google_url(url)
        if parsed.hostname not in SHORT_HOSTS:
            return url
        host = parsed.hostname
        ip = public_google_ip(host)
        try:
            with httpx.Client(
                timeout=httpx.Timeout(4.0, connect=3.0),
                follow_redirects=False,
                trust_env=False,
            ) as client:
                # Pin the checked DNS result. Host + SNI retain normal TLS certificate validation.
                # No cookies, auth headers, provider credentials or proxy environment are forwarded.
                target = httpx.URL(url).copy_with(host=ip)
                with client.stream(
                    "GET", target, headers={"Host": host}, extensions={"sni_hostname": host}
                ) as response:
                    if sum(len(k) + len(v) for k, v in response.headers.raw) > 32768:
                        raise link_error()
                    length = int(response.headers.get("content-length", "0"))
                    if length < 0 or length > 32768:
                        raise link_error()
                    if response.status_code not in {301, 302, 303, 307, 308}:
                        # HTML is never consumed or scraped; opaque short URLs need a manual pin.
                        if response.status_code == 200:
                            return url
                        raise link_error()
                    location = response.headers.get("location", "")
                    if not location or len(location) > 2000:
                        raise link_error()
                    url = urljoin(url, location)
                    redirected = valid_google_url(url)  # Validate every hop before DNS or HTTP.
                    if redirected.hostname not in SHORT_HOSTS:
                        return url
                    # Never read a redirect body. Closing the stream bounds memory even if chunked.
        except (httpx.HTTPError, ValueError):
            raise link_error() from None
    raise link_error()


@router.post("/resolve-link", response_model=LinkResult)
def resolve_link(data: LinkInput, admin: Admin):
    valid_google_url(data.url)
    return parse_google_place(expand_short_link(data.url), data.url)
