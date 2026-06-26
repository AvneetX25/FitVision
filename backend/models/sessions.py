# backend/models/session.py

from sqlalchemy import Column, ForeignKey, String, Float, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import uuid


class Session(Base):
    __tablename__ = "workout_sessions"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    exercise       = Column(String, nullable=False)
    started_at     = Column(DateTime, nullable=True)
    ended_at       = Column(DateTime, nullable=True)
    total_reps     = Column(Integer, default=0)
    avg_form_score = Column(Float, nullable=True)
    llm_feedback   = Column(Text, nullable=True)

    reps           = relationship("Rep", back_populates="session")