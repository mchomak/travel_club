from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from app.auth import router as auth_router
from app.config import get_settings
from app.maps import router as maps_router
from app.pricing import PricingError
from app.research import router as research_router
from app.trips import router as trips_router
from app.validation import validation_message


def create_app() -> FastAPI:
    application = FastAPI(title="Travel Club", docs_url=None, redoc_url=None)
    application.include_router(auth_router)
    application.include_router(trips_router)
    application.include_router(research_router)
    application.include_router(maps_router)

    @application.exception_handler(PricingError)
    async def pricing_error(request: Request, exc: PricingError):
        return JSONResponse(
            {"code": "VALIDATION_ERROR", "message": str(exc)},
            status_code=422,
        )

    @application.middleware("http")
    async def csrf_guard(request: Request, call_next):
        if request.method not in {"GET", "HEAD", "OPTIONS"}:
            origin = request.headers.get("origin")
            settings = get_settings()
            allowed_origins = {settings.allowed_origin}
            if settings.research_origin:
                allowed_origins.add(settings.research_origin)
            if request.headers.get("x-requested-with") != "TravelClub" or (
                origin is not None and origin not in allowed_origins
            ):
                return JSONResponse(
                    {"code": "CSRF_REJECTED", "message": "Обновите страницу и повторите действие"},
                    status_code=403,
                )
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    @application.get("/api/health")
    def health():
        return {"status": "ok"}

    @application.exception_handler(HTTPException)
    async def http_error(request: Request, exc: HTTPException):
        detail = exc.detail
        body = (
            detail
            if isinstance(detail, dict)
            else {"code": f"HTTP_{exc.status_code}", "message": str(detail)}
        )
        return JSONResponse(body, status_code=exc.status_code, headers=exc.headers)

    @application.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError):
        return JSONResponse(
            {
                "code": "VALIDATION_ERROR",
                "message": "Проверьте заполненные поля",
                "details": [
                    {"field": ".".join(map(str, e["loc"])), "message": validation_message(e)}
                    for e in exc.errors()
                ],
            },
            status_code=422,
        )

    return application


app = create_app()
