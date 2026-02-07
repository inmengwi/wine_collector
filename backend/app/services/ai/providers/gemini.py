"""Gemini provider implementations."""

from __future__ import annotations

import logging

import google.generativeai as genai

from .base import TextProvider, VisionProvider

logger = logging.getLogger(__name__)


def _create_model(model_name: str) -> genai.GenerativeModel:
    """Create a GenerativeModel, disabling thinking for 2.5+ models.

    Gemini 2.5+ models have thinking enabled by default. Thinking tokens
    consume the max_output_tokens budget, starving the actual response.
    We disable it by setting thinking_budget=0 via GenerationConfig at
    model construction time.
    """
    # Attempt to build a GenerationConfig with thinking disabled.
    # Older SDK versions don't support this, so fall back gracefully.
    try:
        gen_config = genai.GenerationConfig(
            thinking_config={"thinking_budget": 0},
        )
        return genai.GenerativeModel(model_name, generation_config=gen_config)
    except (TypeError, ValueError, AttributeError):
        pass

    # Second attempt: thinking_config might be a proper type
    try:
        if hasattr(genai.types, "ThinkingConfig"):
            thinking_cfg = genai.types.ThinkingConfig(thinking_budget=0)
            gen_config = genai.GenerationConfig(thinking_config=thinking_cfg)
            return genai.GenerativeModel(model_name, generation_config=gen_config)
    except (TypeError, ValueError, AttributeError):
        pass

    # Fallback: create without thinking config (older SDK / non-2.5 model)
    logger.debug("Could not disable thinking for model %s; using defaults.", model_name)
    return genai.GenerativeModel(model_name)


class GeminiVisionProvider(VisionProvider):
    """Vision provider backed by Google's Gemini models."""

    name = "gemini"

    def __init__(self, api_key: str, model: str) -> None:
        genai.configure(api_key=api_key)
        self.model = _create_model(model)

    async def generate_content(
        self,
        image_content: bytes,
        prompt: str,
        max_tokens: int,
    ) -> str:
        image_part = None
        if hasattr(genai, "types"):
            if hasattr(genai.types, "Part"):
                image_part = genai.types.Part.from_data(
                    data=image_content,
                    mime_type="image/jpeg",
                )
            elif hasattr(genai.types, "Blob"):
                image_part = genai.types.Blob(
                    data=image_content,
                    mime_type="image/jpeg",
                )
        if image_part is None:
            image_part = {"mime_type": "image/jpeg", "data": image_content}

        response = self.model.generate_content(
            [prompt, image_part],
            generation_config={"max_output_tokens": max_tokens},
        )

        # Log finish reason for diagnostics
        if response.candidates:
            candidate = response.candidates[0]
            finish_reason = getattr(candidate, "finish_reason", None)
            if finish_reason and str(finish_reason) not in ("1", "STOP", "FinishReason.STOP"):
                logger.warning(
                    "Gemini response truncated: finish_reason=%s, max_tokens=%d",
                    finish_reason, max_tokens,
                )

        return response.text or ""


class GeminiTextProvider(TextProvider):
    """Text provider backed by Google's Gemini models."""

    name = "gemini"

    def __init__(self, api_key: str, model: str) -> None:
        genai.configure(api_key=api_key)
        self.model = _create_model(model)

    async def generate_text(
        self,
        prompt: str,
        max_tokens: int,
    ) -> str:
        response = self.model.generate_content(
            prompt,
            generation_config={"max_output_tokens": max_tokens},
        )

        if response.candidates:
            candidate = response.candidates[0]
            finish_reason = getattr(candidate, "finish_reason", None)
            if finish_reason and str(finish_reason) not in ("1", "STOP", "FinishReason.STOP"):
                logger.warning(
                    "Gemini response truncated: finish_reason=%s, max_tokens=%d",
                    finish_reason, max_tokens,
                )

        return response.text or ""
