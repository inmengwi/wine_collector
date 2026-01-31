"""Dashboard API endpoints."""

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.schemas.common import ResponseModel
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/summary", response_model=ResponseModel[dict])
async def get_summary(
    current_user: CurrentUser,
    db: DbSession,
):
    """Get cellar summary statistics for dashboard."""
    service = DashboardService(db)
    result = await service.get_cellar_summary(current_user.id)
    return ResponseModel(data=result)


@router.get("/expiring", response_model=ResponseModel[dict])
async def get_expiring_wines(
    current_user: CurrentUser,
    db: DbSession,
    years: int = Query(2, ge=1, le=10, description="Years until expiration"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results"),
):
    """Get wines approaching their drinking window end."""
    service = DashboardService(db)
    result = await service.get_expiring_wines(
        user_id=current_user.id,
        years=years,
        limit=limit,
    )
    return ResponseModel(data=result)
