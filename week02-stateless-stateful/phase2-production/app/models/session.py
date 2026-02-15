"""Session model for Phase 2 production"""

from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()


class Session(Base):
    """Session model for stateful server operations"""
    
    __tablename__ = "sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_data = Column(JSON, default=dict)
    visit_count = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationship to User model
    user = relationship("User", backref="sessions")
    
    def __repr__(self):
        return f"<Session(id='{self.id}', user_id={self.user_id}, active={self.is_active})>"
    
    def to_dict(self):
        """Convert session to dictionary for API responses"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "session_data": self.session_data or {},
            "visit_count": self.visit_count,
            "is_active": self.is_active,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def is_expired(self):
        """Check if session has expired"""
        from datetime import timezone
        if not self.expires_at:
            return False
        return datetime.now(timezone.utc) > self.expires_at
    
    def increment_visit(self):
        """Increment visit counter"""
        self.visit_count += 1
        self.updated_at = func.now()
    
    def update_data(self, new_data):
        """Update session data"""
        if self.session_data:
            self.session_data.update(new_data)
        else:
            self.session_data = new_data
        self.updated_at = func.now()
    
    def extend_expiry(self, minutes=30):
        """Extend session expiry by specified minutes"""
        from datetime import timedelta, timezone
        if self.expires_at:
            self.expires_at = self.expires_at + timedelta(minutes=minutes)
        else:
            self.expires_at = datetime.now(timezone.utc) + timedelta(minutes=minutes)
        self.updated_at = func.now()
