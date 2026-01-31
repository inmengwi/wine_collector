"""Dashboard service."""

from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.wine import Wine
from app.models.user_wine import UserWine
from app.models.tag import Tag, UserWineTag


class DashboardService:
    """Service for dashboard statistics and summaries."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_cellar_summary(self, user_id: UUID) -> dict:
        """Get cellar summary statistics."""
        # Get owned wines
        owned_query = select(UserWine).options(selectinload(UserWine.wine)).where(
            UserWine.user_id == user_id,
            UserWine.deleted_at.is_(None),
            UserWine.status == "owned",
        )
        result = await self.db.execute(owned_query)
        user_wines = result.scalars().all()

        # Calculate totals
        total_wines = len(user_wines)
        total_bottles = sum(uw.quantity for uw in user_wines)
        total_value = sum(
            float(uw.purchase_price or 0) * uw.quantity
            for uw in user_wines
        )

        # By type
        by_type = {
            "red": {"count": 0, "bottles": 0},
            "white": {"count": 0, "bottles": 0},
            "rose": {"count": 0, "bottles": 0},
            "sparkling": {"count": 0, "bottles": 0},
            "other": {"count": 0, "bottles": 0},
        }

        for uw in user_wines:
            wine_type = uw.wine.type if uw.wine.type in by_type else "other"
            by_type[wine_type]["count"] += 1
            by_type[wine_type]["bottles"] += uw.quantity

        # By country (top 5)
        country_counts = {}
        for uw in user_wines:
            country = uw.wine.country or "Unknown"
            country_counts[country] = country_counts.get(country, 0) + 1

        sorted_countries = sorted(
            country_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )
        by_country = [
            {"country": c, "count": n}
            for c, n in sorted_countries[:5]
        ]
        if len(sorted_countries) > 5:
            others_count = sum(n for _, n in sorted_countries[5:])
            by_country.append({"country": "Others", "count": others_count})

        # By cellar (tags)
        cellar_tags = await self.db.execute(
            select(Tag).where(
                Tag.user_id == user_id,
                Tag.type == "cellar",
                Tag.deleted_at.is_(None),
            )
        )
        cellars = cellar_tags.scalars().all()

        by_cellar = []
        for cellar in cellars:
            count_result = await self.db.execute(
                select(func.count()).where(UserWineTag.tag_id == cellar.id)
            )
            count = count_result.scalar() or 0
            by_cellar.append({
                "tag_id": str(cellar.id),
                "name": cellar.name,
                "count": count,
            })

        # Recent additions (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_result = await self.db.execute(
            select(func.count()).where(
                UserWine.user_id == user_id,
                UserWine.deleted_at.is_(None),
                UserWine.created_at >= thirty_days_ago,
            )
        )
        recent_additions = recent_result.scalar() or 0

        # Consumed this month
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
        consumed_result = await self.db.execute(
            select(func.count()).where(
                UserWine.user_id == user_id,
                UserWine.status == "consumed",
                UserWine.consumed_at >= month_start,
            )
        )
        consumed_this_month = consumed_result.scalar() or 0

        return {
            "total_wines": total_wines,
            "total_bottles": total_bottles,
            "total_value": total_value,
            "by_type": by_type,
            "by_country": by_country,
            "by_cellar": by_cellar,
            "recent_additions": recent_additions,
            "consumed_this_month": consumed_this_month,
        }

    async def get_expiring_wines(
        self,
        user_id: UUID,
        years: int = 2,
        limit: int = 10,
    ) -> dict:
        """Get wines approaching their drinking window end."""
        current_year = datetime.now().year

        # Get owned wines with drinking window
        result = await self.db.execute(
            select(UserWine)
            .options(selectinload(UserWine.wine))
            .join(Wine)
            .where(
                UserWine.user_id == user_id,
                UserWine.deleted_at.is_(None),
                UserWine.status == "owned",
                Wine.drinking_window_end.isnot(None),
            )
            .order_by(Wine.drinking_window_end.asc())
        )
        user_wines = result.scalars().all()

        urgent = []
        soon = []
        optimal = []

        for uw in user_wines:
            wine = uw.wine
            years_left = wine.drinking_window_end - current_year

            item = {
                "user_wine_id": str(uw.id),
                "wine": {
                    "name": wine.name,
                    "vintage": wine.vintage,
                },
                "drinking_window_end": wine.drinking_window_end,
                "years_left": years_left,
            }

            if years_left < 0:
                item["message"] = "음용 적기가 지났습니다. 빨리 드세요!"
                urgent.append(item)
            elif years_left == 0:
                item["message"] = "올해 안에 드시는 것이 좋습니다!"
                urgent.append(item)
            elif years_left <= 1:
                item["message"] = "1년 내 음용을 권장합니다."
                soon.append(item)
            elif (
                wine.drinking_window_start
                and wine.drinking_window_start <= current_year
            ):
                item["message"] = "지금 마시기 최적입니다."
                optimal.append(item)

        # Apply limit
        return {
            "urgent": urgent[:limit],
            "soon": soon[:limit],
            "optimal": optimal[:limit],
        }
