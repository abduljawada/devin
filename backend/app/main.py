import json
from datetime import date, timedelta

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import db, images, nutrition
from .analyzers import get_analyzer
from .config import settings
from .schemas import AnalyzeResult, DaySummary, Entry, EntryCreate, MacroTotals, Profile

app = FastAPI(title="SnapCal API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    db.init()
    settings.media_dir.mkdir(parents=True, exist_ok=True)
    settings.cache_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/media", StaticFiles(directory=settings.media_dir), name="media")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "analyzer": get_analyzer().name}


@app.post("/analyze", response_model=AnalyzeResult)
async def analyze(photo: UploadFile = File(...)) -> AnalyzeResult:
    raw = await photo.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty upload")
    try:
        prepared = images.prepare(raw)
    except OSError as exc:
        raise HTTPException(status_code=400, detail="Unreadable image") from exc

    digest = images.fingerprint(prepared)
    photo_url = images.store(prepared, digest)
    cache_path = settings.cache_dir / f"{digest}.json"

    if cache_path.exists():
        result = AnalyzeResult.model_validate(json.loads(cache_path.read_text()))
        result.cached = True
        result.photo_url = photo_url
        return result

    analyzer = get_analyzer()
    try:
        result = await analyzer.analyze(prepared)
    except Exception as exc:  # noqa: BLE001 - surfaced to the client as 502
        raise HTTPException(status_code=502, detail=f"Analyzer failed: {exc}") from exc

    result.photo_url = photo_url
    cache_path.write_text(result.model_dump_json())
    return result


@app.get("/foods")
def foods(q: str = "") -> list[dict[str, object]]:
    """Manual search fallback when the camera guess is wrong."""
    query = q.strip().lower()
    matches = [
        facts
        for name, facts in nutrition.TABLE.items()
        if not query or query in name or query in facts.name_ar
    ]
    return [
        {
            "name": facts.name,
            "name_ar": facts.name_ar,
            "calories_per_100g": facts.calories,
            "protein_g_per_100g": facts.protein_g,
            "carbs_g_per_100g": facts.carbs_g,
            "fat_g_per_100g": facts.fat_g,
            "typical_portion_g": facts.typical_portion_g,
        }
        for facts in matches[:40]
    ]


@app.post("/entries", response_model=Entry, status_code=201)
def create_entry(payload: EntryCreate) -> Entry:
    return db.add_entry(payload)


@app.get("/entries", response_model=list[Entry])
def read_entries(day: date | None = None) -> list[Entry]:
    return db.list_entries(day or date.today())


@app.delete("/entries/{entry_id}", status_code=204)
def remove_entry(entry_id: int) -> None:
    if not db.delete_entry(entry_id):
        raise HTTPException(status_code=404, detail="Entry not found")


@app.get("/summary", response_model=DaySummary)
def summary(day: date | None = None) -> DaySummary:
    target = day or date.today()
    totals, count = db.totals_for(target)
    profile = db.get_profile()
    goal = MacroTotals(
        calories=profile.calorie_goal,
        protein_g=profile.protein_goal_g,
        carbs_g=profile.carbs_goal_g,
        fat_g=profile.fat_goal_g,
    )
    return DaySummary(day=target, totals=totals, goal=goal, entry_count=count)


@app.get("/history")
def history(days: int = 7) -> list[dict[str, object]]:
    days = max(1, min(days, 31))
    end = date.today()
    start = end - timedelta(days=days - 1)
    by_day = db.calories_between(start, end)
    goal = db.get_profile().calorie_goal
    return [
        {
            "day": (start + timedelta(days=offset)).isoformat(),
            "calories": by_day.get((start + timedelta(days=offset)).isoformat(), 0.0),
            "goal": goal,
        }
        for offset in range(days)
    ]


@app.get("/profile", response_model=Profile)
def read_profile() -> Profile:
    return db.get_profile()


@app.put("/profile", response_model=Profile)
def write_profile(profile: Profile) -> Profile:
    return db.save_profile(profile)
