import pytest
from pydantic import ValidationError

from app.schemas import EventStage, TripExchange


def test_stage_geo_fields_survive_exchange_roundtrip():
    payload = {
        "format": "travel-club-trip",
        "version": 1,
        "trip": {
            "internal_title": "Trip",
            "start_date": "2027-04-01",
            "end_date": "2027-04-01",
            "participants": 1,
            "items": [
                {
                    "type": "excursion",
                    "title": "Trip",
                    "calculation_mode": "fixed",
                    "currency": "RUB",
                    "stages": [
                        {
                            "title": "Bay",
                            "location": "Maya Bay",
                            "address": "Krabi, Thailand",
                            "map_url": "https://maps.example.com/bay?x=1",
                        },
                        {"title": "Old stage"},
                    ],
                }
            ],
        },
    }
    exported = TripExchange.model_validate(payload).model_dump(mode="json")
    stages = exported["trip"]["items"][0]["stages"]
    assert stages[0]["location"] == "Maya Bay"
    assert stages[0]["address"] == "Krabi, Thailand"
    assert stages[0]["map_url"] == "https://maps.example.com/bay?x=1"
    assert not {"location", "address", "map_url"} & stages[1].keys()
    assert TripExchange.model_validate(exported).model_dump(mode="json") == exported


@pytest.mark.parametrize(
    "url",
    [
        "javascript:alert(1)",
        "https:///missing",
        "https://u:p@example.com",
        "https://example.com/a b",
        "https://example.com/\x00",
    ],
)
def test_stage_rejects_unsafe_map_urls(url):
    with pytest.raises(ValidationError):
        EventStage.model_validate({"title": "Bay", "map_url": url})


def test_stage_empty_map_url_is_compatible():
    assert EventStage.model_validate({"title": "Bay", "map_url": ""}).map_url is None
