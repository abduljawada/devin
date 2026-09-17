import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import date

from .config import settings
from .schemas import Entry, EntryCreate, MacroTotals, Profile

SCHEMA = """
CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL DEFAULT '',
    portion_g REAL NOT NULL DEFAULT 100,
    calories REAL NOT NULL DEFAULT 0,
    protein_g REAL NOT NULL DEFAULT 0,
    carbs_g REAL NOT NULL DEFAULT 0,
    fat_g REAL NOT NULL DEFAULT 0,
    meal TEXT NOT NULL DEFAULT 'snack',
    photo_url TEXT,
    logged_on TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_entries_logged_on ON entries(logged_on);

CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    calorie_goal REAL NOT NULL DEFAULT 2000,
    protein_goal_g REAL NOT NULL DEFAULT 130,
    carbs_goal_g REAL NOT NULL DEFAULT 220,
    fat_goal_g REAL NOT NULL DEFAULT 65,
    locale TEXT NOT NULL DEFAULT 'en'
);
INSERT OR IGNORE INTO profile (id) VALUES (1);
"""


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(settings.database_path)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def init() -> None:
    settings.database_path.parent.mkdir(parents=True, exist_ok=True)
    with connect() as connection:
        connection.executescript(SCHEMA)


def _to_entry(row: sqlite3.Row) -> Entry:
    return Entry(
        id=row["id"],
        name=row["name"],
        name_ar=row["name_ar"],
        portion_g=row["portion_g"],
        calories=row["calories"],
        protein_g=row["protein_g"],
        carbs_g=row["carbs_g"],
        fat_g=row["fat_g"],
        meal=row["meal"],
        photo_url=row["photo_url"],
        logged_on=date.fromisoformat(row["logged_on"]),
        created_at=row["created_at"],
    )


def add_entry(payload: EntryCreate) -> Entry:
    day = payload.logged_on or date.today()
    with connect() as connection:
        cursor = connection.execute(
            """
            INSERT INTO entries
                (name, name_ar, portion_g, calories, protein_g, carbs_g, fat_g, meal, photo_url, logged_on)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.name,
                payload.name_ar,
                payload.portion_g,
                payload.calories,
                payload.protein_g,
                payload.carbs_g,
                payload.fat_g,
                payload.meal,
                payload.photo_url,
                day.isoformat(),
            ),
        )
        row = connection.execute(
            "SELECT * FROM entries WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return _to_entry(row)


def list_entries(day: date) -> list[Entry]:
    with connect() as connection:
        rows = connection.execute(
            "SELECT * FROM entries WHERE logged_on = ? ORDER BY id DESC",
            (day.isoformat(),),
        ).fetchall()
    return [_to_entry(row) for row in rows]


def delete_entry(entry_id: int) -> bool:
    with connect() as connection:
        cursor = connection.execute("DELETE FROM entries WHERE id = ?", (entry_id,))
    return cursor.rowcount > 0


def totals_for(day: date) -> tuple[MacroTotals, int]:
    with connect() as connection:
        row = connection.execute(
            """
            SELECT COALESCE(SUM(calories), 0) AS calories,
                   COALESCE(SUM(protein_g), 0) AS protein_g,
                   COALESCE(SUM(carbs_g), 0) AS carbs_g,
                   COALESCE(SUM(fat_g), 0) AS fat_g,
                   COUNT(*) AS entry_count
            FROM entries WHERE logged_on = ?
            """,
            (day.isoformat(),),
        ).fetchone()
    totals = MacroTotals(
        calories=round(row["calories"], 1),
        protein_g=round(row["protein_g"], 1),
        carbs_g=round(row["carbs_g"], 1),
        fat_g=round(row["fat_g"], 1),
    )
    return totals, row["entry_count"]


def calories_between(start: date, end: date) -> dict[str, float]:
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT logged_on, COALESCE(SUM(calories), 0) AS calories
            FROM entries WHERE logged_on BETWEEN ? AND ?
            GROUP BY logged_on
            """,
            (start.isoformat(), end.isoformat()),
        ).fetchall()
    return {row["logged_on"]: round(row["calories"], 1) for row in rows}


def get_profile() -> Profile:
    with connect() as connection:
        row = connection.execute("SELECT * FROM profile WHERE id = 1").fetchone()
    return Profile(
        calorie_goal=row["calorie_goal"],
        protein_goal_g=row["protein_goal_g"],
        carbs_goal_g=row["carbs_goal_g"],
        fat_goal_g=row["fat_goal_g"],
        locale=row["locale"],
    )


def save_profile(profile: Profile) -> Profile:
    with connect() as connection:
        connection.execute(
            """
            UPDATE profile SET calorie_goal = ?, protein_goal_g = ?, carbs_goal_g = ?,
                               fat_goal_g = ?, locale = ?
            WHERE id = 1
            """,
            (
                profile.calorie_goal,
                profile.protein_goal_g,
                profile.carbs_goal_g,
                profile.fat_goal_g,
                profile.locale,
            ),
        )
    return get_profile()
