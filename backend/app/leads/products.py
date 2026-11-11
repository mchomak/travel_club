"""Read the shared, versioned Website product registry."""

import json
from functools import lru_cache
from pathlib import Path
from typing import TypedDict

REGISTRY_VERSION = 1
UNKNOWN_PRODUCT_LABEL = "Неизвестный формат"


class WebsiteProduct(TypedDict):
    id: str
    label: str
    available: bool


def read_product_registry(path: Path) -> dict[str, WebsiteProduct]:
    """Parse and validate a registry, raising a generic configuration error."""
    try:
        registry = json.loads(path.read_text(encoding="utf-8"))
        if (
            not isinstance(registry, dict)
            or type(registry.get("version")) is not int
            or registry["version"] != REGISTRY_VERSION
        ):
            raise ValueError
        entries = registry.get("products")
        if not isinstance(entries, list) or not entries:
            raise ValueError

        products: dict[str, WebsiteProduct] = {}
        for entry in entries:
            if not isinstance(entry, dict):
                raise ValueError
            product_id = entry.get("id")
            label = entry.get("label")
            available = entry.get("available")
            if (
                not isinstance(product_id, str)
                or not product_id
                or len(product_id) > 40
                or not isinstance(label, str)
                or not label.strip()
                or type(available) is not bool
                or product_id in products
            ):
                raise ValueError
            products[product_id] = {
                "id": product_id,
                "label": label,
                "available": available,
            }
        return products
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
        raise RuntimeError("Website product registry is missing or invalid") from exc


@lru_cache(maxsize=1)
def get_product_registry() -> dict[str, WebsiteProduct]:
    mounted_registry = Path("/shared/website-products.json")
    repository_registry = Path(__file__).resolve().parents[3] / "shared" / "website-products.json"
    registry_path = mounted_registry if mounted_registry.is_file() else repository_registry
    return read_product_registry(registry_path)


def is_available_product(product_id: str) -> bool:
    product = get_product_registry().get(product_id)
    return bool(product and product["available"])


def get_product_label(product_id: str) -> str:
    product = get_product_registry().get(product_id)
    return product["label"] if product else UNKNOWN_PRODUCT_LABEL
