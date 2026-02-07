"""Anthropic provider implementations."""

from __future__ import annotations

import base64

import anthropic

from .base import TextProvider, VisionProvider


class AnthropicVisionProvider(VisionProvider):
    """Vision provider backed by Anthropic's Claude models."""

    name = "anthropic"

    def __init__(self, api_key: str, model: str) -> None:
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model

    async def generate_content(
        self,
        image_content: bytes,
        prompt: str,
        max_tokens: int,
    ) -> str:
        image_base64 = base64.standard_b64encode(image_content).decode("utf-8")
        message = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": image_base64,
                            },
                        },
                        {
                            "type": "text",
                            "text": prompt,
                        },
                    ],
                }
            ],
        )
        if not message.content:
            return ""
        return message.content[0].text


class AnthropicTextProvider(TextProvider):
    """Text provider backed by Anthropic's Claude models."""

    name = "anthropic"

    def __init__(self, api_key: str, model: str) -> None:
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model

    async def generate_text(
        self,
        prompt: str,
        max_tokens: int,
    ) -> str:
        message = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )
        if not message.content:
            return ""
        return message.content[0].text
