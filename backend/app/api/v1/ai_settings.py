"""AI settings API endpoints."""

from fastapi import APIRouter

from app.api.deps import CurrentUser
from app.schemas.common import ResponseModel
from app.services.ai_service import AIService

router = APIRouter()


@router.get("", response_model=ResponseModel)
async def get_ai_settings(current_user: CurrentUser):
    """Get current AI model configuration for scan and recommendation."""
    ai_service = AIService()
    return ResponseModel(
        data={
            "scan": ai_service.get_scan_model_info(),
            "recommendation": ai_service.get_recommendation_model_info(),
        }
    )
