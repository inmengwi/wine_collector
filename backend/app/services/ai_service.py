"""AI service for wine label recognition and recommendations."""

import json
import logging
from decimal import Decimal

from app.config import settings
from app.services.ai.providers import (
    AnthropicTextProvider,
    AnthropicVisionProvider,
    GeminiTextProvider,
    GeminiVisionProvider,
    TextProvider,
    VisionProvider,
)
from app.services.ai.scan_prompts import get_scan_prompt_config, resolve_model_tier


class AIService:
    """Service for AI-powered wine analysis and recommendations.

    Supports separate AI providers/models for scanning (vision) and
    recommendation (text) tasks, allowing cost/accuracy optimization
    per use case.
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.scan_provider = self._create_vision_provider(
            settings.effective_scan_provider,
            settings.effective_scan_model,
        )
        self.recommendation_provider = self._create_text_provider(
            settings.effective_recommendation_provider,
            settings.effective_recommendation_model,
        )
        self.scan_prompt_config = get_scan_prompt_config(settings.effective_scan_model)
        scan_tier = resolve_model_tier(settings.effective_scan_model)
        self.logger.info(
            "AI service initialized: scan=%s/%s (tier=%s), recommendation=%s/%s",
            settings.effective_scan_provider,
            settings.effective_scan_model,
            scan_tier.value,
            settings.effective_recommendation_provider,
            settings.effective_recommendation_model,
        )

    def _create_vision_provider(self, provider_name: str, model: str) -> VisionProvider | None:
        provider_name = provider_name.lower()
        if provider_name == "gemini":
            if not settings.gemini_api_key:
                return None
            return GeminiVisionProvider(api_key=settings.gemini_api_key, model=model)
        if provider_name == "anthropic":
            if not settings.anthropic_api_key:
                return None
            return AnthropicVisionProvider(api_key=settings.anthropic_api_key, model=model)
        self.logger.warning("Unknown vision provider '%s'", provider_name)
        return None

    def _create_text_provider(self, provider_name: str, model: str) -> TextProvider | None:
        provider_name = provider_name.lower()
        if provider_name == "gemini":
            if not settings.gemini_api_key:
                return None
            return GeminiTextProvider(api_key=settings.gemini_api_key, model=model)
        if provider_name == "anthropic":
            if not settings.anthropic_api_key:
                return None
            return AnthropicTextProvider(api_key=settings.anthropic_api_key, model=model)
        self.logger.warning("Unknown text provider '%s'", provider_name)
        return None

    def _parse_json_object(self, response_text: str) -> dict | None:
        json_start = response_text.find("{")
        json_end = response_text.rfind("}") + 1
        if json_start == -1 or json_end <= json_start:
            self.logger.error("AI response JSON parse failed: no object found.")
            return None
        json_str = response_text[json_start:json_end]
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            self.logger.error("AI response JSON parse failed: invalid object.")
            return None

    def _parse_json_array(self, response_text: str) -> list[dict]:
        json_start = response_text.find("[")
        json_end = response_text.rfind("]") + 1
        if json_start == -1 or json_end <= json_start:
            self.logger.error("AI response JSON parse failed: no array found.")
            return []
        json_str = response_text[json_start:json_end]
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            self.logger.error("AI response JSON parse failed: invalid array.")
            return []

    def get_scan_model_info(self) -> dict:
        """Return current scan model provider, model name, and capability tier."""
        return {
            "provider": settings.effective_scan_provider,
            "model": settings.effective_scan_model,
            "tier": resolve_model_tier(settings.effective_scan_model).value,
        }

    def get_recommendation_model_info(self) -> dict:
        """Return current recommendation model provider and model name."""
        return {
            "provider": settings.effective_recommendation_provider,
            "model": settings.effective_recommendation_model,
        }

    async def analyze_wine_label(self, image_content: bytes) -> dict | None:
        """Analyze a wine label image and extract information.

        The prompt depth and token budget are determined by the configured
        scan model's capability tier (premium / standard / lite).
        """
        if not self.scan_provider:
            self.logger.warning("Scan AI provider is not configured; skipping analysis.")
            return None

        try:
            cfg = self.scan_prompt_config
            response_text = await self.scan_provider.generate_content(
                image_content=image_content,
                prompt=cfg.single_prompt,
                max_tokens=cfg.single_max_tokens,
            )
            parsed = self._parse_json_object(response_text)
            if parsed:
                return parsed
            self.logger.warning("AI response JSON parse failed; returning placeholder for refinement.")
            return {
                "name": "Unknown",
                "confidence": Decimal("0.1"),
            }

        except Exception as e:
            self.logger.exception("AI analysis error: %s", e)
            return None

    async def analyze_batch_wine_labels(self, image_content: bytes) -> list[dict]:
        """Analyze multiple wine labels in a single image.

        The prompt depth and token budget are determined by the configured
        scan model's capability tier (premium / standard / lite).
        """
        if not self.scan_provider:
            self.logger.warning("Scan AI provider is not configured; skipping batch analysis.")
            return []

        try:
            cfg = self.scan_prompt_config
            response_text = await self.scan_provider.generate_content(
                image_content=image_content,
                prompt=cfg.batch_prompt,
                max_tokens=cfg.batch_max_tokens,
            )
            return self._parse_json_array(response_text)

        except Exception as e:
            self.logger.exception("Batch AI analysis error: %s", e)
            return []

    async def get_pairing_recommendations(
        self,
        query: str,
        wines: list[dict],
    ) -> dict:
        """Get wine pairing recommendations using AI."""
        if not self.recommendation_provider:
            return self._get_mock_recommendations(wines)

        try:
            wines_json = json.dumps(wines, ensure_ascii=False, default=str)

            prompt = f"""You are a sommelier. A user wants wine recommendations.

