from functools import lru_cache

from ..config import settings
from .base import Analyzer
from .mock import MockAnalyzer
from .vision_llm import VisionLLMAnalyzer


@lru_cache(maxsize=1)
def get_analyzer() -> Analyzer:
    """Resolve the configured analyzer, falling back to mock when it is unusable."""
    mode = settings.analyzer.lower()

    if mode == "openai" and settings.openai_api_key:
        return VisionLLMAnalyzer(
            name="openai",
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            model=settings.openai_model,
        )

    if mode == "qwen" and settings.qwen_api_key and settings.qwen_base_url:
        return VisionLLMAnalyzer(
            name="qwen",
            api_key=settings.qwen_api_key,
            base_url=settings.qwen_base_url,
            model=settings.qwen_model,
        )

    if mode == "local":
        from .local_classifier import LocalClassifierAnalyzer

        return LocalClassifierAnalyzer()

    return MockAnalyzer()


__all__ = ["Analyzer", "MockAnalyzer", "VisionLLMAnalyzer", "get_analyzer"]
