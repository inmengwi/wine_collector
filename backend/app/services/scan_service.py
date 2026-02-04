"""Scan service for wine label recognition."""

import uuid
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.wine import Wine
from app.models.user_wine import UserWine
from app.models.scan_session import ScanSession
from app.schemas.scan import (
    ScanResponse,
    BatchScanResponse,
    DuplicateCheckResponse,
    ScannedWineInfo,
    ScanResultItem,
    ScanRefineResponse,
    TasteProfile,
)
from app.services.ai_service import AIService
from app.services.storage_service import StorageService


class ScanService:
    """Service for wine label scanning and recognition."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.ai_service = AIService()
        self.storage_service = StorageService()

    async def scan_single_wine(
        self,
        user_id: UUID,
        image_content: bytes,
        filename: str,
    ) -> ScanResponse | None:
        """Scan a single wine label and extract information."""
        # Generate scan ID
        scan_id = f"scan_{uuid.uuid4().hex[:12]}"

        # Upload image to storage
        image_url = await self.storage_service.upload_scan_image(
            image_content, scan_id, filename
        )

        # Analyze with AI
        wine_info = await self.ai_service.analyze_wine_label(image_content)

        if not wine_info:
            return None

        # Check for existing wine in database
        existing_wine = await self._find_existing_wine(wine_info)
        is_duplicate = False
        existing_wine_id = None

        if existing_wine:
            existing_wine_id = existing_wine.id
            # Check if user already has this wine
            user_wine = await self._find_user_wine(user_id, existing_wine.id)
            is_duplicate = user_wine is not None

        confidence = self._get_confidence(wine_info)
        await self._store_scan_session(
            user_id=user_id,
            scan_id=scan_id,
            image_urls=[image_url],
            wine_data=wine_info,
            confidence=confidence,
            existing_wine_id=existing_wine_id,
            is_duplicate=is_duplicate,
        )

        return ScanResponse(
            scan_id=scan_id,
            confidence=confidence,
            wine=ScannedWineInfo(
                name=wine_info["name"],
                producer=wine_info.get("producer"),
                vintage=wine_info.get("vintage"),
                grape_variety=wine_info.get("grape_variety"),
                region=wine_info.get("region"),
                country=wine_info.get("country"),
                appellation=wine_info.get("appellation"),
                abv=wine_info.get("abv"),
                type=wine_info.get("type", "red"),
                taste_profile=TasteProfile(
                    body=wine_info.get("body"),
                    tannin=wine_info.get("tannin"),
                    acidity=wine_info.get("acidity"),
                    sweetness=wine_info.get("sweetness"),
                ) if any([wine_info.get("body"), wine_info.get("tannin")]) else None,
                food_pairing=wine_info.get("food_pairing"),
                flavor_notes=wine_info.get("flavor_notes"),
                serving_temp_min=wine_info.get("serving_temp_min"),
                serving_temp_max=wine_info.get("serving_temp_max"),
                drinking_window_start=wine_info.get("drinking_window_start"),
                drinking_window_end=wine_info.get("drinking_window_end"),
                description=wine_info.get("description"),
            ),
            image_url=image_url,
            existing_wine_id=existing_wine_id,
            is_duplicate=is_duplicate,
        )

    async def scan_batch_wines(
        self,
        user_id: UUID,
        image_content: bytes,
        filename: str,
    ) -> BatchScanResponse:
        """Scan multiple wines in a single image."""
        # Generate session ID
        session_id = f"session_{uuid.uuid4().hex[:12]}"

        # Upload image
        await self.storage_service.upload_scan_image(
            image_content, session_id, filename
        )

        # Analyze with AI (batch mode)
        wines_info = await self.ai_service.analyze_batch_wine_labels(image_content)

        results = []
        success_count = 0
        failed_count = 0

        for idx, wine_info in enumerate(wines_info):
            if wine_info.get("status") == "success":
                success_count += 1
                results.append(
                    ScanResultItem(
                        index=idx,
                        status="success",
                        confidence=wine_info.get("confidence", Decimal("0.8")),
                        wine=ScannedWineInfo(
                            name=wine_info["name"],
                            producer=wine_info.get("producer"),
                            vintage=wine_info.get("vintage"),
                            grape_variety=wine_info.get("grape_variety"),
                            region=wine_info.get("region"),
                            country=wine_info.get("country"),
                            type=wine_info.get("type", "red"),
                        ),
                        bounding_box=wine_info.get("bounding_box"),
                    )
                )
            else:
                failed_count += 1
                results.append(
                    ScanResultItem(
                        index=idx,
                        status="failed",
                        error=wine_info.get("error", "Could not recognize wine label"),
                        bounding_box=wine_info.get("bounding_box"),
                    )
                )

        return BatchScanResponse(
            scan_session_id=session_id,
            total_detected=len(wines_info),
            successfully_recognized=success_count,
            failed=failed_count,
            wines=results,
        )

    async def check_duplicate(
        self,
        user_id: UUID,
        image_content: bytes,
    ) -> DuplicateCheckResponse | None:
        """Check if a wine is already in user's collection."""
        # Analyze with AI
        wine_info = await self.ai_service.analyze_wine_label(image_content)

        if not wine_info:
            return None

        # Find existing wine
        existing_wine = await self._find_existing_wine(wine_info)

        is_owned = False
        owned_info = None
        recommendation = None

        if existing_wine:
            user_wine = await self._find_user_wine(user_id, existing_wine.id)

            if user_wine:
                is_owned = True
                owned_info = {
                    "user_wine_id": str(user_wine.id),
                    "quantity": user_wine.quantity,
                    "location_tags": [tag.name for tag in user_wine.tags],
                    "purchase_price": float(user_wine.purchase_price) if user_wine.purchase_price else None,
                    "purchase_date": user_wine.purchase_date.isoformat() if user_wine.purchase_date else None,
                }
                recommendation = f"이미 {user_wine.quantity}병 보유 중입니다. 추가 구매 시 총 {user_wine.quantity + 1}병이 됩니다."

        return DuplicateCheckResponse(
            wine=ScannedWineInfo(
                name=wine_info["name"],
                producer=wine_info.get("producer"),
                vintage=wine_info.get("vintage"),
                type=wine_info.get("type", "red"),
            ),
            is_owned=is_owned,
            owned_info=owned_info,
            recommendation=recommendation,
        )

    async def refine_scan(
        self,
        user_id: UUID,
        scan_id: str,
        image_content: bytes,
        filename: str,
    ) -> ScanRefineResponse | None:
        """Refine a scan with an additional image."""
        scan_session = await self._get_scan_session(user_id, scan_id)
        if not scan_session:
            return None

        refine_id = f"{scan_id}_refine_{uuid.uuid4().hex[:8]}"
        image_url = await self.storage_service.upload_scan_image(
            image_content, refine_id, filename
        )

        wine_info = await self.ai_service.analyze_wine_label(image_content)
        if not wine_info:
            return None

        merged_wine_info = self._merge_wine_info(scan_session.wine_data, wine_info)
        confidence = self._merge_confidence(
            scan_session.confidence,
            self._get_confidence(wine_info),
        )

        existing_wine = await self._find_existing_wine(merged_wine_info)
        is_duplicate = False
        existing_wine_id = None

        if existing_wine:
            existing_wine_id = existing_wine.id
            user_wine = await self._find_user_wine(user_id, existing_wine.id)
            is_duplicate = user_wine is not None

        image_urls = list(scan_session.image_urls or [])
        image_urls.append(image_url)

        scan_session.image_urls = image_urls
        scan_session.wine_data = merged_wine_info
        scan_session.confidence = confidence
        scan_session.existing_wine_id = existing_wine_id
        scan_session.is_duplicate = is_duplicate

        return ScanRefineResponse(
            scan_id=scan_id,
            confidence=confidence,
            wine=ScannedWineInfo(
                name=merged_wine_info["name"],
                producer=merged_wine_info.get("producer"),
                vintage=merged_wine_info.get("vintage"),
                grape_variety=merged_wine_info.get("grape_variety"),
                region=merged_wine_info.get("region"),
                country=merged_wine_info.get("country"),
                appellation=merged_wine_info.get("appellation"),
                abv=merged_wine_info.get("abv"),
                type=merged_wine_info.get("type", "red"),
                taste_profile=TasteProfile(
                    body=merged_wine_info.get("body"),
                    tannin=merged_wine_info.get("tannin"),
                    acidity=merged_wine_info.get("acidity"),
                    sweetness=merged_wine_info.get("sweetness"),
                ) if any([merged_wine_info.get("body"), merged_wine_info.get("tannin")]) else None,
                food_pairing=merged_wine_info.get("food_pairing"),
                flavor_notes=merged_wine_info.get("flavor_notes"),
                serving_temp_min=merged_wine_info.get("serving_temp_min"),
                serving_temp_max=merged_wine_info.get("serving_temp_max"),
                drinking_window_start=merged_wine_info.get("drinking_window_start"),
                drinking_window_end=merged_wine_info.get("drinking_window_end"),
                description=merged_wine_info.get("description"),
            ),
            image_urls=image_urls,
            existing_wine_id=existing_wine_id,
            is_duplicate=is_duplicate,
        )

    async def _find_existing_wine(self, wine_info: dict) -> Wine | None:
        """Find an existing wine matching the scanned info."""
        if not wine_info.get("name"):
            return None
        result = await self.db.execute(
            select(Wine).where(
                Wine.name.ilike(f"%{wine_info['name']}%"),
                Wine.vintage == wine_info.get("vintage"),
            ).limit(1)
        )
        return result.scalars().first()

    async def _find_user_wine(self, user_id: UUID, wine_id: UUID) -> UserWine | None:
        """Find user's wine entry."""
        result = await self.db.execute(
            select(UserWine).where(
                UserWine.user_id == user_id,
                UserWine.wine_id == wine_id,
                UserWine.deleted_at.is_(None),
                UserWine.status == "owned",
            )
        )
        return result.scalar_one_or_none()

    async def _store_scan_session(
        self,
        user_id: UUID,
        scan_id: str,
        image_urls: list[str],
        wine_data: dict,
        confidence: Decimal,
        existing_wine_id: UUID | None,
        is_duplicate: bool,
    ) -> None:
        scan_session = ScanSession(
            user_id=user_id,
            scan_id=scan_id,
            image_urls=image_urls,
            wine_data=wine_data,
            confidence=confidence,
            existing_wine_id=existing_wine_id,
            is_duplicate=is_duplicate,
        )
        self.db.add(scan_session)
        await self.db.flush()

    async def _get_scan_session(self, user_id: UUID, scan_id: str) -> ScanSession | None:
        result = await self.db.execute(
            select(ScanSession).where(
                ScanSession.user_id == user_id,
                ScanSession.scan_id == scan_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    def _merge_wine_info(existing: dict, new: dict) -> dict:
        merged = dict(existing or {})
        for key, value in (new or {}).items():
            if value is None:
                continue
            if isinstance(value, list) and len(value) == 0:
                continue
            if isinstance(value, str) and value.strip() == "":
                continue
            merged[key] = value
        return merged

    @staticmethod
    def _get_confidence(wine_info: dict) -> Decimal:
        confidence = wine_info.get("confidence", Decimal("0.8"))
        if isinstance(confidence, Decimal):
            return confidence
        return Decimal(str(confidence))

    @staticmethod
    def _merge_confidence(existing: Decimal | None, incoming: Decimal) -> Decimal:
        if existing is None:
            return incoming
        return max(existing, incoming)
