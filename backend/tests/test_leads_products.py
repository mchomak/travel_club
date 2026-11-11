import json

import pytest

from app.leads.products import get_product_registry, read_product_registry


def test_backend_reads_versioned_shared_registry():
    products = get_product_registry()

    assert products
    assert products["route"]["available"] is True
    assert products["route"]["label"]


def test_registry_keeps_disabled_product_labels_for_existing_leads(tmp_path):
    path = tmp_path / "website-products.json"
    path.write_text(
        json.dumps(
            {
                "version": 1,
                "products": [
                    {"id": "legacy", "label": "Historic product", "available": False}
                ],
            }
        ),
        encoding="utf-8",
    )

    products = read_product_registry(path)

    assert products["legacy"]["available"] is False
    assert products["legacy"]["label"] == "Historic product"


@pytest.mark.parametrize(
    "document",
    [
        {"version": 2, "products": [{"id": "route", "label": "Route", "available": True}]},
        {"version": 1, "products": [None]},
        {"version": 1, "products": [{"id": "route", "label": "Route", "available": "yes"}]},
        {
            "version": 1,
            "products": [
                {"id": "route", "label": "Route", "available": True},
                {"id": "route", "label": "Duplicate", "available": False},
            ],
        },
    ],
)
def test_registry_rejects_invalid_version_types_and_duplicate_ids(tmp_path, document):
    path = tmp_path / "website-products.json"
    path.write_text(json.dumps(document), encoding="utf-8")

    with pytest.raises(RuntimeError, match="Website product registry is missing or invalid"):
        read_product_registry(path)
