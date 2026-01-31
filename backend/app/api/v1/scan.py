"""Scan API endpoints."""

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.common import ResponseModel
from app.schemas.scan import ScanResponse, BatchScanResponse, DuplicateCheckResponse
from app.services.scan_service import ScanService

router = APIRouter()

ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


async def validate_image(file: UploadFile) -> bytes:
    """Validate uploaded image file."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}",
        )

    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB",
        )

    return content


@router.post("", response_model=ResponseModel[ScanResponse])
async def scan_wine(
    current_user: CurrentUser,
    db: DbSession,
    image: UploadFile = File(..., description="Wine label image"),
):
    """Scan a single wine label and extract information using AI."""
    content = await validate_image(image)

    service = ScanService(db)
    result = await service.scan_single_wine(
        user_id=current_user.id,
        image_content=content,
        filename=image.filename or "scan.jpg",
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not recognize wine label. Please try again with a clearer image.",
        )

    return ResponseModel(data=result)


@router.post("/batch", response_model=ResponseModel[BatchScanResponse])
async def scan_wines_batch(
    current_user: CurrentUser,
    db: DbSession,
    image: UploadFile = File(..., description="Image with multiple wine labels"),
):
    """Scan multiple wines in a single image."""
    content = await validate_image(image)

    service = ScanService(db)
    result = await service.scan_batch_wines(
        user_id=current_user.id,
        image_content=content,
        filename=image.filename or "batch_scan.jpg",
    )

    return ResponseModel(data=result)


@router.post("/check", response_model=ResponseModel[DuplicateCheckResponse])
async def check_duplicate(
    current_user: CurrentUser,
    db: DbSession,
    image: UploadFile = File(..., description="Wine label image to check"),
):
    """Check if a wine is already in user's collection (for use at wine shops)."""
    content = await validate_image(image)

    service = ScanService(db)
    result = await service.check_duplicate(
        user_id=current_user.id,
        image_content=content,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not recognize wine label. Please try again with a clearer image.",
        )

    return ResponseModel(data=result)
