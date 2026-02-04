"""Tags API endpoints."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import CurrentUser, DbSession
from app.models.tag import TagType
from app.schemas.common import ResponseModel
from app.schemas.tag import TagCreate, TagUpdate, TagResponse, TagReorder, TagListResponse
from app.services.tag_service import TagService

router = APIRouter()


@router.get("", response_model=ResponseModel[TagListResponse])
async def list_tags(
    current_user: CurrentUser,
    db: DbSession,
    type: TagType | None = None,
):
    """Get all user's tags."""
    service = TagService(db)
    result = await service.get_user_tags(current_user.id, tag_type=type)
    return ResponseModel(data=result)


@router.post("", response_model=ResponseModel[TagResponse], status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_data: TagCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Create a new tag."""
    service = TagService(db)

    # Check for duplicate name
    existing = await service.get_tag_by_name(current_user.id, tag_data.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tag with this name already exists",
        )

    tag = await service.create_tag(current_user.id, tag_data)
    return ResponseModel(
        data=tag,
        message="Tag created successfully",
    )


@router.patch("/{tag_id}", response_model=ResponseModel[TagResponse])
async def update_tag(
    tag_id: UUID,
    update_data: TagUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Update a tag."""
    service = TagService(db)
    tag = await service.update_tag(current_user.id, tag_id, update_data)

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    return ResponseModel(
        data=tag,
        message="Tag updated successfully",
    )


@router.delete("/{tag_id}", response_model=ResponseModel[dict])
async def delete_tag(
    tag_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    """Delete a tag."""
    service = TagService(db)
    result = await service.delete_tag(current_user.id, tag_id)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    return ResponseModel(
        data={"affected_wines": result},
        message=f"태그가 삭제되었습니다. {result}개 와인에서 태그 정보는 유지됩니다.",
    )


@router.put("/reorder", response_model=ResponseModel[None])
async def reorder_tags(
    reorder_data: TagReorder,
    current_user: CurrentUser,
    db: DbSession,
):
    """Reorder tags of a specific type."""
    service = TagService(db)
    await service.reorder_tags(current_user.id, reorder_data.type, reorder_data.order)
    return ResponseModel(message="Tags reordered successfully")
