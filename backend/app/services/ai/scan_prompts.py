"""Model-tier-aware prompt strategies for wine label scanning.

Selects prompt depth and max_tokens based on the AI model's capability tier:
- premium : Full sommelier-level analysis with all fields and multi-language guidance.
- standard: Balanced prompt covering core + enrichment fields.
- lite    : Minimal essential fields only for fast, low-cost scanning.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ModelTier(str, Enum):
    PREMIUM = "premium"
    STANDARD = "standard"
    LITE = "lite"


# ---- model -> tier mapping ------------------------------------------------

_MODEL_TIER_MAP: dict[str, ModelTier] = {
    # Anthropic
    "claude-opus-4-6": ModelTier.PREMIUM,
    "claude-opus-4-20250514": ModelTier.PREMIUM,
    "claude-sonnet-4-20250514": ModelTier.STANDARD,
    "claude-sonnet-4-5-20250929": ModelTier.STANDARD,
    "claude-haiku-4-5-20251001": ModelTier.LITE,
    # Google Gemini
    "gemini-2.5-pro": ModelTier.PREMIUM,
    "gemini-2.5-flash": ModelTier.STANDARD,
    "gemini-2.0-flash": ModelTier.STANDARD,
    "gemini-2.0-flash-lite": ModelTier.LITE,
}


def resolve_model_tier(model: str) -> ModelTier:
    """Resolve the capability tier for a given model identifier.

    Falls back to STANDARD if the model is unrecognised, and uses prefix
    matching for versioned model IDs (e.g. ``gemini-2.5-pro-preview-...``).
    """
    if model in _MODEL_TIER_MAP:
        return _MODEL_TIER_MAP[model]

    # Prefix match for versioned / preview model IDs
    for prefix, tier in _MODEL_TIER_MAP.items():
        if model.startswith(prefix):
            return tier

    return ModelTier.STANDARD


# ---- prompt templates per tier --------------------------------------------

@dataclass(frozen=True)
class ScanPromptConfig:
    """Holds the prompt text and token budget for a scan request."""

    single_prompt: str
    batch_prompt: str
    single_max_tokens: int
    batch_max_tokens: int


def _premium_single_prompt() -> str:
    return """You are a Master Sommelier with expertise in reading wine labels from all regions worldwide.

Analyze this wine label image carefully. Read all visible text including fine print, back labels, and any certifications. Consider the label design, typography, and visual cues to identify the wine.

For multilingual labels, read text in French, Italian, Spanish, German, Portuguese, and any other language present. Translate key terms to provide accurate structured data.

Extract the following information in JSON format:
{
  "name": "Full wine name as printed on the label",
  "producer": "Winery/Producer/Domaine/Château name",
  "vintage": 2020,
  "grape_variety": ["Cabernet Sauvignon", "Merlot"],
  "region": "Specific sub-region (e.g., Saint-Julien, Rutherford, Barolo)",
  "country": "Country of origin",
  "appellation": "Official appellation/denomination (AOC, DOC, DOCG, AVA, etc.)",
  "abv": 13.5,
  "type": "red",
  "body": 4,
  "tannin": 4,
  "acidity": 3,
  "sweetness": 1,
  "food_pairing": ["Grilled steak", "Lamb", "Aged cheese"],
  "flavor_notes": ["Blackcurrant", "Cedar", "Tobacco"],
  "serving_temp_min": 16,
  "serving_temp_max": 18,
  "drinking_window_start": 2025,
  "drinking_window_end": 2040,
  "description": "Brief description of the wine's character and quality level",
  "confidence": 0.95
}

Field guidelines:
- "type": one of red, white, rose, sparkling, dessert, fortified
- "body/tannin/acidity/sweetness": 1-5 scale, infer from grape, region, vintage if not on label
- "confidence": 0-1, lower if the label is partially obscured, blurry, or you are guessing
- Only include fields you can determine from the label or your wine knowledge
- Return ONLY valid JSON, no additional text"""


def _premium_batch_prompt() -> str:
    return """You are a Master Sommelier analyzing an image containing multiple wine bottles.

Carefully examine the entire image. Identify every wine bottle visible, even those partially obscured, at angles, or in the background. For each bottle, read all visible label text including fine print and back labels.

For multilingual labels, read text in French, Italian, Spanish, German, Portuguese, and any other language present.

Return a JSON array. For each detected bottle:
[
  {
    "status": "success",
    "name": "Full wine name as printed on the label",
    "producer": "Winery/Producer name",
    "vintage": 2020,
    "grape_variety": ["Cabernet Sauvignon"],
    "region": "Specific sub-region",
    "country": "Country of origin",
    "appellation": "Official appellation if visible",
    "abv": 13.5,
    "type": "red",
    "body": 4,
    "tannin": 4,
    "acidity": 3,
    "sweetness": 1,
    "food_pairing": ["Grilled steak", "Lamb"],
    "flavor_notes": ["Blackcurrant", "Cedar"],
    "serving_temp_min": 16,
    "serving_temp_max": 18,
    "drinking_window_start": 2025,
    "drinking_window_end": 2040,
    "description": "Brief description",
    "confidence": 0.95,
    "bounding_box": {"x": 100, "y": 50, "width": 200, "height": 400}
  },
  {
    "status": "failed",
    "error": "Label too obscured to read",
    "confidence": 0.1,
    "bounding_box": {"x": 350, "y": 50, "width": 200, "height": 400}
  }
]

