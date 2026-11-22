"""Bounded, re-encoded day photos stored with their trip."""

import re
import warnings
from io import BytesIO
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Request, Response
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy import insert, select
from starlette.concurrency import run_in_threadpool

from app.auth import Admin, Database
from app.models import Trip, TripDay
from app.photo_storage import uploaded_photos

router = APIRouter(tags=["day photos"])
MAX_UPLOAD = 5 * 1024 * 1024
MAX_PIXELS = 20_000_000


def normalize_image(data: bytes) -> bytes:
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(data), formats=["JPEG", "PNG", "WEBP"]) as image:
                if image.width * image.height > MAX_PIXELS or getattr(image, "n_frames", 1) != 1:
                    raise ValueError("Invalid image dimensions or animation")
                image = ImageOps.exif_transpose(image).convert("RGB")
                image.thumbnail((2400, 2400))
                output = BytesIO()
                image.save(output, format="JPEG", quality=85, optimize=True)
                normalized = output.getvalue()
                if len(normalized) > MAX_UPLOAD:
                    raise ValueError("Image too large after processing")
                return normalized
    except (
        UnidentifiedImageError, OSError, Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ) as exc:
        raise ValueError("Invalid image") from exc


@router.post("/api/trips/{trip_id}/photos", status_code=201)
async def upload_photo(trip_id: UUID, request: Request, user: Admin, db: Database):
    if not db.scalar(select(Trip.id).where(Trip.id == trip_id)):
        raise HTTPException(404, "Trip not found")
    content_type = request.headers.get("content-type", "").split(";")[0]
    if content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(415, "Choose a JPEG, PNG or WebP image")
    data = bytearray()
    async for chunk in request.stream():
        if len(data) + len(chunk) > MAX_UPLOAD:
            raise HTTPException(413, "Image must be at most 5 MB")
        data.extend(chunk)
    try:
        content = await run_in_threadpool(normalize_image, bytes(data))
    except ValueError:
        raise HTTPException(422, "Choose a valid JPEG, PNG or WebP image") from None
    photo_id = "upload-" + uuid4().hex
    db.execute(insert(uploaded_photos).values(id=photo_id, trip_id=trip_id, content=content))
    db.commit()
    return {"id": photo_id}


def photo_response(content: bytes | None) -> Response:
    if content is None:
        raise HTTPException(404, "Photo not found")
    return Response(
        content=content, media_type="image/jpeg", headers={"Content-Disposition": "inline"}
    )


@router.get("/api/trips/{trip_id}/photos/{photo_id}")
def admin_photo(trip_id: UUID, photo_id: str, user: Admin, db: Database):
    content = db.scalar(select(uploaded_photos.c.content).where(
        uploaded_photos.c.trip_id == trip_id, uploaded_photos.c.id == photo_id
    ))
    return photo_response(content)


@router.get("/api/public/trips/{token}/photos/{photo_id}")
def public_photo(token: str, photo_id: str, db: Database):
    if not re.fullmatch(r"[A-Za-z0-9_-]{43}", token):
        raise HTTPException(404, "Photo not found")
    content = db.scalar(select(uploaded_photos.c.content).join(
        Trip, Trip.id == uploaded_photos.c.trip_id
    ).join(TripDay, TripDay.trip_id == Trip.id).where(
        Trip.public_link_token == token, TripDay.photo_id == uploaded_photos.c.id,
        uploaded_photos.c.id == photo_id,
    ))
    return photo_response(content)
