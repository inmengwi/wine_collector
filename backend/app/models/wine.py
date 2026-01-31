"""Wine model."""

import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Integer, Numeric, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class WineType(str, enum.Enum):
    """Wine type enum."""

    RED = "red"
    WHITE = "white"
    ROSE = "rose"
    SPARKLING = "sparkling"
    DESSERT = "dessert"
    FORTIFIED = "fortified"
    OTHER = "other"


class Wine(Base):
    """Wine master data model."""

    __tablename__ = "wines"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    producer: Mapped[str | None] = mapped_column(String(300), nullable=True)
    vintage: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    grape_variety: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(200)),
        nullable=True,
    )
    region: Mapped[str | None] = mapped_column(String(200), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    appellation: Mapped[str | None] = mapped_column(String(200), nullable=True)
    abv: Mapped[Decimal | None] = mapped_column(Numeric(4, 2), nullable=True)
    type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=WineType.RED.value,
        index=True,
    )

    # Taste profile (1-5 scale)
    body: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    tannin: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    acidity: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    sweetness: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)

    # AI-enhanced information
    food_pairing: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    flavor_notes: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    serving_temp_min: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    serving_temp_max: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    drinking_window_start: Mapped[int | None] = mapped_column(Integer, nullable=True)
    drinking_window_end: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Metadata
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ai_confidence: Mapped[Decimal | None] = mapped_column(Numeric(3, 2), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    user_wines: Mapped[list["UserWine"]] = relationship(
        "UserWine",
        back_populates="wine",
    )

    def __repr__(self) -> str:
        return f"<Wine {self.name} {self.vintage}>"
