"""Tag model."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class TagType(str, enum.Enum):
    """Tag type enum."""

    CELLAR = "cellar"
    LOCATION = "location"
    CUSTOM = "custom"


class Tag(Base):
    """User tag model for organizing wines."""

    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=TagType.CUSTOM.value,
    )
    color: Mapped[str] = mapped_column(String(7), default="#6B7280")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    # Label number fields for cellar tags
    abbreviation: Mapped[str | None] = mapped_column(String(10), nullable=True)
    next_sequence: Mapped[int] = mapped_column(Integer, default=1)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="tags")
    user_wines: Mapped[list["UserWine"]] = relationship(
        "UserWine",
        secondary="user_wine_tags",
        back_populates="tags",
    )

    def __repr__(self) -> str:
        return f"<Tag {self.name}>"


class UserWineTag(Base):
    """Association table for UserWine and Tag many-to-many relationship."""

    __tablename__ = "user_wine_tags"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_wine_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_wines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tag_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return f"<UserWineTag {self.user_wine_id} - {self.tag_id}>"
