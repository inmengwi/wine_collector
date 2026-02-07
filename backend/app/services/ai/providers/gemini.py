"""Gemini provider implementations."""

from __future__ import annotations

import logging

import google.generativeai as genai

from .base import TextProvider, VisionProvider

logger = logging.getLogger(__name__)


def _build_generation_config(max_tokens: int) -> dict | genai.GenerationConfig:
    """Build a generation config that includes both max_output_tokens and
    thinking_budget=0 for Gemini 2.5+ models.

    Tries to create a proper GenerationConfig object first; falls back to
    a plain dict (which won't disable thinking but at least won't error).
    """
    # Attempt 1: GenerationConfig with dict-style thinking_config
    try:
        return genai.GenerationConfig(
            max_output_tokens=max_tokens,
            thinking_config={"thinking_budget": 0},
        )
    except (TypeError, ValueError, AttributeError):
        pass

    # Attempt 2: GenerationConfig with ThinkingConfig type
    try:
        if hasattr(genai.types, "ThinkingConfig"):
            thinking_cfg = genai.types.ThinkingConfig(thinking_budget=0)
            return genai.GenerationConfig(
                max_output_tokens=max_tokens,
                thinking_config=thinking_cfg,
            )
    except (TypeError, ValueError, AttributeError):
        pass

    # Fallback: plain dict without thinking control.
    # Inflate tokens to compensate for thinking budget consumption.
    logger.warning(
        "Cannot disable thinking via GenerationConfig (SDK too old?). "
        "Inflating max_output_tokens %d -> %d to compensate.",
        max_tokens, max_tokens + 4096,
    )
    return {"max_output_tokens": max_tokens + 4096}


class GeminiVisionProvider(VisionProvider):
    """Vision provider backed by Google's Gemini models."""

    name = "gemini"

    def __init__(self, api_key: str, model: str) -> None:
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model)

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

        gen_config = _build_generation_config(max_tokens)
        response = self.model.generate_content(
            [prompt, image_part],
            generation_config=gen_config,
        )

        # Log finish reason for diagnostics
        if response.candidates:
            candidate = response.candidates[0]
            finish_reason = getattr(candidate, "finish_reason", None)
            if finish_reason and str(finish_reason) not in ("1", "STOP", "FinishReason.STOP"):
                logger.warning(
                    "Gemini vision response truncated: finish_reason=%s, max_tokens=%d",
                    finish_reason, max_tokens,
                )

        return response.text or ""


class GeminiTextProvider(TextProvider):
    """Text provider backed by Google's Gemini models."""

    name = "gemini"

    def __init__(self, api_key: str, model: str) -> None:
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model)

    async def generate_text(
        self,
        prompt: str,
        max_tokens: int,
    ) -> str:
        gen_config = _build_generation_config(max_tokens)
        response = self.model.generate_content(
            prompt,
            generation_config=gen_config,
        )

        if response.candidates:
            candidate = response.candidates[0]
            finish_reason = getattr(candidate, "finish_reason", None)
            if finish_reason and str(finish_reason) not in ("1", "STOP", "FinishReason.STOP"):
                logger.warning(
                    "Gemini text response truncated: finish_reason=%s, max_tokens=%d",
                    finish_reason, max_tokens,
                )

        return response.text or ""
