"""Base interfaces for AI vision providers."""

from __future__ import annotations

from abc import ABC, abstractmethod


class VisionProvider(ABC):
    """Interface for AI vision providers."""

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
