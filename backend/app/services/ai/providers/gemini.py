"""Gemini provider implementations."""

from __future__ import annotations

import logging

import google.generativeai as genai

from .base import TextProvider, VisionProvider

logger = logging.getLogger(__name__)


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

        # Gemini 2.5+ models have "thinking" enabled by default.
        # Thinking tokens consume the max_output_tokens budget, so we
        # must either disable thinking or set a separate thinking budget
        # to prevent the actual response from being truncated.
        generation_config = {"max_output_tokens": max_tokens}
        try:
            generation_config["thinking_config"] = {"thinking_budget": 0}
        except Exception:
            pass

        response = self.model.generate_content(
            [prompt, image_part],
            generation_config=generation_config,
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
        self.model = genai.GenerativeModel(model)

    async def generate_text(
        self,
        prompt: str,
        max_tokens: int,
    ) -> str:
        generation_config = {"max_output_tokens": max_tokens}
        try:
            generation_config["thinking_config"] = {"thinking_budget": 0}
        except Exception:
            pass

        response = self.model.generate_content(
            prompt,
            generation_config=generation_config,
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
