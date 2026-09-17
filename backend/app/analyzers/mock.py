import hashlib

from .. import nutrition
from ..schemas import AnalyzeResult, FoodItem
from .base import Analyzer

_ROTATION = ["machboos", "shawarma", "caesar salad", "grilled chicken breast", "luqaimat"]


class MockAnalyzer(Analyzer):
    """Deterministic offline analyzer. Keeps the app demoable with no key and no network."""

    name = "mock"

    async def analyze(self, image_bytes: bytes) -> AnalyzeResult:
        digest = hashlib.sha256(image_bytes).digest()
        label = _ROTATION[digest[0] % len(_ROTATION)]
        facts = nutrition.lookup(label)
        assert facts is not None
        scale = facts.typical_portion_g / 100.0
        item = FoodItem(
            name=facts.name,
            name_ar=facts.name_ar,
            confidence=0.42,
            portion_g=facts.typical_portion_g,
            calories=round(facts.calories * scale, 1),
            protein_g=round(facts.protein_g * scale, 1),
            carbs_g=round(facts.carbs_g * scale, 1),
            fat_g=round(facts.fat_g * scale, 1),
        )
        alternatives = [name for name in _ROTATION if name != label][:3]
        return AnalyzeResult(items=[item], alternatives=alternatives, analyzer=self.name)
