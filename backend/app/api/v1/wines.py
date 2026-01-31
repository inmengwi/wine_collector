"""Wines API endpoints."""

from typing import Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import CurrentUser, DbSession
from app.models.wine import WineType
from app.models.user_wine import WineStatus
from app.schemas.common import ResponseModel, PaginatedResponse
from app.schemas.wine import (
    UserWineCreate,
    UserWineBatchCreate,
    UserWineUpdate,
    UserWineResponse,
    UserWineListResponse,
    WineStatusUpdate,
    WineQuantityUpdate,
)
from app.services.wine_service import WineService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[UserWineListResponse])
async def list_wines(
    current_user: CurrentUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: WineStatus | None = None,
    type: WineType | None = None,
    country: str | None = None,
    grape: str | None = None,
    tag_id: UUID | None = None,
    drinking_window: Literal["now", "aging", "urgent"] | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    sort: str = "created_at",
    order: Literal["asc", "desc"] = "desc",
    search: str | None = None,
):
    """Get user's wine collection with filters and pagination."""
    service = WineService(db)
    result = await service.get_user_wines(
        user_id=current_user.id,
        page=page,
        size=size,
        status=status,
        wine_type=type,
        country=country,
        grape=grape,
        tag_id=tag_id,
        drinking_window=drinking_window,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
        order=order,
        search=search,
    )
    return result


@router.post("", response_model=ResponseModel[UserWineResponse], status_code=status.HTTP_201_CREATED)
async def create_wine(
    wine_data: UserWineCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Add a wine to user's collection."""
    service = WineService(db)
    user_wine = await service.create_user_wine(current_user.id, wine_data)
    return ResponseModel(
        data=user_wine,
        message="Wine added to your collection",
    )


@router.post("/batch", response_model=ResponseModel[dict], status_code=status.HTTP_201_CREATED)
async def create_wines_batch(
    batch_data: UserWineBatchCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Add multiple wines to user's collection."""
    service = WineService(db)
    result = await service.create_user_wines_batch(current_user.id, batch_data)
    return ResponseModel(
        data=result,
        message=f"{result['total_bottles']} bottles added to your collection",
    )


@router.get("/{user_wine_id}", response_model=ResponseModel[UserWineResponse])
async def get_wine(
    user_wine_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    """Get a specific wine from user's collection."""
    service = WineService(db)
    user_wine = await service.get_user_wine(current_user.id, user_wine_id)

    if not user_wine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wine not found",
        )

    return ResponseModel(data=user_wine)


@router.patch("/{user_wine_id}", response_model=ResponseModel[UserWineResponse])
async def update_wine(
    user_wine_id: UUID,
    update_data: UserWineUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Update a wine in user's collection."""
    service = WineService(db)
    user_wine = await service.update_user_wine(current_user.id, user_wine_id, update_data)

    if not user_wine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wine not found",
        )

    return ResponseModel(
        data=user_wine,
        message="Wine updated successfully",
    )


@router.patch("/{user_wine_id}/status", response_model=ResponseModel[dict])
async def update_wine_status(
    user_wine_id: UUID,
    status_data: WineStatusUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Update wine status (consumed/gifted)."""
    service = WineService(db)
    result = await service.update_wine_status(current_user.id, user_wine_id, status_data)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wine not found",
        )

    return ResponseModel(
        data=result,
        message=f"Wine marked as {status_data.status}",
    )


@router.patch("/{user_wine_id}/quantity", response_model=ResponseModel[dict])
async def update_wine_quantity(
    user_wine_id: UUID,
    quantity_data: WineQuantityUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Update wine quantity."""
    service = WineService(db)
    result = await service.update_wine_quantity(current_user.id, user_wine_id, quantity_data)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wine not found",
        )

    return ResponseModel(
        data=result,
        message=f"Quantity updated to {result['current_quantity']}",
    )


@router.delete("/{user_wine_id}", response_model=ResponseModel[None])
async def delete_wine(
    user_wine_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    """Delete a wine from user's collection."""
    service = WineService(db)
    deleted = await service.delete_user_wine(current_user.id, user_wine_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wine not found",
        )

    return ResponseModel(message="Wine deleted successfully")
