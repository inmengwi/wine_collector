"""Common schema definitions."""

from datetime import datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ResponseModel(BaseModel, Generic[T]):
    """Standard API response model."""

    success: bool = True
    data: T | None = None
    message: str | None = None
    timestamp: datetime = datetime.utcnow()

    model_config = ConfigDict(from_attributes=True)


class ErrorDetail(BaseModel):
    """Error detail model."""

    code: str
    details: dict[str, Any] | None = None


class ErrorResponse(BaseModel):
    """Error response model."""

    success: bool = False
    data: None = None
    message: str
    error: ErrorDetail
    timestamp: datetime = datetime.utcnow()


class PaginationMeta(BaseModel):
    """Pagination metadata."""

    total: int
    page: int
    size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedData(BaseModel, Generic[T]):
    """Paginated data container."""

    items: list[T]
    pagination: PaginationMeta


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response model."""

    success: bool = True
    data: PaginatedData[T]
    message: str | None = None
    timestamp: datetime = datetime.utcnow()