Field guidelines:
- "type": one of red, white, rose, sparkling, dessert, fortified
- "body/tannin/acidity/sweetness": 1-5 scale, infer from grape, region, vintage
- "confidence": 0-1 per bottle. Set lower for partially visible or guessed information
- "bounding_box": approximate pixel coordinates of each bottle in the image
- If a label is unreadable, use status "failed" with an error description
- Return ONLY a valid JSON array, no additional text"""


def _standard_single_prompt() -> str:
    return """Analyze this wine label image and extract the following information in JSON format:
{
  "name": "Full wine name",
  "producer": "Winery/Producer name",
  "vintage": 2020,
  "grape_variety": ["Cabernet Sauvignon", "Merlot"],
  "region": "Specific region (e.g., Margaux, Napa Valley)",
  "country": "Country of origin",
  "appellation": "Official appellation if visible",
  "abv": 13.5,
  "type": "red",
  "body": 4,
  "tannin": 4,
  "acidity": 3,
  "sweetness": 1,
  "food_pairing": ["Grilled steak", "Lamb", "Aged cheese"],
  "flavor_notes": ["Blackcurrant", "Cedar", "Tobacco"],
  "serving_temp_min": 16,
  "serving_temp_max": 18,
  "drinking_window_start": 2025,
  "drinking_window_end": 2040,
  "description": "Brief description of the wine",
  "confidence": 0.95
}

Only include fields you can determine from the label or your knowledge. Return only valid JSON."""


def _standard_batch_prompt() -> str:
    return """Analyze this image containing multiple wine bottles. For each visible wine label, extract information.

Return a JSON array of objects:
[
  {
    "status": "success",
    "name": "Full wine name",
    "producer": "Producer name",
    "vintage": 2020,
    "grape_variety": ["Cabernet Sauvignon"],
    "type": "red",
    "country": "Country",
    "region": "Region",
    "appellation": "Appellation if visible",
    "abv": 13.5,
    "confidence": 0.95,
    "bounding_box": {"x": 100, "y": 50, "width": 200, "height": 400}
  },
  {
    "status": "failed",
    "error": "Label obscured or unreadable",
    "bounding_box": {"x": 350, "y": 50, "width": 200, "height": 400}
  }
]

- "type": one of red, white, rose, sparkling, dessert, fortified
- Include all wines visible in the image, even partially visible ones
- Return only valid JSON array."""


def _lite_single_prompt() -> str:
    return """Extract wine information from this label image as JSON:
{
  "name": "Wine name",
  "producer": "Producer",
  "vintage": 2020,
  "type": "red",
  "country": "Country",
  "region": "Region",
  "confidence": 0.9
}

"type": one of red, white, rose, sparkling, dessert, fortified.
Only include fields visible on the label. Return only valid JSON."""


def _lite_batch_prompt() -> str:
    return """List all wine bottles visible in this image as a JSON array:
[
  {
    "status": "success",
    "name": "Wine name",
    "producer": "Producer",
    "vintage": 2020,
    "type": "red",
    "country": "Country",
    "region": "Region",
    "confidence": 0.9,
    "bounding_box": {"x": 100, "y": 50, "width": 200, "height": 400}
  },
  {
    "status": "failed",
    "error": "Unreadable",
    "bounding_box": {"x": 350, "y": 50, "width": 200, "height": 400}
  }
]

"type": one of red, white, rose, sparkling, dessert, fortified.
Return only valid JSON array."""


# ---- tier -> config -------------------------------------------------------

_TIER_CONFIGS: dict[ModelTier, ScanPromptConfig] = {
    ModelTier.PREMIUM: ScanPromptConfig(
        single_prompt=_premium_single_prompt(),
        batch_prompt=_premium_batch_prompt(),
        single_max_tokens=3000,
        batch_max_tokens=8000,
    ),
    ModelTier.STANDARD: ScanPromptConfig(
        single_prompt=_standard_single_prompt(),
        batch_prompt=_standard_batch_prompt(),
        single_max_tokens=2000,
        batch_max_tokens=5000,
    ),
    ModelTier.LITE: ScanPromptConfig(
        single_prompt=_lite_single_prompt(),
        batch_prompt=_lite_batch_prompt(),
        single_max_tokens=1000,
        batch_max_tokens=3000,
    ),
}


def get_scan_prompt_config(model: str) -> ScanPromptConfig:
    """Return the prompt config appropriate for the given model."""
    tier = resolve_model_tier(model)
    return _TIER_CONFIGS[tier]
