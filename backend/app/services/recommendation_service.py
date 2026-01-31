"""Recommendation service."""

import uuid
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.wine import Wine
from app.models.user_wine import UserWine
from app.models.recommendation import Recommendation
from app.schemas.recommendation import (
    RecommendationPreferences,
    RecommendationResponse,
    RecommendationItem,
    RecommendationHistoryItem,
)
from app.schemas.common import PaginatedResponse, PaginatedData, PaginationMeta
from app.services.ai_service import AIService


class RecommendationService:
    """Service for wine pairing recommendations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.ai_service = AIService()

    def _get_drinking_urgency(self, wine: Wine) -> str:
        """Calculate drinking urgency based on drinking window."""
        if not wine.drinking_window_end:
            return "can_wait"

        current_year = datetime.now().year

        if wine.drinking_window_end < current_year:
            return "drink_now"
        elif wine.drinking_window_end <= current_year + 1:
            return "drink_soon"
        elif wine.drinking_window_start and wine.drinking_window_start <= current_year:
            return "optimal"
        else:
            return "can_wait"

    async def get_recommendations(
        self,
        user_id: UUID,
        query: str,
        query_type: str = "food",
        preferences: RecommendationPreferences | None = None,
    ) -> RecommendationResponse:
        """Get wine pairing recommendations based on user query."""
        # Get user's available wines
        wine_query = (
            select(UserWine)
            .options(selectinload(UserWine.wine), selectinload(UserWine.tags))
            .where(
                UserWine.user_id == user_id,
                UserWine.deleted_at.is_(None),
                UserWine.status == "owned",
                UserWine.quantity > 0,
            )
        )

        # Apply wine type filter if specified
        if preferences and preferences.wine_types:
            wine_query = wine_query.join(Wine).where(
                Wine.type.in_(preferences.wine_types)
            )

        result = await self.db.execute(wine_query)
        user_wines = result.scalars().all()

        if not user_wines:
            # No wines available
            recommendation_id = uuid.uuid4()
            return RecommendationResponse(
                recommendation_id=recommendation_id,
                query=query,
                recommendations=[],
                general_advice="셀러에 와인이 없습니다. 먼저 와인을 등록해주세요.",
                no_match_alternatives="와인을 스캔하여 컬렉션에 추가해보세요.",
                created_at=datetime.utcnow(),
            )

        # Prepare wine data for AI
        wines_data = []
        for uw in user_wines:
            wine = uw.wine
            wines_data.append({
                "id": str(uw.id),
                "name": wine.name,
                "vintage": wine.vintage,
                "type": wine.type,
                "country": wine.country,
                "region": wine.region,
                "grape_variety": wine.grape_variety,
                "body": wine.body,
                "tannin": wine.tannin,
                "acidity": wine.acidity,
                "sweetness": wine.sweetness,
                "food_pairing": wine.food_pairing,
                "flavor_notes": wine.flavor_notes,
                "drinking_window_end": wine.drinking_window_end,
                "quantity": uw.quantity,
            })

        # Get AI recommendations
        ai_result = await self.ai_service.get_pairing_recommendations(query, wines_data)

        # Build recommendation items
        recommendations = []
        recommended_wine_ids = []

        for rec in ai_result.get("recommendations", [])[:preferences.max_results if preferences else 5]:
            user_wine_id = rec.get("wine_id")
            if not user_wine_id:
                continue

            # Find the user wine
            user_wine = next(
                (uw for uw in user_wines if str(uw.id) == user_wine_id),
                None
            )
            if not user_wine:
                continue

            recommended_wine_ids.append(UUID(user_wine_id))

            # Build light wine response
            wine_response = {
                "id": user_wine.id,
                "quantity": user_wine.quantity,
                "status": user_wine.status,
                "purchase_date": user_wine.purchase_date,
                "purchase_price": user_wine.purchase_price,
                "created_at": user_wine.created_at,
                "wine": user_wine.wine,
                "tags": user_wine.tags,
                "drinking_status": self._get_drinking_urgency(user_wine.wine),
            }

            recommendations.append(
                RecommendationItem(
                    rank=rec["rank"],
                    match_score=Decimal(str(rec["match_score"])),
                    user_wine=wine_response,
                    reason=rec["reason"],
                    pairing_tips=rec.get("pairing_tips"),
                    drinking_urgency=rec.get("drinking_urgency", "can_wait"),
                )
            )

        # Save recommendation to history
        recommendation_id = uuid.uuid4()
        recommendation_record = Recommendation(
            id=recommendation_id,
            user_id=user_id,
            query_type=query_type,
            query_text=query,
            result=ai_result,
            recommended_wine_ids=recommended_wine_ids,
            ai_model="claude-sonnet-4-20250514",
        )
        self.db.add(recommendation_record)
        await self.db.commit()

        return RecommendationResponse(
            recommendation_id=recommendation_id,
            query=query,
            recommendations=recommendations,
            general_advice=ai_result.get("general_advice"),
            no_match_alternatives=None,
            created_at=datetime.utcnow(),
        )

    async def get_history(
        self,
        user_id: UUID,
        page: int = 1,
        size: int = 20,
    ) -> PaginatedResponse:
        """Get user's recommendation history."""
        # Count total
        count_result = await self.db.execute(
            select(func.count()).where(Recommendation.user_id == user_id)
        )
        total = count_result.scalar() or 0

        # Get recommendations
        offset = (page - 1) * size
        result = await self.db.execute(
            select(Recommendation)
            .where(Recommendation.user_id == user_id)
            .order_by(Recommendation.created_at.desc())
            .offset(offset)
            .limit(size)
        )
        recommendations = result.scalars().all()

        # Build response
        items = []
        for rec in recommendations:
            top_rec = None
            if rec.result and rec.result.get("recommendations"):
                first = rec.result["recommendations"][0]
                top_rec = {
                    "wine_name": first.get("wine_name", "Unknown"),
                    "match_score": first.get("match_score", 0),
                }

            items.append(
                RecommendationHistoryItem(
                    id=rec.id,
                    query=rec.query_text,
                    query_type=rec.query_type,
                    top_recommendation=top_rec,
                    total_recommendations=len(rec.result.get("recommendations", [])) if rec.result else 0,
                    created_at=rec.created_at,
                )
            )

        total_pages = (total + size - 1) // size

        return PaginatedResponse(
            data=PaginatedData(
                items=items,
                pagination=PaginationMeta(
                    total=total,
                    page=page,
                    size=size,
                    total_pages=total_pages,
                    has_next=page < total_pages,
                    has_prev=page > 1,
                ),
            )
        )
