"""Gemini provider implementations."""

from __future__ import annotations

import logging

import google.generativeai as genai

from .base import TextProvider, VisionProvider

logger = logging.getLogger(__name__)

# Whether thinking was successfully disabled at model construction time.
# If not, we must pass a larger max_output_tokens to account for thinking.
_thinking_disabled: bool = False


def _create_model(model_name: str) -> genai.GenerativeModel:
    """Create a GenerativeModel, disabling thinking for 2.5+ models.

    Gemini 2.5+ models have thinking enabled by default. Thinking tokens
    consume the max_output_tokens budget, starving the actual response.
    We disable it by setting thinking_budget=0 via GenerationConfig at
    model construction time.
    """
    global _thinking_disabled

    # Attempt 1: dict-style thinking_config
    try:
        gen_config = genai.GenerationConfig(
            thinking_config={"thinking_budget": 0},
        )
        model = genai.GenerativeModel(model_name, generation_config=gen_config)
        _thinking_disabled = True
        logger.info("Gemini model created with thinking disabled (dict config): %s", model_name)
        return model
    except (TypeError, ValueError, AttributeError) as e:
        logger.debug("thinking_config dict failed: %s", e)

    # Attempt 2: ThinkingConfig type
    try:
        if hasattr(genai.types, "ThinkingConfig"):
            thinking_cfg = genai.types.ThinkingConfig(thinking_budget=0)
            gen_config = genai.GenerationConfig(thinking_config=thinking_cfg)
            model = genai.GenerativeModel(model_name, generation_config=gen_config)
            _thinking_disabled = True
            logger.info("Gemini model created with thinking disabled (ThinkingConfig): %s", model_name)
            return model
    except (TypeError, ValueError, AttributeError) as e:
        logger.debug("ThinkingConfig type failed: %s", e)

    # Fallback: no thinking control — must compensate with higher max_tokens
    _thinking_disabled = False
    logger.warning(
        "Could not disable thinking for model %s. "
        "Output tokens will be inflated to compensate for thinking budget.",
        model_name,
    )
    return genai.GenerativeModel(model_name)


def _effective_max_tokens(max_tokens: int) -> int:
    """If thinking could not be disabled, inflate the budget to compensate.

    Gemini thinking typically uses 1000-4000 tokens. We add a buffer of
    4096 so the actual response still gets enough tokens.
    """
    if _thinking_disabled:
        return max_tokens
    inflated = max_tokens + 4096
    logger.debug(
        "Inflating max_output_tokens %d -> %d (thinking not disabled)",
        max_tokens, inflated,
    )
    return inflated


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

        effective = _effective_max_tokens(max_tokens)
        response = self.model.generate_content(
            [prompt, image_part],
            generation_config={"max_output_tokens": effective},
        )

        # Log finish reason for diagnostics
        if response.candidates:
            candidate = response.candidates[0]
            finish_reason = getattr(candidate, "finish_reason", None)
            if finish_reason and str(finish_reason) not in ("1", "STOP", "FinishReason.STOP"):
                logger.warning(
                    "Gemini vision response truncated: finish_reason=%s, "
                    "requested_max_tokens=%d, effective=%d",
                    finish_reason, max_tokens, effective,
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
        effective = _effective_max_tokens(max_tokens)
        response = self.model.generate_content(
            prompt,
            generation_config={"max_output_tokens": effective},
        )

        if response.candidates:
            candidate = response.candidates[0]
            finish_reason = getattr(candidate, "finish_reason", None)
            if finish_reason and str(finish_reason) not in ("1", "STOP", "FinishReason.STOP"):
                logger.warning(
                    "Gemini text response truncated: finish_reason=%s, "
                    "requested_max_tokens=%d, effective=%d",
                    finish_reason, max_tokens, effective,
                )

        return response.text or ""
