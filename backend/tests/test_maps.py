import json
import socket

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from tests.conftest import FIXTURE_PASSWORD

HEADERS = {"X-Requested-With": "TravelClub", "Origin": "http://localhost:3000"}
PLACE = {
    "name": "Point",
    "address": "",
    "latitude": 48.85,
    "longitude": 2.35,
    "provider": "manual",
}


@pytest.fixture(autouse=True)
def empty_provider_settings(monkeypatch):
    monkeypatch.setenv("GEOAPIFY_API_KEY", "")
    monkeypatch.setenv("GEOAPIFY_MAPS_API_KEY", "")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def login(client, admin):
    assert (
        client.post(
            "/api/auth/login",
            headers=HEADERS,
            json={
                "login": admin.login,
                "password": FIXTURE_PASSWORD,
            },
        ).status_code
        == 200
    )


def test_city_search_filters_provider_and_validates_country(client, admin, monkeypatch):
    path = "/api/maps/search?q=Paris&kind=city&country_code=FR"
    assert client.get(path).status_code == 401
    login(client, admin)
    requests = []

    def provider(route, params):
        requests.append((route, params))
        return {"results": [
            {"name": "Paris", "formatted": "Paris, France", "country_code": "fr",
             "lat": 48.85, "lon": 2.35},
            {"name": "Unknown city", "formatted": "Unknown city",
             "lat": 48.85, "lon": 2.35},
        ]}

    monkeypatch.setattr("app.maps.provider_json", provider)
    response = client.get(path)
    assert response.status_code == 200
    assert response.json()["places"] == [{
        "name": "Paris", "address": "Paris, France", "country_code": "FR",
        "latitude": 48.85, "longitude": 2.35, "provider": "geoapify",
        "provider_place_id": None, "source_url": None,
    }]
    assert requests == [("geocode/search", {
        "text": "Paris", "format": "json", "limit": 5,
        "type": "city", "filter": "countrycode:fr",
    })]
    requests.clear()
    for suffix in ("&country_code=ZZ", "&country_code=fra", "&country_code=fr",
                   "&country_code=FR,DE", "&kind=country"):
        assert client.get("/api/maps/search?q=Paris" + suffix).status_code == 422
    assert requests == []
    assert client.get("/api/maps/search?q=Paris").status_code == 200
    assert requests[-1][1] == {"text": "Paris", "format": "json", "limit": 5}
    assert client.get("/api/maps/search?q=Paris&kind=city").status_code == 200
    assert requests[-1][1]["type"] == "city" and "filter" not in requests[-1][1]


def test_maps_auth_and_unconfigured_runtime(client, admin, monkeypatch):
    monkeypatch.setenv("GEOAPIFY_API_KEY", "")
    monkeypatch.setenv("GEOAPIFY_MAPS_API_KEY", "")
    get_settings.cache_clear()
    endpoints = [
        ("GET", "/api/maps/config", None),
        ("GET", "/api/maps/search?q=Paris", None),
        ("GET", "/api/maps/reverse?latitude=48&longitude=2", None),
        ("POST", "/api/maps/resolve-link", {"url": "https://maps.google.com/?q=Paris"}),
        ("POST", "/api/maps/route", {"from": PLACE, "to": PLACE, "mode": "walk"}),
    ]
    for method, path, body in endpoints:
        assert client.request(method, path, headers=HEADERS, json=body).status_code == 401
    login(client, admin)
    assert client.get("/api/maps/config").json() == {
        "maps_key": None,
        "search_enabled": False,
        "routing_enabled": False,
    }
    for method, path, body in endpoints[1:3] + endpoints[4:]:
        response = client.request(method, path, headers=HEADERS, json=body)
        assert response.status_code == 503
        assert response.json()["code"] == "provider_not_configured"
    get_settings.cache_clear()


