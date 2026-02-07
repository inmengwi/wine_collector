"""Base interfaces for AI providers."""

from __future__ import annotations

from abc import ABC, abstractmethod


class VisionProvider(ABC):
    """Interface for AI vision providers (image + text input)."""

    name: str

    @abstractmethod
    async def generate_content(
        self,
        image_content: bytes,
        prompt: str,
        max_tokens: int,
    ) -> str:
        """Generate a text response for an image and prompt."""
        raise NotImplementedError


class TextProvider(ABC):
    """Interface for AI text providers (text-only input)."""

    name: str

    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        max_tokens: int,
    ) -> str:
        """Generate a text response for a text-only prompt."""
        raise NotImplementedError
