# backend/schemas/workout.py

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# ── Session schemas ────────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    exercise: str = Field(..., example="squat")


class SessionResponse(BaseModel):
    id:             UUID
    user_id:        UUID
    exercise:       str
    started_at:     Optional[datetime]
    ended_at:       Optional[datetime]
    total_reps:     Optional[int]
    avg_form_score: Optional[float]
    llm_feedback:   Optional[str]

    class Config:
        from_attributes = True


# ── Rep schemas ────────────────────────────────────────────────────────────────

class RepCreate(BaseModel):
    session_id:  UUID
    rep_number:  int   = Field(..., ge=1)
    form_score:  Optional[float] = Field(None, ge=0.0, le=1.0)
    issues:      Optional[List[str]] = []  # matches 'violations' from WebSocket payload


class RepResponse(BaseModel):
    id:          UUID
    session_id:  UUID
    rep_number:  int
    form_score:  Optional[float]
    issues:      Optional[List[str]]
    recorded_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Session end schema ─────────────────────────────────────────────────────────

class SessionEnd(BaseModel):
    """Sent when user finishes workout. Updates aggregates."""
    total_reps:     int
    avg_form_score: Optional[float]
    
    
# ── Analytics Schemas ──────────────────────────────────────────────────────────

class AnalyticsSummary(BaseModel):
    total_sessions: int
    total_reps: int
    avg_form_score: float
    best_exercise: Optional[str]

class SessionHistory(BaseModel):
    session_id: UUID
    exercise: str
    total_reps: int
    avg_form_score: Optional[float]
    date: datetime

    class Config:
        from_attributes = True

class RepDetail(BaseModel):
    rep_number: int
    form_score: Optional[float]
    issues: Optional[List[str]]

    class Config:
        from_attributes = True
        
# ── Leaderboard + Coaching Schemas ────────────────────────────────────────────

class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    weekly_reps: int
    avg_form: Optional[float]

class PostSetRequest(BaseModel):
    exercise: str
    reps: int
    avg_form_score: float
    issues: List[str]