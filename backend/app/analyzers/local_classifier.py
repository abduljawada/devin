import io

from PIL import Image

from .. import nutrition
from ..schemas import AnalyzeResult, FoodItem
from .base import Analyzer

MODEL_ID = "nateraw/food"


class LocalClassifierAnalyzer(Analyzer):
    """Food-101 ViT classifier running on CPU. Free, offline, single-dish only.

    Requires the optional `transformers` + `torch` extras.
    """

    name = "local"

    def __init__(self) -> None:
        from transformers import pipeline

        self._pipeline = pipeline("image-classification", model=MODEL_ID)

    async def analyze(self, image_bytes: bytes) -> AnalyzeResult:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        predictions = self._pipeline(image, top_k=4)
        if not predictions:
            return AnalyzeResult(items=[], analyzer=self.name)

        top = predictions[0]
        label = str(top["label"]).replace("_", " ")
        facts = nutrition.lookup(label) or await nutrition.lookup_remote(label)
        portion = facts.typical_portion_g if facts else 200.0
        scale = portion / 100.0
        item = FoodItem(
            name=facts.name if facts else label,
            name_ar=facts.name_ar if facts else "",
            confidence=float(top["score"]),
            portion_g=portion,
            calories=round((facts.calories if facts else 200.0) * scale, 1),
            protein_g=round((facts.protein_g if facts else 8.0) * scale, 1),
            carbs_g=round((facts.carbs_g if facts else 20.0) * scale, 1),
            fat_g=round((facts.fat_g if facts else 8.0) * scale, 1),
        )
        alternatives = [str(p["label"]).replace("_", " ") for p in predictions[1:]]
        return AnalyzeResult(items=[item], alternatives=alternatives, analyzer=self.name)
