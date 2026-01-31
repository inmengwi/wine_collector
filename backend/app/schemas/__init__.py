"""Pydantic schemas."""

from app.schemas.common import ResponseModel, PaginatedResponse, PaginationMeta
from app.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest,
)
from app.schemas.wine import (
    WineBase,
    WineResponse,
    TasteProfile,
    UserWineCreate,
    UserWineUpdate,
    UserWineResponse,
    UserWineListResponse,
    WineStatusUpdate,
    WineQuantityUpdate,
)
from app.schemas.tag import (
    TagCreate,
    TagUpdate,
    TagResponse,
    TagReorder,
)
from app.schemas.scan import (
    ScanResponse,
    BatchScanResponse,
    ScanResultItem,
)
from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendationItem,
)

__all__ = [
    # Common
    "ResponseModel",
    "PaginatedResponse",
    "PaginationMeta",
    # Auth
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "TokenResponse",
    "RefreshTokenRequest",
    # Wine
    "WineBase",
    "WineResponse",
    "TasteProfile",
    "UserWineCreate",
    "UserWineUpdate",
    "UserWineResponse",
    "UserWineListResponse",
    "WineStatusUpdate",
    "WineQuantityUpdate",
    # Tag
    "TagCreate",
    "TagUpdate",
    "TagResponse",
    "TagReorder",
    # Scan
    "ScanResponse",
    "BatchScanResponse",
    "ScanResultItem",
    # Recommendation
    "RecommendationRequest",
    "RecommendationResponse",
    "RecommendationItem",
]
