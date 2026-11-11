from fastapi import FastAPI, Request

from app.leads.api import router
from app.leads.products import get_product_registry


def create_leads_app() -> FastAPI:
    get_product_registry()
    application = FastAPI(title="Travel Club Website Leads", docs_url=None, redoc_url=None)
    application.include_router(router)

    @application.get("/api/leads/health")
    def health():
        return {"status": "ok"}

    @application.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        return response

    return application


app = create_leads_app()
