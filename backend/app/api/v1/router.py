"""API v1 router."""

from fastapi import APIRouter

from app.api.v1 import auth, wines, scan, recommendations, tags, dashboard, ai_settings

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(scan.router, prefix="/scan", tags=["Scan"])
api_router.include_router(wines.router, prefix="/wines", tags=["Wines"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
api_router.include_router(tags.router, prefix="/tags", tags=["Tags"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(ai_settings.router, prefix="/ai-settings", tags=["AI Settings"])
