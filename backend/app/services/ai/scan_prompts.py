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
    "gemini-3-pro-preview": ModelTier.PREMIUM,
    "gemini-3-flash-preview": ModelTier.STANDARD,
    "gemini-2.5-flash": ModelTier.LITE,
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
    return """You are a Master Sommelier with decades of expertise in identifying wines from every major and emerging wine region worldwide.

## Label reading strategy
1. First scan the entire image to locate the front label, back label, neck label, and any capsule markings.
2. Read all visible text carefully — including fine print, legal text, certifications (e.g., Grand Cru Classé, Riserva, Reserva), and lot numbers.
3. Use the label design, typography, crest, and color scheme as additional identification cues.

## Handling image quality issues
- If the image is blurry, tilted, or poorly lit, focus on the largest legible text first (wine name, producer) before attempting smaller details.
- If the label is partially obscured (e.g., by a hand, reflection, or sticker), extract what is visible and infer the rest from your wine knowledge. Clearly lower the confidence score.

## Multilingual label reading
Wine labels frequently use French (Château, Domaine, Cru, Appellation Contrôlée), Italian (Denominazione, Riserva, Classico), Spanish (Crianza, Reserva, Denominación de Origen), German (Spätlese, Trocken, Qualitätswein), and Portuguese (Quinta, Reserva, Região Demarcada). Read and interpret these terms accurately to determine the wine's classification, region, and quality level.

## Output format
Extract the following information in JSON format:
{
  "name": "Full wine name exactly as printed on the label",
  "producer": "Winery/Producer/Domaine/Château/Weingut name",
  "vintage": 2020,
  "grape_variety": ["Cabernet Sauvignon", "Merlot"],
  "region": "Specific sub-region (e.g., Saint-Julien, Rutherford, Barolo, Priorat)",
  "country": "Country of origin",
  "appellation": "Official appellation/denomination (AOC, DOC, DOCG, AVA, DO, VDP, etc.)",
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

## Field guidelines
- "type": one of red, white, rose, sparkling, dessert, fortified
- "body/tannin/acidity/sweetness": 1-5 scale. Infer from grape variety, region, vintage, and classification if not printed on the label.
- Only include fields you can determine from the label or reliably infer from your wine knowledge.

## Confidence scoring
- 0.90-1.0: Label clearly readable, wine positively identified
- 0.70-0.89: Most text readable, minor details inferred from knowledge
- 0.50-0.69: Partial label visible, significant inference required
- 0.30-0.49: Only fragments readable, identification is a best guess
- 0.01-0.29: Almost nothing readable, very low certainty

Return ONLY valid JSON, no additional text."""


def _premium_batch_prompt() -> str:
    return """You are a Master Sommelier. Identify every wine bottle in this image.

## Image analysis strategy
1. Scan the entire image systematically from left to right, top to bottom.
2. Identify every wine bottle present — including those partially hidden, at angles, in the background, or only showing a side/back label.
3. For each bottle, read all visible label text: front label, back label, neck label.
4. Use label design, typography, crest, and color scheme as additional identification cues.

## Handling difficult conditions
- **Overlapping bottles**: Trace each bottle outline separately. Lower confidence for obscured ones.
- **Angled or rotated bottles**: Focus on the largest legible elements first.
- **Poor lighting / reflections**: Extract readable portions and lower confidence.

## Multilingual labels
Interpret French (Château, Domaine, AOC), Italian (Riserva, DOCG), Spanish (Crianza, DO), German (Spätlese, VDP) terms accurately.

## Output — core identification fields only
Return a COMPACT JSON array (no newlines, no indentation) with ONLY these fields per bottle:

[{"status":"success","name":"Wine name","producer":"Producer","vintage":2020,"grape_variety":["Cabernet Sauvignon"],"type":"red","country":"France","region":"Bordeaux","appellation":"AOC","abv":13.5,"confidence":0.95},{"status":"failed","error":"Label obscured","confidence":0.05}]

- "type": one of red, white, rose, sparkling, dessert, fortified
- Do NOT include taste profile, food pairing, flavor notes, or description.
- Omit fields with null values to save space.

## Confidence scoring (per bottle)
- 0.90-1.0: Label clearly readable, wine positively identified
- 0.70-0.89: Most text readable, minor details inferred
- 0.50-0.69: Partial label visible, significant inference required
- below 0.50: Mostly guessing

CRITICAL: Return compact single-line JSON array only. No markdown fences, no newlines in JSON."""


