import json

from tests.test_auth import HEADERS
from tests.test_trips import authenticated  # noqa: F401


def document():
    return {
        "format": "travel-club-trip",
        "version": 1,
        "trip": {"internal_title": "Draft", "unknown_field": "retain me", "items": []},
    }


def test_incomplete_import_draft_preserves_source_and_uses_revision(authenticated):  # noqa: F811
    source = json.dumps(document(), ensure_ascii=False)
    created = authenticated.post("/api/import-drafts", headers=HEADERS, content=source)
    assert created.status_code == 201, created.text
    draft = created.json()
    assert json.loads(draft["source"]) == document()
    assert draft["version"] == 1
    assert draft["validation"]["document_checks_passed"] is False
    fetched = authenticated.get(f"/api/import-drafts/{draft['id']}")
    assert fetched.json()["source"] == source
    updated_doc = document()
    updated_doc["trip"]["unknown_field"] = "changed"
    updated = authenticated.put(
        f"/api/import-drafts/{draft['id']}?version=1",
        headers=HEADERS,
        content=json.dumps(updated_doc),
    )
    assert updated.status_code == 200
    assert updated.json()["version"] == 2
    assert updated.json()["original_source"] == source
    conflict = authenticated.put(
        f"/api/import-drafts/{draft['id']}?version=1",
        headers=HEADERS,
        content=source,
    )
    assert conflict.status_code == 409
    latest = authenticated.get(f"/api/import-drafts/{draft['id']}").json()["source"]
    assert json.loads(latest) == updated_doc


def test_import_draft_rejects_unreadable_and_ambiguous_documents(authenticated):  # noqa: F811
    for source in (
        "{",
        "[]",
        '{"format":"travel-club-trip","version":2,"trip":{}}',
        '{"format":"travel-club-trip","version":1,"trip":{},"trip":{}}',
    ):
        response = authenticated.post("/api/import-drafts", headers=HEADERS, content=source)
        assert response.status_code == 422


def test_import_draft_requires_authentication(client):
    assert client.get("/api/import-drafts").status_code == 401


def test_ready_draft_applies_once_without_creating_duplicates(authenticated):  # noqa: F811
    source = {
        "format": "travel-club-trip",
        "version": 1,
        "trip": {
            "internal_title": "Ready",
            "start_date": "2027-04-01",
            "end_date": "2027-04-01",
            "participants": 2,
            "items": [],
            "days": [],
            "rates": [],
        },
    }
    draft = authenticated.post("/api/import-drafts", headers=HEADERS, json=source).json()
    first = authenticated.post(f"/api/import-drafts/{draft['id']}/apply?version=1", headers=HEADERS)
    assert first.status_code == 200, first.text
    second = authenticated.post(
        f"/api/import-drafts/{draft['id']}/apply?version=1", headers=HEADERS
    )
    assert second.status_code == 200
    assert second.json()["id"] == first.json()["id"]
    assert (
        authenticated.get(f"/api/import-drafts/{draft['id']}").json()["trip_id"]
        == first.json()["id"]
    )
    assert (
        len(
            [
                trip
                for trip in authenticated.get("/api/trips").json()
                if trip["id"] == first.json()["id"]
            ]
        )
        == 1
    )


def test_invalid_draft_does_not_create_trip(authenticated):  # noqa: F811
    draft = authenticated.post("/api/import-drafts", headers=HEADERS, json=document()).json()
    before = len(authenticated.get("/api/trips").json())
    result = authenticated.post(
        f"/api/import-drafts/{draft['id']}/apply?version=1", headers=HEADERS
    )
    assert result.status_code == 422
    assert len(authenticated.get("/api/trips").json()) == before


