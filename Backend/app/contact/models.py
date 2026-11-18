from sqlalchemy import Column, Integer, String, Text, Boolean, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class ContactPerson(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(
        Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String(255), nullable=False, index=True)
    designation = Column(String(150), default="Contact Person", nullable=False)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True, index=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    last_contacted_date = Column(Date, nullable=True)

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
    company = relationship("Company", back_populates="contacts")
    deals = relationship("InquiryDeal", back_populates="contact_person")
    follow_ups = relationship("FollowUpRecord", back_populates="contact_person")