def _standard_single_prompt() -> str:
    return """You are a wine expert. Analyze this wine label image and extract information.

Read all visible text on the label. For non-English labels (French, Italian, Spanish, German, etc.), interpret wine-specific terms (e.g., Château, Riserva, Crianza, Spätlese) to determine the classification and region.

If the image is blurry or the label is partially obscured, extract what you can and lower the confidence score accordingly.

Extract the following in JSON format:
{
  "name": "Full wine name",
  "producer": "Winery/Producer name",
  "vintage": 2020,
  "grape_variety": ["Cabernet Sauvignon", "Merlot"],
  "region": "Specific region (e.g., Margaux, Napa Valley)",
  "country": "Country of origin",
  "appellation": "Official appellation if visible (AOC, DOC, AVA, etc.)",
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

- "type": one of red, white, rose, sparkling, dessert, fortified
- "body/tannin/acidity/sweetness": 1-5 scale, infer from grape and region if not on label
- "confidence": 0.9+ if clearly readable, 0.7-0.89 if minor inference, 0.5-0.69 if partially visible, below 0.5 if mostly guessing
- Only include fields you can determine from the label or your knowledge
- Return ONLY valid JSON"""


def _standard_batch_prompt() -> str:
    return """You are a wine expert. Identify every wine bottle in this image.

Read all visible label text for each bottle. For non-English labels, interpret wine-specific terms accurately. If labels are partially obscured, lower the confidence.

Return a COMPACT JSON array (no newlines, no indentation) with core fields only:

[{"status":"success","name":"Wine name","producer":"Producer","vintage":2020,"grape_variety":["Cabernet Sauvignon"],"type":"red","country":"Country","region":"Region","appellation":"Appellation","abv":13.5,"confidence":0.95},{"status":"failed","error":"Label obscured","confidence":0.1}]

- "type": one of red, white, rose, sparkling, dessert, fortified
- "confidence": 0.9+ clearly readable, 0.7-0.89 minor inference, below 0.7 partial/guessing
- Omit fields with null values. Do NOT include taste, pairing, or description.
- CRITICAL: Return compact single-line JSON array only. No markdown fences, no newlines in JSON."""


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

- "type": one of red, white, rose, sparkling, dessert, fortified
- "confidence": 0.9+ if label is clear, 0.5-0.89 if partially readable, below 0.5 if guessing
- Only include fields visible on the label. Return only valid JSON."""


def _lite_batch_prompt() -> str:
    return """List all wine bottles in this image as a compact JSON array (no newlines):

[{"status":"success","name":"Wine name","producer":"Producer","vintage":2020,"type":"red","country":"Country","region":"Region","confidence":0.9},{"status":"failed","error":"Unreadable","confidence":0.1}]

- "type": one of red, white, rose, sparkling, dessert, fortified
- Omit fields with null values. Include all bottles even if partially visible.
- Return compact single-line JSON array only. No markdown fences."""


# ---- tier -> config -------------------------------------------------------

_TIER_CONFIGS: dict[ModelTier, ScanPromptConfig] = {
    ModelTier.PREMIUM: ScanPromptConfig(
        single_prompt=_premium_single_prompt(),
        batch_prompt=_premium_batch_prompt(),
        single_max_tokens=3000,
        batch_max_tokens=4000,
    ),
    ModelTier.STANDARD: ScanPromptConfig(
        single_prompt=_standard_single_prompt(),
        batch_prompt=_standard_batch_prompt(),
        single_max_tokens=2000,
        batch_max_tokens=3000,
    ),
    ModelTier.LITE: ScanPromptConfig(
        single_prompt=_lite_single_prompt(),
        batch_prompt=_lite_batch_prompt(),
        single_max_tokens=1000,
        batch_max_tokens=2000,
    ),
}


def get_scan_prompt_config(model: str) -> ScanPromptConfig:
    """Return the prompt config appropriate for the given model."""
    tier = resolve_model_tier(model)
    return _TIER_CONFIGS[tier]
