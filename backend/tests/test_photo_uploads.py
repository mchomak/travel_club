import base64
from io import BytesIO

import pytest
from PIL import Image

from app.photo_uploads import normalize_image
from tests.conftest import FIXTURE_PASSWORD
from tests.test_auth import HEADERS
from tests.test_trips import create_trip, editable


def test_photo_upload_reencodes_image_and_rejects_non_images():
    source = BytesIO()
    Image.new("RGB", (2, 3), "red").save(source, "PNG", pnginfo=None)
    normalized = normalize_image(source.getvalue())
    with Image.open(BytesIO(normalized)) as result:
        assert result.format == "JPEG"
        assert result.size == (2, 3)
        assert not result.info.get("exif")
    with pytest.raises(ValueError):
        normalize_image(b"not an image")


def test_photo_upload_access_save_revoke_and_duplicate(client, admin):
    image = BytesIO()
    Image.new("RGB", (2, 3), "red").save(image, "PNG")
    data = image.getvalue()
    path = "/api/trips/00000000-0000-0000-0000-000000000000/photos"
    headers = {**HEADERS, "Content-Type": "image/png"}
    assert client.post(path, headers=headers, content=data).status_code == 401
    assert client.post("/api/auth/login", headers=HEADERS, json={
        "login": admin.login, "password": FIXTURE_PASSWORD,
    }).status_code == 200
    trip = create_trip(client)
    other = create_trip(client)
    photo_path = f"/api/trips/{trip['id']}/photos"
    assert client.post(photo_path, headers=headers, content=b"not an image").status_code == 422
    too_large = client.post(photo_path, headers=headers, content=b"x" * (5 * 1024 * 1024 + 1))
    assert too_large.status_code == 413
    upload = client.post(photo_path, headers=headers, content=data)
    assert upload.status_code == 201
    photo_id = upload.json()["id"]
    assert client.get(f"{photo_path}/{photo_id}").headers["content-type"] == "image/jpeg"
    assert client.get(f"/api/trips/{other['id']}/photos/{photo_id}").status_code == 404
    foreign = editable(other)
    foreign["days"][0]["photo_id"] = photo_id
    assert client.put(f"/api/trips/{other['id']}", headers=HEADERS, json=foreign).status_code == 422
    payload = editable(trip)
    payload["days"][0]["photo_id"] = photo_id
    saved = client.put(f"/api/trips/{trip['id']}", headers=HEADERS, json=payload)
    assert saved.status_code == 200
    exported = {
        "format": "travel-club-trip", "version": 1, "trip": editable(saved.json()),
        "photos": {
            photo_id: base64.b64encode(client.get(f"{photo_path}/{photo_id}").content).decode()
        },
    }
    exported["trip"].pop("version")
    imported = client.post("/api/trips/import", headers=HEADERS, json=exported)
    assert imported.status_code == 201, imported.text
    imported_trip = imported.json()
    imported_id = imported_trip["days"][0]["photo_id"]
    assert imported_id != photo_id
    assert client.get(f"/api/trips/{imported_trip['id']}/photos/{imported_id}").status_code == 200
    del exported["photos"][photo_id]
    assert client.post("/api/trips/import", headers=HEADERS, json=exported).status_code == 422
    token = client.post(f"/api/trips/{trip['id']}/public-link", headers=HEADERS).json()["token"]
    public_path = f"/api/public/trips/{token}/photos/{photo_id}"
    assert client.get(public_path).status_code == 200
    duplicate = client.post(f"/api/trips/{trip['id']}/duplicate", headers=HEADERS).json()
    copied_id = duplicate["days"][0]["photo_id"]
    assert copied_id != photo_id
    assert client.get(f"/api/trips/{duplicate['id']}/photos/{copied_id}").status_code == 200
    assert client.delete(f"/api/trips/{trip['id']}/public-link", headers=HEADERS).status_code == 204
    assert client.get(public_path).status_code == 404
