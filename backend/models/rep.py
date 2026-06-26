# backend/models/rep.py

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import uuid


class Rep(Base):
    __tablename__ = "reps"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id  = Column(UUID(as_uuid=True), ForeignKey("workout_sessions.id"), nullable=False)
    rep_number  = Column(Integer, nullable=False)
    form_score  = Column(Float, nullable=True)
    issues      = Column(ARRAY(String), nullable=True)   # _text in Supabase = text[]
    recorded_at = Column(DateTime, nullable=True)

    session     = relationship("Session", back_populates="reps")