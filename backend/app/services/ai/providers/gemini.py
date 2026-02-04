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
        response = self.model.generate_content(
            [
                prompt,
                genai.types.Part.from_data(
                    data=image_content,
                    mime_type="image/jpeg",
                ),
            ],
            generation_config={"max_output_tokens": max_tokens},
        )
        return response.text or ""
