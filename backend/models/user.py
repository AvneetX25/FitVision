import uuid
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from database import Base

class User(Base):
       __tablename__ = "users"
       id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
       username = Column(String(50), unique=True, nullable=False)
       email = Column(String(120), unique=True, nullable=False)
       password_hash = Column(String, nullable=False)
       created_at = Column(DateTime, server_default=func.now())