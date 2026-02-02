"""User Wine model - user's wine collection."""

import enum
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class WineStatus(str, enum.Enum):
    """Wine status enum."""

    OWNED = "owned"
    CONSUMED = "consumed"
    GIFTED = "gifted"


class UserWine(Base):
    """User's wine collection model."""

    __tablename__ = "user_wines"

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
    wine_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("wines.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Ownership info
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=WineStatus.OWNED.value,
        index=True,
    )

    # Purchase info (optional)
    purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    purchase_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    purchase_place: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Personal notes
    personal_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    personal_rating: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)

    # Original scan image
    original_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Label number for easy identification (e.g., "WC-001")
    label_number: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    consumed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_wines")
    wine: Mapped["Wine"] = relationship("Wine", back_populates="user_wines")
    tags: Mapped[list["Tag"]] = relationship(
        "Tag",
        secondary="user_wine_tags",
        back_populates="user_wines",
    )

    def __repr__(self) -> str:
        return f"<UserWine {self.id} - {self.wine_id}>"
