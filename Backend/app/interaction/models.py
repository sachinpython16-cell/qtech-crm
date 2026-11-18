from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class InteractionLog(Base):
    __tablename__ = "interactions"

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
    inquiry_deal_id = Column(
        Integer, ForeignKey("deals.id", ondelete="SET NULL"), nullable=True, index=True
    )
    date = Column(Date, nullable=False, index=True)
    interaction_type = Column(
        String(50), default="Status Update", nullable=False
    )  # 'Inquiry Received', 'Project Kickoff', 'Milestone Review', 'Project Completed', 'Follow-Up Call', 'Email Thread', 'Status Update', 'Client Review'
    title = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    logged_by = Column(String(100), default="Team Member", nullable=False)

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    company = relationship("Company", back_populates="interactions")
    deal = relationship("InquiryDeal", back_populates="interactions")
