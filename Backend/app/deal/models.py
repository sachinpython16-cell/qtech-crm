from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class InquiryDeal(Base):
    __tablename__ = "deals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    company_id = Column(
        Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    contact_person_id = Column(
        Integer, ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title = Column(String(255), nullable=False)
    deal_type = Column(String(50), default="Inquiry", nullable=False)
    description = Column(Text, nullable=True)
    date_received = Column(Date, nullable=False)
    status = Column(String(50), default="New", nullable=False, index=True)
    priority = Column(String(20), default="Medium", nullable=False)
    current_follow_up_stage = Column(
        String(50), default="First Follow-Up", nullable=False
    )
    next_follow_up_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    closed_date = Column(Date, nullable=True)
    lost_reason = Column(Text, nullable=True)

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
    company = relationship("Company", back_populates="deals")
    contact_person = relationship("ContactPerson", back_populates="deals")
    follow_ups = relationship(
        "FollowUpRecord", back_populates="deal", cascade="all, delete-orphan"
    )
    interactions = relationship("InteractionLog", back_populates="deal")
