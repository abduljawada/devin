import base64
import json

import httpx

from .. import nutrition
from ..schemas import AnalyzeResult, FoodItem
from .base import Analyzer

PROMPT = """You are a nutrition estimator. Identify every distinct food or drink in the photo.

Return ONLY minified JSON of this shape:
{"items":[{"name":"english dish name","name_ar":"الاسم بالعربية","confidence":0.0-1.0,
"portion_g":grams,"calories":kcal,"protein_g":g,"carbs_g":g,"fat_g":g}],
"alternatives":["other plausible dish names"]}

Rules:
- Nutrition numbers are totals for the portion visible, not per 100 g.
- Estimate portion size from plate and utensil scale; be realistic.
- Use common Gulf/Levantine dish names when they apply (machboos, shawarma, luqaimat, harees).
- If the photo shows no food, return {"items":[],"alternatives":[]}.
"""


class VisionLLMAnalyzer(Analyzer):
    """Any OpenAI-compatible chat-completions endpoint with image input.

    Covers OpenAI itself and hosted Qwen-VL / Llava deployments, which differ only
    by base URL and model name.
    """

    def __init__(self, name: str, api_key: str, base_url: str, model: str) -> None:
        self.name = name
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._model = model

    async def analyze(self, image_bytes: bytes) -> AnalyzeResult:
        data_url = "data:image/jpeg;base64," + base64.b64encode(image_bytes).decode()
        payload = {
            "model": self._model,
            "temperature": 0,
            "max_tokens": 600,
            "response_format": {"type": "json_object"},
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {"url": data_url, "detail": "low"},
                        },
                    ],
                }
            ],
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self._base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self._api_key}"},
                json=payload,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]

        parsed = json.loads(content)
        items = [self._to_item(raw) for raw in parsed.get("items", [])]
        alternatives = [str(alt) for alt in parsed.get("alternatives", [])][:4]
        return AnalyzeResult(items=items, alternatives=alternatives, analyzer=self.name)

    @staticmethod
    def _to_item(raw: dict) -> FoodItem:
        name = str(raw.get("name") or "food")
        return FoodItem(
            name=name,
            name_ar=str(raw.get("name_ar") or nutrition.arabic_name(name)),
            confidence=float(raw.get("confidence") or 0.0),
            portion_g=float(raw.get("portion_g") or 100.0),
            calories=round(float(raw.get("calories") or 0.0), 1),
            protein_g=round(float(raw.get("protein_g") or 0.0), 1),
            carbs_g=round(float(raw.get("carbs_g") or 0.0), 1),
            fat_g=round(float(raw.get("fat_g") or 0.0), 1),
        )
