"""AI service for wine label recognition and recommendations."""

import json
import logging
from decimal import Decimal

import anthropic

from app.config import settings
from app.services.ai.providers import AnthropicVisionProvider, GeminiVisionProvider, VisionProvider


class AIService:
    """Service for AI-powered wine analysis using Claude."""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.provider = self._select_provider()
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.model = "claude-sonnet-4-20250514"

    def _select_provider(self) -> VisionProvider | None:
        provider_name = settings.ai_provider.lower()
        if provider_name == "gemini":
            if not settings.gemini_api_key:
                return None
            return GeminiVisionProvider(
                api_key=settings.gemini_api_key,
                model="gemini-3.0-flash",
            )
        if provider_name == "anthropic":
            if not settings.anthropic_api_key:
                return None
            return AnthropicVisionProvider(
                api_key=settings.anthropic_api_key,
                model="claude-sonnet-4-20250514",
            )
        self.logger.warning("Unknown AI provider '%s'", settings.ai_provider)
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

    async def analyze_wine_label(self, image_content: bytes) -> dict | None:
        """Analyze a wine label image and extract information."""
        if not self.provider:
            # Return mock data for development
            return self._get_mock_wine_data()

        try:
            response_text = await self.provider.generate_content(
                image_content=image_content,
                prompt="""Analyze this wine label image and extract the following information in JSON format:

{
  "name": "Full wine name",
  "producer": "Winery/Producer name",
  "vintage": 2020,  // Year as integer, null if non-vintage
  "grape_variety": ["Cabernet Sauvignon", "Merlot"],  // Array of grape varieties
  "region": "Specific region (e.g., Margaux, Napa Valley)",
  "country": "Country of origin",
  "appellation": "Official appellation if visible",
  "abv": 13.5,  // Alcohol percentage as decimal
  "type": "red",  // One of: red, white, rose, sparkling, dessert, fortified
  "body": 4,  // 1-5 scale
  "tannin": 4,  // 1-5 scale (for red wines)
  "acidity": 3,  // 1-5 scale
  "sweetness": 1,  // 1-5 scale
  "food_pairing": ["Grilled steak", "Lamb", "Aged cheese"],
  "flavor_notes": ["Blackcurrant", "Cedar", "Tobacco"],
  "serving_temp_min": 16,  // Celsius
  "serving_temp_max": 18,  // Celsius
  "drinking_window_start": 2025,  // Year
  "drinking_window_end": 2040,  // Year
  "description": "Brief description of the wine",
  "confidence": 0.95  // Your confidence in the recognition (0-1)
}

Only include fields you can determine from the label or your knowledge. Return only valid JSON.""",
                max_tokens=2000,
            )
            return self._parse_json_object(response_text)

        except Exception as e:
            self.logger.exception("AI analysis error: %s", e)
            return None

    async def analyze_batch_wine_labels(self, image_content: bytes) -> list[dict]:
        """Analyze multiple wine labels in a single image."""
        if not self.provider:
            return [self._get_mock_wine_data(), self._get_mock_wine_data()]

        try:
            response_text = await self.provider.generate_content(
                image_content=image_content,
                prompt="""Analyze this image containing multiple wine bottles. For each visible wine label, extract information.

Return a JSON array of objects:
[
  {
    "status": "success",
    "name": "Wine name",
    "producer": "Producer",
    "vintage": 2020,
    "type": "red",
    "country": "France",
    "region": "Bordeaux",
    "confidence": 0.95,
    "bounding_box": {"x": 100, "y": 50, "width": 200, "height": 400}
  },
  {
    "status": "failed",
    "error": "Label obscured or unreadable",
    "bounding_box": {"x": 350, "y": 50, "width": 200, "height": 400}
  }
]

Return only valid JSON array.""",
                max_tokens=4000,
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
        if not settings.anthropic_api_key:
            return self._get_mock_recommendations(wines)

        try:
            wines_json = json.dumps(wines, ensure_ascii=False, default=str)

            message = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[
                    {
                        "role": "user",
                        "content": f"""You are a sommelier. A user wants wine recommendations.

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

Return only valid JSON.""",
                    }
                ],
            )

            response_text = message.content[0].text

            try:
                json_start = response_text.find("{")
                json_end = response_text.rfind("}") + 1
                if json_start != -1 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    return json.loads(json_str)
            except json.JSONDecodeError:
                pass

            return {"recommendations": [], "general_advice": None}

        except Exception as e:
            self.logger.exception("Pairing recommendation error: %s", e)
            return {"recommendations": [], "general_advice": None}

    def _get_mock_wine_data(self) -> dict:
        """Return mock wine data for development."""
        return {
            "name": "Château Margaux",
            "producer": "Château Margaux",
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
