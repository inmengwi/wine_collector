"""Recommendation model."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Recommendation(Base):
    """AI recommendation history model."""

    __tablename__ = "recommendations"

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

    # Request info
    query_type: Mapped[str] = mapped_column(String(20), nullable=False, default="food")
    query_text: Mapped[str] = mapped_column(Text, nullable=False)

    # Result info (JSON)
    result: Mapped[dict] = mapped_column(JSONB, nullable=False)
    recommended_wine_ids: Mapped[list[uuid.UUID] | None] = mapped_column(
        ARRAY(UUID(as_uuid=True)),
        nullable=True,
    )

    # AI metadata
    ai_model: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ai_tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="recommendations")

    def __repr__(self) -> str:
        return f"<Recommendation {self.id}>"
