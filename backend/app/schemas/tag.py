"""Tag schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.tag import TagType


class TagCreate(BaseModel):
    """Tag creation request."""

    name: str = Field(..., min_length=1, max_length=50)
    type: TagType = TagType.CUSTOM
    color: str = Field(default="#6B7280", pattern=r"^#[0-9A-Fa-f]{6}$")


class TagUpdate(BaseModel):
    """Tag update request."""

    name: str | None = Field(None, min_length=1, max_length=50)
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class TagResponse(BaseModel):
    """Tag response model."""

    id: UUID
    name: str
    type: TagType
    color: str
    sort_order: int
    wine_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TagReorder(BaseModel):
    """Tag reorder request."""

    type: TagType
    order: list[UUID]


class TagListResponse(BaseModel):
    """Tag list response with summary."""

    tags: list[TagResponse]
    summary: dict[str, int]  # cellar_count, location_count, custom_count