User's request: "{query}"

Available wines in their collection:
{wines_json}

Recommend the best matching wines from their collection. Return JSON:
{{
  "recommendations": [
    {{
      "wine_id": "uuid",
      "rank": 1,
      "match_score": 0.95,
      "reason": "Why this wine pairs well",
      "pairing_tips": "Serving suggestions",
      "drinking_urgency": "optimal"  // drink_now, drink_soon, optimal, can_wait
    }}
  ],
  "general_advice": "General pairing advice for the user's request"
}}

Consider:
1. Food pairing compatibility
2. Drinking window (prioritize wines that should be drunk soon)
3. Wine characteristics matching the occasion

Return only valid JSON."""

            response_text = await self.recommendation_provider.generate_text(
                prompt=prompt,
                max_tokens=2000,
            )

            parsed = self._parse_json_object(response_text)
            if parsed:
                return parsed

            return {"recommendations": [], "general_advice": None}

        except Exception as e:
            self.logger.exception("Pairing recommendation error: %s", e)
            return {"recommendations": [], "general_advice": None}

    def _get_mock_wine_data(self) -> dict:
        """Return mock wine data for development."""
        return {
            "name": "Chateau Margaux",
            "producer": "Chateau Margaux",
            "vintage": 2015,
            "grape_variety": ["Cabernet Sauvignon", "Merlot", "Petit Verdot"],
            "region": "Margaux",
            "country": "France",
            "appellation": "Margaux AOC",
            "abv": Decimal("13.5"),
            "type": "red",
            "body": 5,
            "tannin": 4,
            "acidity": 3,
            "sweetness": 1,
            "food_pairing": ["스테이크", "양갈비", "숙성 치즈"],
            "flavor_notes": ["블랙커런트", "삼나무", "바이올렛"],
            "serving_temp_min": 16,
            "serving_temp_max": 18,
            "drinking_window_start": 2025,
            "drinking_window_end": 2045,
            "description": "보르도 1등급 그랑 크뤼 와인으로, 우아하고 복합적인 아로마가 특징입니다.",
            "confidence": Decimal("0.95"),
            "status": "success",
        }

    def _get_mock_recommendations(self, wines: list[dict]) -> dict:
        """Return mock recommendations for development."""
        recommendations = []

        for i, wine in enumerate(wines[:3]):
            recommendations.append({
                "wine_id": wine.get("id"),
                "rank": i + 1,
                "match_score": 0.95 - (i * 0.05),
                "reason": f"{wine.get('name', 'This wine')}의 풍미가 요청하신 음식과 잘 어울립니다.",
                "pairing_tips": "15분 전에 디캔팅하시면 더 좋습니다.",
                "drinking_urgency": "optimal",
            })

        return {
            "recommendations": recommendations,
            "general_advice": "선택하신 음식에는 풀바디 레드 와인이 잘 어울립니다.",
        }