@pytest.mark.parametrize(
    "path",
    [
        "/api/maps/search?q=Paris",
        "/api/maps/reverse?latitude=48.85&longitude=2.35",
    ],
)
def test_geocoding_normalizes_places_and_hides_provider_payload(client, admin, monkeypatch, path):
    monkeypatch.setenv("GEOAPIFY_API_KEY", "TEST-ONLY-SERVER-KEY")
    monkeypatch.setenv("GEOAPIFY_MAPS_API_KEY", "TEST-ONLY-BROWSER-KEY")
    get_settings.cache_clear()
    login(client, admin)

    def respond(self, request):
        assert request.url.host == "api.geoapify.com"
        assert request.url.params["apiKey"] == "TEST-ONLY-SERVER-KEY"
        assert request.url.params["format"] == "json"
        assert int(request.url.params["limit"]) <= 5
        return httpx.Response(
            200,
            json={
                "results": [
                    {
                        "name": "Paris",
                        "formatted": "Paris, France",
                        "lat": 48.85,
                        "lon": 2.35,
                        "place_id": "provider-id",
                        "secret_provider_payload": "do not forward",
                    }
                ]
            },
        )

    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", respond)
    response = client.get(path)
    assert response.status_code == 200
    places = response.json().get("places", [response.json().get("place")])
    assert places == [
        {
            "name": "Paris",
            "address": "Paris, France",
            "latitude": 48.85,
            "longitude": 2.35,
            "provider": "geoapify",
            "provider_place_id": "provider-id",
            "source_url": None,
        }
    ]
    assert client.get("/api/maps/config").json() == {
        "maps_key": "TEST-ONLY-BROWSER-KEY",
        "search_enabled": True,
        "routing_enabled": True,
    }


@pytest.mark.parametrize("mode", ["drive", "walk", "transit"])
def test_route_modes_normalize_geojson(client, admin, monkeypatch, mode):
    monkeypatch.setenv("GEOAPIFY_API_KEY", "TEST-ONLY-SERVER-KEY")
    get_settings.cache_clear()
    login(client, admin)

    def respond(self, request):
        assert request.url.path == "/v1/routing"
        assert request.url.params["mode"] == mode
        assert request.url.params["waypoints"] == "48.85,2.35|48.86,2.36"
        assert request.url.params["units"] == "metric"
        return httpx.Response(
            200,
            json={
                "features": [
                    {
                        "properties": {"distance": 1234, "time": 321, "apiKey": "never return"},
                        "geometry": {
                            "type": "MultiLineString",
                            "coordinates": [
                                [[2.35, 48.85], [2.355, 48.855]],
                                [[2.355, 48.855], [2.36, 48.86]],
                            ],
                        },
                    }
                ]
            },
        )

    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", respond)
    response = client.post(
        "/api/maps/route",
        headers=HEADERS,
        json={
            "from": PLACE,
            "to": {**PLACE, "latitude": 48.86, "longitude": 2.36},
            "mode": mode,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "status": "ok",
        "distance_m": 1234,
        "duration_s": 321,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [2.35, 48.85],
                [2.355, 48.855],
                [2.36, 48.86],
            ],
        },
        "approximate": mode == "transit",
        "message": "Примерно, без гарантии расписания на дату поездки"
        if mode == "transit"
        else None,
    }


def test_transit_fallback_only_after_empty_route(client, admin, monkeypatch):
    monkeypatch.setenv("GEOAPIFY_API_KEY", "TEST-ONLY-SERVER-KEY")
    get_settings.cache_clear()
    login(client, admin)
    modes = []

    def respond(self, request):
        modes.append(request.url.params["mode"])
        if len(modes) == 1:
            return httpx.Response(200, json={"features": []})
        return httpx.Response(
            200,
            json={
                "features": [
                    {
                        "properties": {"distance": 10, "time": 20},
                        "geometry": {
                            "type": "MultiLineString",
                            "coordinates": [[[2, 48], [3, 49]]],
                        },
                    }
                ]
            },
        )

    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", respond)
    result = client.post(
        "/api/maps/route",
        headers=HEADERS,
        json={
            "from": PLACE,
            "to": {**PLACE, "latitude": 49},
            "mode": "transit",
        },
    ).json()
    assert modes == ["transit", "approximated_transit"]
    assert result["status"] == "ok" and result["approximate"] is True
    assert "приближён" in result["message"] and "расписания" in result["message"]


