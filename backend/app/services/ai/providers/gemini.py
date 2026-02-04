"""Gemini vision provider implementation."""

from __future__ import annotations

import google.generativeai as genai

from .base import VisionProvider


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

        response = self.model.generate_content(
            [
                prompt,
                image_part,
            ],
            generation_config={"max_output_tokens": max_tokens},
        )
        return response.text or ""
