from tests.test_auth import HEADERS
from tests.test_trips import authenticated, create_trip, editable  # noqa: F401


def test_ignore_restore_and_revision_conflict(authenticated):  # noqa: F811
    trip = create_trip(authenticated)
    base = f"/api/trips/{trip['id']}/validation"
    issue = next(i for i in authenticated.get(base).json()['issues']
                 if i['code'] == 'missing_cover')
    response = authenticated.post(base + '/ignore', headers=HEADERS,
                                  json={'issue_id': issue['id'], 'version': trip['version'],
                                        'reason': 'Accepted for this trip'})
    assert response.status_code == 200, response.text
    assert response.json()['version'] == trip['version']
    ignored = next(i for i in authenticated.get(base).json()['issues'] if i['id'] == issue['id'])
    assert ignored['ignored'] is True
    assert ignored['ignore_reason'] == 'Accepted for this trip'
    payload = editable(authenticated.get(f"/api/trips/{trip['id']}").json())
    payload['internal_title'] = 'Changed'
    saved = authenticated.put(f"/api/trips/{trip['id']}", headers=HEADERS, json=payload)
    assert saved.status_code == 200
    conflict = authenticated.delete(base + f"/ignore/{issue['id']}?version={trip['version']}",
                                    headers=HEADERS)
    assert conflict.status_code == 409
    restore_path = base + f"/ignore/{issue['id']}?version={saved.json()['version']}"
    restored = authenticated.delete(restore_path, headers=HEADERS)
    assert restored.status_code == 200
    issue = next(i for i in authenticated.get(base).json()['issues'] if i['id'] == issue['id'])
    assert issue['ignored'] is False


def test_ignore_requires_valid_reason_and_existing_issue(authenticated):  # noqa: F811
    trip = create_trip(authenticated)
    base = f"/api/trips/{trip['id']}/validation"
    issue = authenticated.get(base).json()['issues'][0]
    for issue_id, reason in ((issue['id'], '  '), ('unknown', 'reason')):
        response = authenticated.post(base + '/ignore', headers=HEADERS,
                                      json={'issue_id': issue_id, 'version': trip['version'],
                                            'reason': reason})
        assert response.status_code in (404, 422)


def test_ignore_requires_authentication_and_csrf(client, authenticated):  # noqa: F811
    trip = create_trip(authenticated)
    path = f"/api/trips/{trip['id']}/validation/ignore"
    issue = authenticated.get(path.removesuffix('/ignore')).json()['issues'][0]
    payload = {'issue_id': issue['id'], 'version': trip['version'], 'reason': 'reason'}
    assert authenticated.post(path, json=payload).status_code == 403
    authenticated.post('/api/auth/logout', headers=HEADERS)
    assert client.post(path, headers=HEADERS, json=payload).status_code == 401


def test_changed_finding_resurfaces_but_moving_path_does_not(authenticated, db):  # noqa: F811
    from app.validation_ignores import annotate_ignored

    trip = create_trip(authenticated)
    path = f"/api/trips/{trip['id']}/validation"
    issue = authenticated.get(path).json()['issues'][0]
    response = authenticated.post(path + '/ignore', headers=HEADERS,
                                  json={'issue_id': issue['id'], 'version': trip['version'],
                                        'reason': 'Accepted'})
    assert response.status_code == 200
    from uuid import UUID
    moved = {**issue, 'path': '/trip/items/99'}
    changed = {**moved, 'current_value': 'different'}
    assert annotate_ignored(db, UUID(trip['id']), [moved])[0]['ignored'] is True
    assert annotate_ignored(db, UUID(trip['id']), [changed])[0]['ignored'] is False


def test_error_cannot_be_ignored(authenticated, monkeypatch):  # noqa: F811
    from app import validation_ignores

    trip = create_trip(authenticated)
    monkeypatch.setattr(validation_ignores, 'validate_business_rules', lambda trip: [
        {'id': 'blocking', 'severity': 'error'}
    ])
    result = authenticated.post(f"/api/trips/{trip['id']}/validation/ignore", headers=HEADERS,
                                json={'issue_id': 'blocking', 'version': trip['version'],
                                      'reason': 'Accepted'})
    assert result.status_code == 422
