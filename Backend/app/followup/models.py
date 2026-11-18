from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class FollowUpRecord(Base):
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    inquiry_deal_id = Column(
        Integer, ForeignKey("deals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    company_id = Column(
        Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    contact_person_id = Column(
        Integer, ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    sequence = Column(
        String(50), default="First Follow-Up", nullable=False
    )  # 'First Follow-Up', 'Second Follow-Up', 'Third Follow-Up', 'Additional Follow-Up'
    status = Column(
        String(50), default="Pending", nullable=False, index=True
    )  # 'Pending', 'Completed', 'Overdue', 'Rescheduled'
    scheduled_date = Column(Date, nullable=False, index=True)
    completed_date = Column(Date, nullable=True)
    performed_by = Column(String(100), default="Account Lead", nullable=False)
    channel = Column(
        String(50), default="Phone Call", nullable=False
    )  # 'Email', 'Phone Call', 'Video Meeting', 'In-Person', 'Direct Message'
    notes = Column(Text, nullable=True)
    outcome = Column(Text, nullable=True)
    next_follow_up_date = Column(Date, nullable=True)

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=True,
    )

    # Relationships
    deal = relationship("InquiryDeal", back_populates="follow_ups")
    company = relationship("Company", back_populates="follow_ups")
    contact_person = relationship("ContactPerson", back_populates="follow_ups")
