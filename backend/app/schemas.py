from datetime import date

from pydantic import BaseModel, Field


class FoodItem(BaseModel):
    name: str
    name_ar: str = ""
    confidence: float = 0.0
    portion_g: float = 100.0
    calories: float = 0.0
    protein_g: float = 0.0
    carbs_g: float = 0.0
    fat_g: float = 0.0


class AnalyzeResult(BaseModel):
    items: list[FoodItem]
    alternatives: list[str] = Field(default_factory=list)
    analyzer: str = "mock"
    cached: bool = False
    photo_url: str | None = None


class EntryCreate(BaseModel):
    name: str
    name_ar: str = ""
    portion_g: float = 100.0
    calories: float = 0.0
    protein_g: float = 0.0
    carbs_g: float = 0.0
    fat_g: float = 0.0
    meal: str = "snack"
    photo_url: str | None = None
    logged_on: date | None = None


class Entry(EntryCreate):
    id: int
    logged_on: date
    created_at: str


class MacroTotals(BaseModel):
    calories: float = 0.0
    protein_g: float = 0.0
    carbs_g: float = 0.0
    fat_g: float = 0.0


class DaySummary(BaseModel):
    day: date
    totals: MacroTotals
    goal: MacroTotals
    entry_count: int


class Profile(BaseModel):
    calorie_goal: float = 2000
    protein_goal_g: float = 130
    carbs_goal_g: float = 220
    fat_goal_g: float = 65
    locale: str = "en"
