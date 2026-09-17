from abc import ABC, abstractmethod

from ..schemas import AnalyzeResult


class Analyzer(ABC):
    name: str = "base"

    @abstractmethod
    async def analyze(self, image_bytes: bytes) -> AnalyzeResult:
        """Identify the food in a photo and return per-item nutrition."""
