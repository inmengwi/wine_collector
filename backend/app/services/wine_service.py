"""Wine service."""

from datetime import datetime, timezone
from typing import Literal
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.wine import Wine, WineType
from app.models.user_wine import UserWine, WineStatus
from app.models.tag import Tag, UserWineTag
from app.schemas.wine import (
    UserWineCreate,
    UserWineBatchCreate,
    UserWineUpdate,
    WineStatusUpdate,
    WineQuantityUpdate,
)
from app.schemas.common import PaginatedResponse, PaginationMeta, PaginatedData


class WineService:
    """Service for wine collection management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _get_drinking_status(self, wine: Wine) -> str | None:
        """Calculate drinking status based on drinking window."""
        if not wine.drinking_window_end:
            return None

        current_year = datetime.now().year

        if wine.drinking_window_end < current_year:
            return "urgent"
        elif wine.drinking_window_end <= current_year + 1:
            return "drink_soon"
        elif wine.drinking_window_start and wine.drinking_window_start <= current_year:
            return "optimal"
        else:
            return "aging"

    async def get_user_wines(
        self,
        user_id: UUID,
        page: int = 1,
        size: int = 20,
        status: WineStatus | None = None,
        wine_type: WineType | None = None,
        country: str | None = None,
        grape: str | None = None,
        tag_id: UUID | None = None,
        drinking_window: Literal["now", "aging", "urgent"] | None = None,
        min_price: int | None = None,
        max_price: int | None = None,
        sort: str = "created_at",
        order: Literal["asc", "desc"] = "desc",
        search: str | None = None,
    ) -> PaginatedResponse:
        """Get user's wine collection with filters."""
        # Base query
        query = (
            select(UserWine)
            .options(selectinload(UserWine.wine), selectinload(UserWine.tags))
            .where(
                UserWine.user_id == user_id,
                UserWine.deleted_at.is_(None),
            )
        )

        # Apply filters
        if status:
            query = query.where(UserWine.status == status.value)
        else:
            query = query.where(UserWine.status == WineStatus.OWNED.value)

        if wine_type:
            query = query.join(Wine).where(Wine.type == wine_type.value)
        else:
            query = query.join(Wine)

        if country:
            query = query.where(Wine.country == country)

        if grape:
            query = query.where(Wine.grape_variety.contains([grape]))

        if tag_id:
            query = query.join(UserWineTag).where(UserWineTag.tag_id == tag_id)

        if min_price:
            query = query.where(UserWine.purchase_price >= min_price)

        if max_price:
            query = query.where(UserWine.purchase_price <= max_price)

        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Wine.name.ilike(search_term),
                    Wine.producer.ilike(search_term),
                    Wine.region.ilike(search_term),
                )
            )

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply sorting
        sort_column = getattr(UserWine, sort, UserWine.created_at)
        if order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Apply pagination
        offset = (page - 1) * size
        query = query.offset(offset).limit(size)

        # Execute query
        result = await self.db.execute(query)
        user_wines = result.scalars().all()

        # Build response
        items = []
        for uw in user_wines:
            item = {
                "id": uw.id,
                "quantity": uw.quantity,
                "status": uw.status,
                "purchase_date": uw.purchase_date,
                "purchase_price": uw.purchase_price,
                "label_number": uw.label_number,
                "created_at": uw.created_at,
                "wine": uw.wine,
                "tags": uw.tags,
                "drinking_status": self._get_drinking_status(uw.wine),
            }
            items.append(item)

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

    async def get_user_wine(self, user_id: UUID, user_wine_id: UUID) -> dict | None:
        """Get a specific user wine."""
        result = await self.db.execute(
            select(UserWine)
            .options(selectinload(UserWine.wine), selectinload(UserWine.tags))
            .where(
                UserWine.id == user_wine_id,
                UserWine.user_id == user_id,
                UserWine.deleted_at.is_(None),
            )
        )
        user_wine = result.scalar_one_or_none()

        if not user_wine:
            return None

        return {
            "id": user_wine.id,
            "quantity": user_wine.quantity,
            "status": user_wine.status,
            "purchase_date": user_wine.purchase_date,
            "purchase_price": user_wine.purchase_price,
            "purchase_place": user_wine.purchase_place,
            "personal_note": user_wine.personal_note,
            "personal_rating": user_wine.personal_rating,
            "original_image_url": user_wine.original_image_url,
            "label_number": user_wine.label_number,
            "created_at": user_wine.created_at,
            "updated_at": user_wine.updated_at,
            "wine": user_wine.wine,
            "tags": user_wine.tags,
            "drinking_status": self._get_drinking_status(user_wine.wine),
        }

    async def _generate_label_number(self, tag_ids: list[UUID] | None) -> tuple[str | None, Tag | None]:
        """Generate label number from first cellar tag with abbreviation."""
        if not tag_ids:
            return None, None

        # Find first cellar tag with abbreviation
        from app.models.tag import TagType
        result = await self.db.execute(
            select(Tag).where(
                Tag.id.in_(tag_ids),
                Tag.type == TagType.CELLAR.value,
                Tag.abbreviation.isnot(None),
                Tag.deleted_at.is_(None),
            ).order_by(Tag.sort_order)
        )
        cellar_tag = result.scalar()

        if not cellar_tag or not cellar_tag.abbreviation:
            return None, None

        # Generate label number: ABBR-XXX (3 digits with leading zeros)
        label_number = f"{cellar_tag.abbreviation}-{cellar_tag.next_sequence:03d}"
        return label_number, cellar_tag

    async def create_user_wine(self, user_id: UUID, data: UserWineCreate) -> dict:
        """Create a new user wine entry."""
        # Get or create wine
        if data.wine_id:
            wine_id = data.wine_id
        elif data.wine_overrides:
            # Create a new Wine record from the provided data
            wine = Wine(
                name=data.wine_overrides.name,
                producer=data.wine_overrides.producer,
                vintage=data.wine_overrides.vintage,
                grape_variety=data.wine_overrides.grape_variety,
                region=data.wine_overrides.region,
                country=data.wine_overrides.country,
                appellation=data.wine_overrides.appellation,
                abv=data.wine_overrides.abv,
                type=data.wine_overrides.type,
            )
            self.db.add(wine)
            await self.db.flush()
            wine_id = wine.id
        elif data.scan_id:
            # Scan-based creation requires wine data to be passed via wine_overrides
            raise ValueError("scan_id requires wine_overrides to be provided")
        else:
            raise ValueError("Either wine_id or wine_overrides is required")

        # Generate label number from cellar tag
        label_number, cellar_tag = await self._generate_label_number(data.tag_ids)

        # Create user wine
        user_wine = UserWine(
            user_id=user_id,
            wine_id=wine_id,
            quantity=data.quantity,
            purchase_date=data.purchase_date,
            purchase_price=data.purchase_price,
            purchase_place=data.purchase_place,
            personal_note=data.personal_note,
            label_number=label_number,
        )
        self.db.add(user_wine)
        await self.db.flush()

        # Increment tag's next_sequence if label was generated
        if cellar_tag:
            cellar_tag.next_sequence += 1

        # Add tags
        if data.tag_ids:
            for tag_id in data.tag_ids:
                tag_link = UserWineTag(user_wine_id=user_wine.id, tag_id=tag_id)
                self.db.add(tag_link)

        await self.db.commit()

        return await self.get_user_wine(user_id, user_wine.id)

    async def create_user_wines_batch(
        self, user_id: UUID, data: UserWineBatchCreate
    ) -> dict:
        """Create multiple user wine entries."""
        # TODO: Implement batch creation from scan session
        raise NotImplementedError("Batch creation not yet implemented")

    async def update_user_wine(
        self, user_id: UUID, user_wine_id: UUID, data: UserWineUpdate
    ) -> dict | None:
        """Update a user wine entry."""
        result = await self.db.execute(
            select(UserWine).where(
                UserWine.id == user_wine_id,
                UserWine.user_id == user_id,
                UserWine.deleted_at.is_(None),
            )
        )
        user_wine = result.scalar_one_or_none()

        if not user_wine:
            return None

        # Update fields
        update_dict = data.model_dump(exclude_unset=True, exclude={"tag_ids"})
        for field, value in update_dict.items():
            setattr(user_wine, field, value)

        # Update tags if provided
        if data.tag_ids is not None:
            # Remove existing tags
            await self.db.execute(
                UserWineTag.__table__.delete().where(
                    UserWineTag.user_wine_id == user_wine_id
                )
            )
            # Add new tags
            for tag_id in data.tag_ids:
                tag_link = UserWineTag(user_wine_id=user_wine_id, tag_id=tag_id)
                self.db.add(tag_link)

        await self.db.commit()

        return await self.get_user_wine(user_id, user_wine_id)

    async def update_wine_status(
        self, user_id: UUID, user_wine_id: UUID, data: WineStatusUpdate
    ) -> dict | None:
        """Update wine status (consumed/gifted)."""
        result = await self.db.execute(
            select(UserWine).where(
                UserWine.id == user_wine_id,
                UserWine.user_id == user_id,
                UserWine.deleted_at.is_(None),
            )
        )
        user_wine = result.scalar_one_or_none()

        if not user_wine:
            return None

        # Decrease quantity
        new_quantity = user_wine.quantity - data.quantity_change

        if new_quantity <= 0:
            user_wine.quantity = 0
            user_wine.status = data.status
            user_wine.consumed_at = datetime.now(timezone.utc)
        else:
            user_wine.quantity = new_quantity

        # Save rating/note for consumed
        if data.status == "consumed":
            if data.rating:
                user_wine.personal_rating = data.rating
            if data.tasting_note:
                user_wine.personal_note = data.tasting_note

        await self.db.commit()

        return {
            "id": user_wine.id,
            "quantity": user_wine.quantity,
            "status": user_wine.status,
            "consumed_count": data.quantity_change,
        }

    async def update_wine_quantity(
        self, user_id: UUID, user_wine_id: UUID, data: WineQuantityUpdate
    ) -> dict | None:
        """Update wine quantity."""
        result = await self.db.execute(
            select(UserWine).where(
                UserWine.id == user_wine_id,
                UserWine.user_id == user_id,
                UserWine.deleted_at.is_(None),
            )
        )
        user_wine = result.scalar_one_or_none()

        if not user_wine:
            return None

        previous_quantity = user_wine.quantity

        if data.action == "increase":
            user_wine.quantity += data.amount
        elif data.action == "decrease":
            user_wine.quantity = max(0, user_wine.quantity - data.amount)
        else:  # set
            user_wine.quantity = data.amount

        await self.db.commit()

        return {
            "id": user_wine.id,
            "previous_quantity": previous_quantity,
            "current_quantity": user_wine.quantity,
        }

    async def delete_user_wine(self, user_id: UUID, user_wine_id: UUID) -> bool:
        """Soft delete a user wine entry."""
        result = await self.db.execute(
            select(UserWine).where(
                UserWine.id == user_wine_id,
                UserWine.user_id == user_id,
                UserWine.deleted_at.is_(None),
            )
        )
        user_wine = result.scalar_one_or_none()

        if not user_wine:
            return False

        user_wine.deleted_at = datetime.now(timezone.utc)
        await self.db.commit()

        return True
