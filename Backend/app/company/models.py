from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String(255), nullable=False, index=True)
    industry = Column(String(100), default="General Enterprise", nullable=False)
    relationship_status = Column(
        String(50), default="prospect", nullable=False, index=True
    )  # 'active', 'previous', 'prospect'
    location = Column(String(255), default="Global / Remote", nullable=False)
    website = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    first_engaged_date = Column(Date, nullable=True)
    last_interaction_date = Column(Date, nullable=True)

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=True,
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    contacts = relationship(
        "ContactPerson", back_populates="company", cascade="all, delete-orphan"
    )
    deals = relationship(
        "InquiryDeal", back_populates="company", cascade="all, delete-orphan"
    )
    follow_ups = relationship(
        "FollowUpRecord", back_populates="company", cascade="all, delete-orphan"
    )
    interactions = relationship(
        "InteractionLog", back_populates="company", cascade="all, delete-orphan"
    )
