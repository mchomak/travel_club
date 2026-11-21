import json
from pathlib import Path
from typing import Annotated

from pydantic import AfterValidator

# The repository and the backend image both place shared/ beside the backend root.
_catalog = Path(__file__).resolve().parents[2] / "shared" / "trip-photos.json"
_photo_ids = frozenset(json.loads(_catalog.read_text(encoding="utf-8")))


def validate_photo_id(value: str) -> str:
    if value not in _photo_ids:
        raise ValueError("Выберите фотографию из каталога")
    return value


PhotoId = Annotated[str, AfterValidator(validate_photo_id)]