@pytest.mark.parametrize("failure", ["429", "403", "timeout", "json", "row", "oversize"])
def test_provider_failures_are_controlled_redacted_and_not_retried(
    client,
    admin,
    monkeypatch,
    caplog,
    failure,
):
    monkeypatch.setenv("GEOAPIFY_API_KEY", "TEST-ONLY-SERVER-KEY")
    get_settings.cache_clear()
    login(client, admin)
    calls = []

    def respond(self, request):
        calls.append(request)
        if failure == "timeout":
            raise httpx.ReadTimeout("TEST-ONLY-SERVER-KEY raw secret", request=request)
        if failure in {"429", "403"}:
            return httpx.Response(int(failure), json={"message": "TEST-ONLY-SERVER-KEY"})
        if failure == "json":
            return httpx.Response(200, content=b"not json")
        if failure == "row":
            return httpx.Response(200, json={"results": [[]], "features": [None]})
        return httpx.Response(200, content=b" " * 2_000_001)

    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", respond)
    with caplog.at_level("DEBUG"):
        response = client.get("/api/maps/search?q=Paris")
        route = client.post(
            "/api/maps/route",
            headers=HEADERS,
            json={
                "from": PLACE,
                "to": {**PLACE, "latitude": 49},
                "mode": "transit",
            },
        )
    assert response.status_code == (503 if failure == "429" else 502)
    assert route.status_code == 200
    assert route.json()["status"] == "unavailable"
    assert route.json()["distance_m"] is None and route.json()["geometry"] is None
    assert len(calls) == 2
    assert "TEST-ONLY-SERVER-KEY" not in response.text + route.text + caplog.text


@pytest.mark.parametrize(
    "url,coordinates,query",
    [
        (
            "https://www.google.com/maps/place/Tower/@10,20,8z/data=!3d48.8584!4d2.2945",
            [48.8584, 2.2945],
            None,
        ),
        ("https://maps.google.com/?q=48.8584,2.2945", [48.8584, 2.2945], None),
        ("https://www.google.com/maps/search/?api=1&query=Eiffel+Tower", None, "Eiffel Tower"),
        ("https://www.google.com/maps/place/Eiffel+Tower/@10,20,8z", None, "Eiffel Tower"),
        ("https://www.google.com/maps/@10,20,8z?ll=10,20", None, None),
        ("https://maps.google.com/?q=place_id:opaque", None, None),
        ("https://www.google.com/maps/search/?api=1&query_place_id=opaque", None, None),
    ],
)
def test_google_links_parse_selected_location_without_fetch(
    client,
    admin,
    monkeypatch,
    url,
    coordinates,
    query,
):
    login(client, admin)

    def no_network(*args, **kwargs):
        pytest.fail("Full Google links must be parsed offline")

    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", no_network)
    response = client.post("/api/maps/resolve-link", headers=HEADERS, json={"url": url})
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == query
    if coordinates:
        assert [data["place"]["latitude"], data["place"]["longitude"]] == coordinates
        assert data["place"]["provider"] == "google_link"
        assert data["place"]["source_url"] == url
    else:
        assert data["place"] is None


@pytest.mark.parametrize(
    "scenario,status",
    [
        ("success", 200),
        ("private", 422),
        ("mixed_dns", 422),
        ("dns_error", 502),
        ("evil_redirect", 422),
        ("loop", 502),
        ("oversize_location", 502),
        ("oversize_response", 502),
        ("timeout", 502),
    ],
)
def test_short_links_bound_redirects_and_pin_public_dns(
    client, admin, monkeypatch, scenario, status
):
    login(client, admin)
    requests = []

    def resolve(host, port, **kwargs):
        assert host in {"maps.app.goo.gl", "goo.gl"}
        if scenario == "dns_error":
            raise socket.gaierror("do not expose raw resolver details")
        addresses = ["127.0.0.1"] if scenario == "private" else ["8.8.8.8"]
        if scenario == "mixed_dns":
            addresses.append("169.254.169.254")
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (ip, port)) for ip in addresses]

    def respond(self, request):
        requests.append(request)
        assert request.url.host == "8.8.8.8"  # Pin verified address, no second DNS lookup.
        assert request.headers["host"] == "maps.app.goo.gl"
        assert request.extensions["sni_hostname"] == "maps.app.goo.gl"
        assert "apiKey" not in request.url.params
        if scenario == "timeout":
            raise httpx.ReadTimeout("raw details", request=request)
        location = "https://maps.google.com/?q=48.8584,2.2945"
        if scenario == "evil_redirect":
            location = "https://127.0.0.1/admin"
        elif scenario == "loop":
            location = "https://maps.app.goo.gl/repeat"
        elif scenario == "oversize_location":
            location = "https://maps.google.com/?q=" + "x" * 2000
        headers = {"location": location}
        if scenario == "oversize_response":
            headers["content-length"] = "1000000000"
        return httpx.Response(302, headers=headers)

    monkeypatch.setattr(socket, "getaddrinfo", resolve)
    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", respond)
    response = client.post(
        "/api/maps/resolve-link", headers=HEADERS, json={"url": "https://maps.app.goo.gl/example"}
    )
    assert response.status_code == status
    assert len(requests) <= 3
    if scenario == "success":
        assert response.json()["place"]["latitude"] == 48.8584
        assert response.json()["place"]["source_url"] == "https://maps.app.goo.gl/example"
    if scenario in {"private", "mixed_dns", "dns_error"}:
        assert requests == []


