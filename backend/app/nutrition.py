"""Nutrition reference table: values per 100 g.

Used to price a dish when the analyzer only returns a label (local classifier mode),
to sanity-check values returned by a vision model, and to supply Arabic dish names.
"""

from dataclasses import dataclass

import httpx

from .config import settings

OPEN_FOOD_FACTS_SEARCH = "https://world.openfoodfacts.org/cgi/search.pl"


@dataclass(frozen=True)
class NutritionFacts:
    name: str
    name_ar: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    typical_portion_g: float


def _f(
    name: str,
    name_ar: str,
    kcal: float,
    protein: float,
    carbs: float,
    fat: float,
    portion: float,
) -> tuple[str, NutritionFacts]:
    return name, NutritionFacts(name, name_ar, kcal, protein, carbs, fat, portion)


TABLE: dict[str, NutritionFacts] = dict(
    [
        # Emirati / Levantine / Gulf
        _f("machboos", "مجبوس", 168, 11.0, 20.0, 4.8, 350),
        _f("biryani", "برياني", 175, 9.0, 23.0, 5.5, 350),
        _f("shawarma", "شاورما", 215, 15.0, 17.0, 10.0, 250),
        _f("falafel", "فلافل", 333, 13.3, 31.8, 17.8, 120),
        _f("hummus", "حمص", 166, 7.9, 14.3, 9.6, 100),
        _f("mutabbal", "متبل", 130, 3.0, 10.0, 9.0, 100),
        _f("tabbouleh", "تبولة", 120, 2.5, 13.0, 7.0, 150),
        _f("fattoush", "فتوش", 105, 2.2, 11.0, 6.5, 150),
        _f("kebab", "كباب", 240, 20.0, 3.0, 16.0, 200),
        _f("shish tawook", "شيش طاووق", 165, 27.0, 2.0, 5.5, 220),
        _f("mandi", "مندي", 180, 12.0, 22.0, 5.0, 350),
        _f("harees", "هريس", 130, 7.0, 18.0, 3.0, 250),
        _f("luqaimat", "لقيمات", 380, 4.0, 55.0, 16.0, 90),
        _f("balaleet", "بلاليط", 260, 6.0, 40.0, 8.0, 200),
        _f("khameer bread", "خمير", 280, 8.0, 50.0, 5.0, 90),
        _f("manakish zaatar", "مناقيش زعتر", 290, 7.0, 38.0, 12.0, 120),
        _f("foul medames", "فول مدمس", 110, 7.6, 15.0, 2.5, 200),
        _f("kunafa", "كنافة", 350, 6.0, 42.0, 18.0, 120),
        _f("baklava", "بقلاوة", 430, 6.0, 48.0, 24.0, 60),
        _f("dates", "تمر", 282, 2.5, 75.0, 0.4, 40),
        _f("arabic coffee", "قهوة عربية", 2, 0.1, 0.3, 0.0, 60),
        _f("karak tea", "كرك", 90, 2.5, 13.0, 3.0, 150),
        # Everyday international
        _f("grilled chicken breast", "صدر دجاج مشوي", 165, 31.0, 0.0, 3.6, 150),
        _f("fried chicken", "دجاج مقلي", 290, 22.0, 11.0, 18.0, 150),
        _f("beef steak", "ستيك لحم", 271, 25.0, 0.0, 19.0, 200),
        _f("salmon", "سلمون", 208, 20.0, 0.0, 13.0, 150),
        _f("grilled fish", "سمك مشوي", 140, 24.0, 0.0, 4.5, 180),
        _f("shrimp", "روبيان", 99, 24.0, 0.2, 0.3, 150),
        _f("white rice", "أرز أبيض", 130, 2.7, 28.0, 0.3, 200),
        _f("brown rice", "أرز بني", 123, 2.7, 26.0, 1.0, 200),
        _f("pasta", "معكرونة", 158, 5.8, 31.0, 0.9, 250),
        _f("pizza", "بيتزا", 266, 11.0, 33.0, 10.0, 250),
        _f("burger", "برغر", 295, 17.0, 24.0, 14.0, 250),
        _f("french fries", "بطاطس مقلية", 312, 3.4, 41.0, 15.0, 130),
        _f("caesar salad", "سلطة سيزر", 190, 6.0, 7.0, 15.0, 200),
        _f("green salad", "سلطة خضراء", 45, 1.5, 6.0, 2.0, 180),
        _f("sandwich", "ساندويتش", 250, 12.0, 30.0, 9.0, 200),
        _f("omelette", "أومليت", 154, 11.0, 1.0, 12.0, 150),
        _f("scrambled eggs", "بيض مخفوق", 149, 10.0, 1.6, 11.0, 120),
        _f("boiled egg", "بيض مسلوق", 155, 13.0, 1.1, 11.0, 100),
        _f("pancakes", "بان كيك", 227, 6.4, 28.0, 9.7, 150),
        _f("oatmeal", "شوفان", 71, 2.5, 12.0, 1.5, 250),
        _f("cereal with milk", "حبوب مع حليب", 105, 4.0, 18.0, 2.0, 250),
        _f("croissant", "كرواسون", 406, 8.2, 45.8, 21.0, 60),
        _f("toast", "خبز محمص", 265, 9.0, 49.0, 3.2, 60),
        _f("soup", "شوربة", 55, 3.0, 7.0, 1.8, 300),
        _f("lentil soup", "شوربة عدس", 90, 5.5, 13.0, 1.5, 300),
        _f("sushi", "سوشي", 145, 6.0, 28.0, 1.5, 200),
        _f("noodles", "نودلز", 138, 4.5, 25.0, 2.0, 250),
        _f("wrap", "راب", 230, 11.0, 27.0, 9.0, 220),
        _f("cheese", "جبن", 350, 25.0, 2.0, 27.0, 40),
        _f("yogurt", "لبن زبادي", 61, 3.5, 4.7, 3.3, 170),
        _f("labneh", "لبنة", 174, 8.0, 6.0, 13.0, 100),
        _f("milk", "حليب", 62, 3.2, 4.8, 3.3, 250),
        _f("banana", "موز", 89, 1.1, 23.0, 0.3, 120),
        _f("apple", "تفاح", 52, 0.3, 14.0, 0.2, 180),
        _f("orange", "برتقال", 47, 0.9, 12.0, 0.1, 150),
        _f("watermelon", "بطيخ", 30, 0.6, 8.0, 0.2, 280),
        _f("mango", "مانجو", 60, 0.8, 15.0, 0.4, 200),
        _f("grapes", "عنب", 69, 0.7, 18.0, 0.2, 150),
        _f("mixed nuts", "مكسرات", 607, 20.0, 21.0, 54.0, 30),
        _f("chocolate bar", "لوح شوكولاتة", 546, 5.0, 61.0, 31.0, 45),
        _f("ice cream", "آيس كريم", 207, 3.5, 24.0, 11.0, 100),
        _f("cake", "كيك", 350, 5.0, 50.0, 14.0, 100),
        _f("donut", "دونات", 452, 4.9, 51.0, 25.0, 60),
        _f("cookies", "كوكيز", 480, 5.5, 64.0, 22.0, 40),
        _f("potato chips", "شيبس", 536, 7.0, 53.0, 34.0, 30),
        _f("popcorn", "فشار", 387, 13.0, 78.0, 4.5, 30),
        _f("soft drink", "مشروب غازي", 42, 0.0, 10.6, 0.0, 330),
        _f("orange juice", "عصير برتقال", 45, 0.7, 10.4, 0.2, 250),
        _f("smoothie", "سموذي", 70, 1.5, 15.0, 0.8, 300),
        _f("protein shake", "بروتين شيك", 52, 8.0, 3.5, 1.0, 300),
        _f("black coffee", "قهوة سادة", 2, 0.1, 0.3, 0.0, 240),
    ]
)