def test_draft_apply_rolls_back_trip_on_failure(authenticated, monkeypatch):  # noqa: F811
    from app.import_drafts import import_trip_document
    from app.pricing import PricingError

    source = {
        "format": "travel-club-trip",
        "version": 1,
        "trip": {
            "internal_title": "Rollback",
            "start_date": "2027-04-01",
            "end_date": "2027-04-01",
            "participants": 2,
        },
    }
    draft = authenticated.post("/api/import-drafts", headers=HEADERS, json=source).json()
    before = len(authenticated.get("/api/trips").json())

    def fail_after_flush(*args, **kwargs):
        import_trip_document(*args, **kwargs)
        raise PricingError("fixture failure")

    monkeypatch.setattr("app.import_drafts.import_trip_document", fail_after_flush)
    result = authenticated.post(
        f"/api/import-drafts/{draft['id']}/apply?version=1", headers=HEADERS
    )
    assert result.status_code == 422
    assert len(authenticated.get("/api/trips").json()) == before
    assert authenticated.get(f"/api/import-drafts/{draft['id']}").json()["trip_id"] is None


def test_soft_import_keeps_unknown_items_and_marks_estimate_incomplete(authenticated):  # noqa: F811
    source = {
        "format": "travel-club-trip",
        "version": 1,
        "trip": {
            "internal_title": "Partial",
            "start_date": "2027-04-01",
            "end_date": "2027-04-01",
            "participants": 2,
            "base_currency": "RUB",
            "items": [
                {
                    "type": "other",
                    "title": "Known",
                    "calculation_mode": "fixed",
                    "currency": "RUB",
                    "unit_price": "100",
                },
                {
                    "type": "unknown",
                    "title": "Keep me",
                    "calculation_mode": "fixed",
                    "currency": "RUB",
                    "unit_price": "50",
                },
            ],
        },
    }
    draft = authenticated.post("/api/import-drafts", headers=HEADERS, json=source).json()
    response = authenticated.post(
        f"/api/import-drafts/{draft['id']}/apply?version=1", headers=HEADERS
    )
    assert response.status_code == 200, response.text
    trip = response.json()
    assert [item["title"] for item in trip["items"]] == ["Known"]
    assert trip["unapplied_import_id"] == draft["id"]
    saved = authenticated.get(f"/api/import-drafts/{draft['id']}").json()
    assert json.loads(saved["source"]) == source
    assert saved["unapplied"]
    assert (
        authenticated.put(
            f"/api/import-drafts/{draft['id']}?version=1",
            headers=HEADERS,
            json={**source, "trip": {}},
        ).status_code
        == 409
    )
    assert (
        next(row for row in authenticated.get("/api/trips").json() if row["id"] == trip["id"])[
            "estimate_incomplete"
        ]
        is True
    )
    assert (
        authenticated.post(f"/api/trips/{trip['id']}/public-link", headers=HEADERS).status_code
        == 422
    )
    copied = authenticated.post(f"/api/trips/{trip['id']}/duplicate", headers=HEADERS)
    assert copied.status_code == 201
    assert copied.json()["unapplied_import_id"]
    assert authenticated.post(
        f"/api/trips/{copied.json()['id']}/public-link", headers=HEADERS
    ).status_code == 422
    entry = saved["unapplied"][0]
    request = {"trip_version": trip["version"], **entry}
    changed = authenticated.post(
        f"/api/import-drafts/{draft['id']}/resolve", headers=HEADERS, json=request
    )
    assert changed.status_code == 200
    assert changed.json()["trip_version"] == trip["version"] + 1
    assert changed.json()["resolved"][0]["path"] == entry["path"]
    assert json.loads(changed.json()["source"]) == source
    if len(saved["unapplied"]) == 1:
        assert authenticated.get(f"/api/trips/{trip['id']}").json()["unapplied_import_id"] is None


def test_import_without_price_stays_unapplied_not_confirmed_zero(authenticated):  # noqa: F811
    source = {"format": "travel-club-trip", "version": 1, "trip": {
        "internal_title": "No price", "start_date": "2027-04-01", "end_date": "2027-04-01",
        "participants": 2, "base_currency": "RUB", "items": [
            {"type": "other", "title": "Unknown price", "calculation_mode": "fixed",
             "currency": "RUB"}]}}
    strict = authenticated.post("/api/trips/import", headers=HEADERS, json=source)
    assert strict.status_code == 422
    draft = authenticated.post("/api/import-drafts", headers=HEADERS, json=source).json()
    result = authenticated.post(
        f"/api/import-drafts/{draft['id']}/apply?version=1", headers=HEADERS
    )
    assert result.status_code == 200
    assert result.json()["items"] == []
    assert result.json()["unapplied_import_id"] == draft["id"]
