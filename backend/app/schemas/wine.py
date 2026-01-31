"""Wine schemas."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.wine import WineType
from app.models.user_wine import WineStatus


class TasteProfile(BaseModel):
    """Wine taste profile."""

    body: int | None = Field(None, ge=1, le=5)
    tannin: int | None = Field(None, ge=1, le=5)
    acidity: int | None = Field(None, ge=1, le=5)
    sweetness: int | None = Field(None, ge=1, le=5)


class WineBase(BaseModel):
    """Base wine information."""

    name: str
    producer: str | None = None
    vintage: int | None = None
    grape_variety: list[str] | None = None
    region: str | None = None
    country: str | None = None
    appellation: str | None = None
    abv: Decimal | None = None
    type: WineType = WineType.RED


class WineResponse(WineBase):
    """Wine response model."""

    id: UUID
    taste_profile: TasteProfile | None = None
    food_pairing: list[str] | None = None
    flavor_notes: list[str] | None = None
    serving_temp_min: int | None = None
    serving_temp_max: int | None = None
    drinking_window_start: int | None = None
    drinking_window_end: int | None = None
    description: str | None = None
    image_url: str | None = None
    ai_confidence: Decimal | None = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_profile(cls, wine):
        """Create response from ORM model with taste profile."""
        data = {
            "id": wine.id,
            "name": wine.name,
            "producer": wine.producer,
            "vintage": wine.vintage,
            "grape_variety": wine.grape_variety,
            "region": wine.region,
            "country": wine.country,
            "appellation": wine.appellation,
            "abv": wine.abv,
            "type": wine.type,
            "taste_profile": TasteProfile(
                body=wine.body,
                tannin=wine.tannin,
                acidity=wine.acidity,
                sweetness=wine.sweetness,
            ) if any([wine.body, wine.tannin, wine.acidity, wine.sweetness]) else None,
            "food_pairing": wine.food_pairing,
            "flavor_notes": wine.flavor_notes,
            "serving_temp_min": wine.serving_temp_min,
            "serving_temp_max": wine.serving_temp_max,
            "drinking_window_start": wine.drinking_window_start,
            "drinking_window_end": wine.drinking_window_end,
            "description": wine.description,
            "image_url": wine.image_url,
            "ai_confidence": wine.ai_confidence,
        }
        return cls(**data)


class TagInWine(BaseModel):
    """Tag info for wine response."""

    id: UUID
    name: str
    type: str
    color: str

    model_config = ConfigDict(from_attributes=True)


class UserWineCreate(BaseModel):
    """User wine creation request."""

    scan_id: str | None = None
    wine_id: UUID | None = None
    wine_overrides: WineBase | None = None
    quantity: int = Field(default=1, ge=1)
    purchase_date: date | None = None
    purchase_price: Decimal | None = Field(None, ge=0)
    purchase_place: str | None = None
    personal_note: str | None = None
    tag_ids: list[UUID] | None = None


class UserWineBatchCreate(BaseModel):
    """Batch user wine creation request."""

    scan_session_id: str
    wines: list[dict]  # List of wine creation data
    common_tags: list[UUID] | None = None
    common_purchase_date: date | None = None


class UserWineUpdate(BaseModel):
    """User wine update request."""

    quantity: int | None = Field(None, ge=0)
    purchase_date: date | None = None
    purchase_price: Decimal | None = Field(None, ge=0)
    purchase_place: str | None = None
    personal_note: str | None = None
    tag_ids: list[UUID] | None = None


class WineStatusUpdate(BaseModel):
    """Wine status update request."""

    status: Literal["consumed", "gifted"]
    quantity_change: int = Field(default=1, ge=1)
    consumed_date: date | None = None
    rating: int | None = Field(None, ge=1, le=5)
    tasting_note: str | None = None
    recipient: str | None = None  # For gifted


class WineQuantityUpdate(BaseModel):
    """Wine quantity update request."""

    action: Literal["increase", "decrease", "set"]
    amount: int = Field(..., ge=0)


class UserWineResponse(BaseModel):
    """User wine response model."""

    id: UUID
    quantity: int
    status: WineStatus
    purchase_date: date | None = None
    purchase_price: Decimal | None = None
    purchase_place: str | None = None
    personal_note: str | None = None
    personal_rating: int | None = None
    original_image_url: str | None = None
    created_at: datetime
    updated_at: datetime
    wine: WineResponse
    tags: list[TagInWine] = []
    drinking_status: str | None = None  # "aging", "optimal", "drink_soon", "urgent"

    model_config = ConfigDict(from_attributes=True)


class UserWineListResponse(BaseModel):
    """User wine list item (lighter response)."""

    id: UUID
    quantity: int
    status: WineStatus
    purchase_date: date | None = None
    purchase_price: Decimal | None = None
    created_at: datetime
    wine: WineResponse
    tags: list[TagInWine] = []
    drinking_status: str | None = None

    model_config = ConfigDict(from_attributes=True)


class WineFilterParams(BaseModel):
    """Wine filter parameters."""

    status: WineStatus | None = None
    type: WineType | None = None
    country: str | None = None
    grape: str | None = None
    tag_id: UUID | None = None
    drinking_window: Literal["now", "aging", "urgent"] | None = None
    min_price: int | None = None
    max_price: int | None = None
    search: str | None = None
