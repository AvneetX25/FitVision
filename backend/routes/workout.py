# backend/routes/workout.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
from uuid import UUID

from database import get_db
from models.sessions import Session
from models.rep import Rep
from schemas.workout import (
    SessionCreate, SessionResponse,
    RepCreate,     RepResponse,
    SessionEnd,
)
from services.auth_service import get_current_user
from services.llm_service import generate_session_start
from services.llm_service import stream_post_set_coaching


router = APIRouter(prefix="/workout", tags=["workout"])


# ── Sessions ───────────────────────────────────────────────────────────────────

@router.post(
    "/sessions",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_session(
    payload: SessionCreate,
    db:      AsyncSession = Depends(get_db),
    user_id: str          = Depends(get_current_user),
):
    session = Session(
        user_id    = user_id,
        exercise   = payload.exercise,
        started_at = datetime.utcnow(),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get(
    "/sessions",
    response_model=List[SessionResponse],
)
async def list_sessions(
    db:      AsyncSession = Depends(get_db),
    user_id: str          = Depends(get_current_user),
):
    result = await db.execute(
        select(Session)
        .where(Session.user_id == user_id)
        .order_by(Session.started_at.desc())
    )
    return result.scalars().all()


@router.patch(
    "/sessions/{session_id}/end",
    response_model=SessionResponse,
)
async def end_session(
    session_id: UUID,
    payload:    SessionEnd,
    db:         AsyncSession = Depends(get_db),
    user_id:    str          = Depends(get_current_user),
):
    result = await db.execute(
        select(Session).where(
            Session.id      == session_id,
            Session.user_id == user_id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.ended_at       = datetime.utcnow()
    session.total_reps     = payload.total_reps
    session.avg_form_score = payload.avg_form_score

    await db.commit()
    await db.refresh(session)
    return session


# ── Reps ───────────────────────────────────────────────────────────────────────

@router.post(
    "/reps",
    response_model=RepResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_rep(
    payload: RepCreate,
    db:      AsyncSession = Depends(get_db),
    user_id: str          = Depends(get_current_user),
):
    # Verify session belongs to this user
    result = await db.execute(
        select(Session).where(
            Session.id      == payload.session_id,
            Session.user_id == user_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=404,
            detail="Session not found or does not belong to you",
        )

    rep = Rep(
        session_id  = payload.session_id,
        rep_number  = payload.rep_number,
        form_score  = payload.form_score,
        issues      = payload.issues or [],
        recorded_at = datetime.utcnow(),
    )
    db.add(rep)
    await db.commit()
    await db.refresh(rep)
    return rep


@router.get(
    "/sessions/{session_id}/reps",
    response_model=List[RepResponse],
)
async def get_session_reps(
    session_id: UUID,
    db:         AsyncSession = Depends(get_db),
    user_id:    str          = Depends(get_current_user),
):
    result = await db.execute(
        select(Session).where(
            Session.id      == session_id,
            Session.user_id == user_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Session not found")

    result = await db.execute(
        select(Rep)
        .where(Rep.session_id == session_id)
        .order_by(Rep.rep_number)
    )
    return result.scalars().all()

# ── LLM Voice Lines ────────────────────────────────────────────────────────────

@router.get("/voice/start")
async def voice_start(
    user_id: str = Depends(get_current_user),
):
    line = await generate_session_start()
    return {"line": line}


@router.post("/voice/end")
async def voice_end(
    payload: SessionEnd,
    user_id: str = Depends(get_current_user),
):
    line = await stream_post_set_coaching(
        reps       = payload.total_reps or 0,
        avg_form_score = payload.avg_form_score or 1.0,
    )
    return {"line": line}
