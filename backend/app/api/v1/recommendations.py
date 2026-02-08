"""Recommendations API endpoints."""

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.schemas.common import ResponseModel, PaginatedResponse
from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendationHistoryItem,
)
from app.services.recommendation_service import RecommendationService

router = APIRouter()


@router.post("", response_model=ResponseModel[RecommendationResponse])
async def get_recommendations(
    request: RecommendationRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Get wine pairing recommendations based on food or occasion."""
    service = RecommendationService(db)
    result = await service.get_recommendations(
        user_id=current_user.id,
        query=request.query,
        query_type=request.query_type,
        preferences=request.preferences,
        user_language=current_user.language,
    )

    return ResponseModel(data=result)


@router.get("/history", response_model=PaginatedResponse[RecommendationHistoryItem])
async def get_recommendation_history(
    current_user: CurrentUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    """Get user's recommendation history."""
    service = RecommendationService(db)
    result = await service.get_history(
        user_id=current_user.id,
        page=page,
        size=size,
    )

    return result
