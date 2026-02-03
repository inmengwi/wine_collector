"""Tag service."""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tag import Tag, TagType, UserWineTag
from app.schemas.tag import TagCreate, TagUpdate, TagResponse, TagListResponse


class TagService:
    """Service for tag management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_tags(
        self, user_id: UUID, tag_type: TagType | None = None
    ) -> TagListResponse:
        """Get all tags for a user with wine counts."""
        query = select(Tag).where(
            Tag.user_id == user_id,
            Tag.deleted_at.is_(None),
        )

        if tag_type:
            query = query.where(Tag.type == tag_type.value)

        query = query.order_by(Tag.type, Tag.sort_order)

        result = await self.db.execute(query)
        tags = result.scalars().all()

        # Get wine counts for each tag
        tag_responses = []
        summary = {"cellar_count": 0, "location_count": 0, "custom_count": 0}

        for tag in tags:
            # Count wines with this tag
            count_result = await self.db.execute(
                select(func.count()).where(UserWineTag.tag_id == tag.id)
            )
            wine_count = count_result.scalar() or 0

            tag_responses.append(
                TagResponse(
                    id=tag.id,
                    name=tag.name,
                    type=TagType(tag.type),
                    color=tag.color,
                    sort_order=tag.sort_order,
                    wine_count=wine_count,
                    created_at=tag.created_at,
                )
            )

            # Update summary
            if tag.type == TagType.CELLAR.value:
                summary["cellar_count"] += 1
            elif tag.type == TagType.LOCATION.value:
                summary["location_count"] += 1
            else:
                summary["custom_count"] += 1

        return TagListResponse(tags=tag_responses, summary=summary)

    async def get_tag_by_name(self, user_id: UUID, name: str) -> Tag | None:
        """Get a tag by name."""
        result = await self.db.execute(
            select(Tag).where(
                Tag.user_id == user_id,
                Tag.name.ilike(name),
                Tag.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def create_tag(self, user_id: UUID, data: TagCreate) -> TagResponse:
        """Create a new tag."""
        # Get max sort order for this type
        result = await self.db.execute(
            select(func.max(Tag.sort_order)).where(
                Tag.user_id == user_id,
                Tag.type == data.type.value,
                Tag.deleted_at.is_(None),
            )
        )
        max_order = result.scalar() or 0

        tag = Tag(
            user_id=user_id,
            name=data.name,
            type=data.type.value,
            color=data.color,
            sort_order=max_order + 1,
        )
        self.db.add(tag)
        await self.db.commit()
        await self.db.refresh(tag)

        return TagResponse(
            id=tag.id,
            name=tag.name,
            type=TagType(tag.type),
            color=tag.color,
            sort_order=tag.sort_order,
            wine_count=0,
            created_at=tag.created_at,
        )

    async def update_tag(
        self, user_id: UUID, tag_id: UUID, data: TagUpdate
    ) -> TagResponse | None:
        """Update a tag."""
        result = await self.db.execute(
            select(Tag).where(
                Tag.id == tag_id,
                Tag.user_id == user_id,
                Tag.deleted_at.is_(None),
            )
        )
        tag = result.scalar_one_or_none()

        if not tag:
            return None

        # Update fields
        if data.name is not None:
            tag.name = data.name
        if data.color is not None:
            tag.color = data.color

        await self.db.commit()
        await self.db.refresh(tag)

        # Get wine count
        count_result = await self.db.execute(
            select(func.count()).where(UserWineTag.tag_id == tag.id)
        )
        wine_count = count_result.scalar() or 0

        return TagResponse(
            id=tag.id,
            name=tag.name,
            type=TagType(tag.type),
            color=tag.color,
            sort_order=tag.sort_order,
            wine_count=wine_count,
            created_at=tag.created_at,
        )

    async def delete_tag(self, user_id: UUID, tag_id: UUID) -> int | None:
        """Delete a tag and return number of affected wines."""
        result = await self.db.execute(
            select(Tag).where(
                Tag.id == tag_id,
                Tag.user_id == user_id,
                Tag.deleted_at.is_(None),
            )
        )
        tag = result.scalar_one_or_none()

        if not tag:
            return None

        # Count affected wines
        count_result = await self.db.execute(
            select(func.count()).where(UserWineTag.tag_id == tag_id)
        )
        affected_count = count_result.scalar() or 0

        # Soft delete tag
        tag.deleted_at = datetime.now(timezone.utc)

        # Remove tag associations (they will be orphaned otherwise)
        await self.db.execute(
            UserWineTag.__table__.delete().where(UserWineTag.tag_id == tag_id)
        )

        await self.db.commit()

        return affected_count

    async def reorder_tags(
        self, user_id: UUID, tag_type: TagType, order: list[UUID]
    ) -> None:
        """Reorder tags of a specific type."""
        for index, tag_id in enumerate(order):
            await self.db.execute(
                update(Tag)
                .where(
                    Tag.id == tag_id,
                    Tag.user_id == user_id,
                    Tag.type == tag_type.value,
                )
                .values(sort_order=index + 1)
            )

        await self.db.commit()
