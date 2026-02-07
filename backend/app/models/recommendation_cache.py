"""Recommendation cache model for reducing AI API costs."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class RecommendationCache(Base):
    """Cache for AI recommendation results.

    Stores AI responses keyed by a hash of:
    - user_id, query_type, normalized query_text
    - wine collection snapshot (sorted wine IDs + quantities)
    - wine type filter preferences

    This avoids redundant AI API calls when the same or similar
    recommendation is requested while the user's collection hasn't changed.
    """

    __tablename__ = "recommendation_cache"

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

    # Cache key components (stored for debugging/inspection)
    cache_key: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True, index=True,
    )
    query_type: Mapped[str] = mapped_column(String(20), nullable=False)
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    wine_collection_hash: Mapped[str] = mapped_column(
        String(64), nullable=False,
    )

    # Cached AI response
    ai_result: Mapped[dict] = mapped_column(JSONB, nullable=False)
    ai_model: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Stats
    hit_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_hit_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # Relationships
    user: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return f"<RecommendationCache {self.id} key={self.cache_key[:12]}...>"
