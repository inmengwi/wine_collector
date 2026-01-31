"""Recommendation schemas."""

from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.wine import UserWineListResponse


class RecommendationPreferences(BaseModel):
    """User preferences for recommendation."""

    wine_types: list[str] | None = None
    max_results: int = Field(default=5, ge=1, le=10)
    prioritize_expiring: bool = True


class RecommendationRequest(BaseModel):
    """Recommendation request."""

    query: str = Field(..., min_length=1, max_length=500)
    query_type: Literal["food", "occasion", "mood"] = "food"
    preferences: RecommendationPreferences | None = None


class RecommendationItem(BaseModel):
    """Individual recommendation item."""

    rank: int
    match_score: Decimal
    user_wine: UserWineListResponse
    reason: str
    pairing_tips: str | None = None
    drinking_urgency: Literal["drink_now", "drink_soon", "optimal", "can_wait"]


class RecommendationResponse(BaseModel):
    """Recommendation response."""

    recommendation_id: UUID
    query: str
    recommendations: list[RecommendationItem]
    general_advice: str | None = None
    no_match_alternatives: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecommendationHistoryItem(BaseModel):
    """Recommendation history list item."""

    id: UUID
    query: str
    query_type: str
    top_recommendation: dict | None = None  # wine_name, match_score
    total_recommendations: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
