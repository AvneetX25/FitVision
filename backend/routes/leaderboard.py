from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List

from database import get_db
from schemas.workout import LeaderboardEntry

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


# ── GET /leaderboard/weekly — public, no auth required ────────────────────────
@router.get("/weekly", response_model=List[LeaderboardEntry])
async def get_weekly_leaderboard(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("""
            SELECT username, weekly_reps, avg_form
            FROM weekly_leaderboard
            ORDER BY weekly_reps DESC
            LIMIT 10
        """)
    )
    rows = result.fetchall()

    return [
        LeaderboardEntry(
            rank=index + 1,
            username=row.username,
            weekly_reps=row.weekly_reps or 0,
            avg_form=float(row.avg_form) if row.avg_form is not None else None,
        )
        for index, row in enumerate(rows)
    ]