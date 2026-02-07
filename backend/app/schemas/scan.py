"""Scan schemas."""

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.wine import WineBase, TasteProfile


class ScannedWineInfo(WineBase):
    """Scanned wine information from AI."""

    taste_profile: TasteProfile | None = None
    food_pairing: list[str] | None = None
    flavor_notes: list[str] | None = None
    serving_temp_min: int | None = None
    serving_temp_max: int | None = None
    drinking_window_start: int | None = None
    drinking_window_end: int | None = None
    description: str | None = None


class ScanResponse(BaseModel):
    """Single wine scan response."""

    scan_id: str
    confidence: Decimal
    wine: ScannedWineInfo
    image_url: str
    existing_wine_id: UUID | None = None
    is_duplicate: bool = False

    model_config = ConfigDict(from_attributes=True)


class ScanRefineResponse(BaseModel):
    """Refined scan response after additional images."""

    scan_id: str
    confidence: Decimal
    wine: ScannedWineInfo
    image_urls: list[str]
    existing_wine_id: UUID | None = None
    is_duplicate: bool = False

    model_config = ConfigDict(from_attributes=True)


class BoundingBox(BaseModel):
    """Bounding box for detected wine label."""

    x: int
    y: int
    width: int
    height: int


class ScanResultItem(BaseModel):
    """Individual wine scan result in batch scan."""

    index: int
    status: str  # "success" or "failed"
    confidence: Decimal | None = None
    wine: ScannedWineInfo | None = None
    bounding_box: BoundingBox | None = None
    error: str | None = None


class BatchScanResponse(BaseModel):
    """Batch wine scan response."""

    scan_session_id: str
    total_detected: int
    successfully_recognized: int
    failed: int
    wines: list[ScanResultItem]

    model_config = ConfigDict(from_attributes=True)


class EnrichRequest(BaseModel):
    """Request to enrich a batch-scanned wine with detailed info."""

    wine: ScannedWineInfo

    model_config = ConfigDict(from_attributes=True)


class EnrichResponse(BaseModel):
    """Enriched wine response with detailed tasting and pairing info."""

    wine: ScannedWineInfo

    model_config = ConfigDict(from_attributes=True)


class DuplicateCheckResponse(BaseModel):
    """Duplicate check scan response."""

    wine: ScannedWineInfo
    is_owned: bool
    owned_info: dict | None = None  # user_wine_id, quantity, location_tags, etc.
    recommendation: str | None = None
