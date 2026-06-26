from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from uuid import UUID

from database import get_db
from models.sessions import Session
from models.rep import Rep
from schemas.workout import AnalyticsSummary, SessionHistory, RepDetail
from services.auth_service import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


# ── GET /analytics/summary ─────────────────────────────────────────────────────
@router.get("/summary", response_model=AnalyticsSummary)
async def get_summary(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    # Total sessions
    sessions_result = await db.execute(
        select(func.count(Session.id)).where(
            Session.user_id == user_id,
            Session.ended_at != None,
            Session.total_reps > 0,
        )
    )
    total_sessions = sessions_result.scalar() or 0

    # Total reps + avg form score across all sessions
    stats_result = await db.execute(
        select(
            func.coalesce(func.sum(Session.total_reps), 0),
            func.coalesce(func.avg(Session.avg_form_score), 0.0),
        ).where(
            Session.user_id == user_id,
            Session.ended_at != None,
            Session.total_reps > 0,
            )
    )
    total_reps, avg_form_score = stats_result.one()

    # Best exercise = exercise with most total reps
    best_result = await db.execute(
        select(Session.exercise, func.sum(Session.total_reps).label("reps"))
        .where(Session.user_id == user_id)
        .group_by(Session.exercise)
        .order_by(func.sum(Session.total_reps).desc())
        .limit(1)
    )
    best_row = best_result.first()
    best_exercise = best_row[0] if best_row else None

    return AnalyticsSummary(
        total_sessions=total_sessions,
        total_reps=int(total_reps),
        avg_form_score=round(float(avg_form_score), 3),
        best_exercise=best_exercise,
    )


# ── GET /analytics/history?limit=7 ────────────────────────────────────────────
@router.get("/history", response_model=List[SessionHistory])
async def get_history(
    limit: int = Query(default=7, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(Session)
        .where(
            Session.user_id == user_id,
            Session.ended_at != None,        # only completed sessions
        )
        .order_by(Session.started_at.desc())
        .limit(limit)
    )
    sessions = result.scalars().all()

    return [
        SessionHistory(
            session_id=s.id,
            exercise=s.exercise,
            total_reps=s.total_reps or 0,
            avg_form_score=s.avg_form_score,
            date=s.started_at,
        )
        for s in sessions
    ]


# ── GET /analytics/session/{session_id}/reps ──────────────────────────────────
@router.get("/session/{session_id}/reps", response_model=List[RepDetail])
async def get_session_rep_details(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    # Ownership check — user can only see their own session reps
    session_result = await db.execute(
        select(Session).where(
            Session.id == session_id,
            Session.user_id == user_id,
        )
    )
    if not session_result.scalar_one_or_none():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Session not found")

    reps_result = await db.execute(
        select(Rep)
        .where(Rep.session_id == session_id)
        .order_by(Rep.rep_number)
    )
    return reps_result.scalars().all()