@pytest.mark.parametrize(
    "url",
    [
        "http://maps.google.com/?q=Paris",
        "https://google.com.evil.test/maps/?q=Paris",
        "https://evilgoogle.com/maps/",
        "https://maps.google.com@127.0.0.1/",
        "https://user:password@maps.google.com/?q=Paris",
        "https://maps.google.com:8000/?q=Paris",
        "https://maps.google.com./?q=Paris",
        "https://127.0.0.1/maps/",
        "https://www.google.com/url?q=http://127.0.0.1",
        "https://goo.gl/arbitrary",
        "https://maps.google.com\\@evil.test/",
        "https://maps.google.com/\n?q=Paris",
    ],
)
def test_google_links_reject_non_maps_and_credential_urls(client, admin, monkeypatch, url):
    login(client, admin)

    def no_network(*args, **kwargs):
        pytest.fail("Disallowed URL must never cause network access")

    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", no_network)
    response = client.post("/api/maps/resolve-link", headers=HEADERS, json={"url": url})
    assert response.status_code == 422


def test_google_link_encoded_null_never_becomes_server_error(client, admin):
    login(client, admin)
    response = client.post("/api/maps/resolve-link", headers=HEADERS, json={
        "url": "https://www.google.com/maps/place/Bad%00Name/data=!3d48.85!4d2.35",
    })
    assert response.status_code == 422


def test_deeply_nested_provider_json_is_controlled(client, admin, monkeypatch):
    monkeypatch.setenv("GEOAPIFY_API_KEY", "TEST-ONLY-SERVER-KEY")
    get_settings.cache_clear()
    login(client, admin)
    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", lambda self, request: httpx.Response(
        200, content=b'{"results":' + b'[' * 2000 + b']' * 2000 + b'}',
    ))
    assert client.get("/api/maps/search?q=Paris").status_code == 502


@pytest.mark.parametrize("field", ["distance", "longitude", "latitude"])
def test_oversized_provider_route_numbers_are_controlled(client, admin, monkeypatch, field):
    monkeypatch.setenv("GEOAPIFY_API_KEY", "TEST-ONLY-SERVER-KEY")
    get_settings.cache_clear()
    login(client, admin)
    huge = 10 ** 999  # Valid JSON integer; conversion to a float raises OverflowError.
    properties = {"distance": huge if field == "distance" else 10, "time": 20}
    point = [huge if field == "longitude" else 2, huge if field == "latitude" else 48]
    feature = {
        "properties": {**properties, "apiKey": "TEST-ONLY-SERVER-KEY"},
        "geometry": {"type": "MultiLineString", "coordinates": [[point, [3, 49]]]},
    }
    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", lambda self, request: httpx.Response(
        200, json={"features": [feature]},
    ))
    with TestClient(client.app, raise_server_exceptions=False) as browser:
        browser.cookies.update(client.cookies)
        response = browser.post("/api/maps/route", headers=HEADERS, json={
            "from": PLACE, "to": {**PLACE, "latitude": 49}, "mode": "drive",
        })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "unavailable"
    assert data["distance_m"] is None and data["duration_s"] is None and data["geometry"] is None
    assert data["message"]
    assert "TEST-ONLY-SERVER-KEY" not in response.text


def test_provider_parser_recursion_is_controlled(client, admin, monkeypatch):
    monkeypatch.setenv("GEOAPIFY_API_KEY", "TEST-ONLY-SERVER-KEY")
    get_settings.cache_clear()
    login(client, admin)
    payload = b'{"results":[],"fixture":"parser-recursion"}'
    original_loads = json.loads

    def decode(data, *args, **kwargs):
        if data == payload:
            raise RecursionError("TEST-ONLY-SERVER-KEY parser details")
        return original_loads(data, *args, **kwargs)

    monkeypatch.setattr(json, "loads", decode)
    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", lambda self, request: httpx.Response(
        200, content=payload,
    ))
    with TestClient(client.app, raise_server_exceptions=False) as browser:
        browser.cookies.update(client.cookies)
        response = browser.get("/api/maps/search?q=Paris")
    assert response.status_code == 502
    assert response.json()["code"] == "provider_unavailable"
    assert "TEST-ONLY-SERVER-KEY" not in response.text