_ALIASES = {
    "kabsa": "machboos",
    "kabsah": "machboos",
    "majboos": "machboos",
    "chicken biryani": "biryani",
    "chicken shawarma": "shawarma",
    "beef shawarma": "shawarma",
    "baba ganoush": "mutabbal",
    "chips": "french fries",
    "fries": "french fries",
    "hamburger": "burger",
    "cheeseburger": "burger",
    "steak": "beef steak",
    "rice": "white rice",
    "spaghetti": "pasta",
    "salad": "green salad",
    "eggs": "scrambled eggs",
    "coffee": "black coffee",
    "tea": "karak tea",
    "soda": "soft drink",
    "cola": "soft drink",
    "nuts": "mixed nuts",
    "chocolate": "chocolate bar",
}


def _normalize(label: str) -> str:
    return label.strip().lower().replace("_", " ").replace("-", " ")


def lookup(label: str) -> NutritionFacts | None:
    """Best-effort local match for a dish label."""
    key = _normalize(label)
    if key in TABLE:
        return TABLE[key]
    if key in _ALIASES:
        return TABLE[_ALIASES[key]]
    for known in TABLE:
        if known in key or key in known:
            return TABLE[known]
    tokens = set(key.split())
    best: tuple[int, NutritionFacts] | None = None
    for known, facts in TABLE.items():
        overlap = len(tokens & set(known.split()))
        if overlap and (best is None or overlap > best[0]):
            best = (overlap, facts)
    return best[1] if best else None


async def lookup_remote(label: str) -> NutritionFacts | None:
    """Fallback to Open Food Facts (free, no API key) for foods missing from the table."""
    params = {
        "search_terms": label,
        "search_simple": 1,
        "action": "process",
        "json": 1,
        "page_size": 1,
        "fields": "product_name,nutriments",
    }
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            response = await client.get(OPEN_FOOD_FACTS_SEARCH, params=params)
            response.raise_for_status()
            products = response.json().get("products") or []
    except (httpx.HTTPError, ValueError):
        return None
    if not products:
        return None
    nutriments = products[0].get("nutriments") or {}
    calories = nutriments.get("energy-kcal_100g")
    if calories is None:
        return None
    return NutritionFacts(
        name=products[0].get("product_name") or label,
        name_ar="",
        calories=float(calories),
        protein_g=float(nutriments.get("proteins_100g") or 0.0),
        carbs_g=float(nutriments.get("carbohydrates_100g") or 0.0),
        fat_g=float(nutriments.get("fat_100g") or 0.0),
        typical_portion_g=100.0,
    )


def arabic_name(label: str) -> str:
    facts = lookup(label)
    return facts.name_ar if facts else ""


__all__ = ["NutritionFacts", "TABLE", "lookup", "lookup_remote", "arabic_name", "settings"]
