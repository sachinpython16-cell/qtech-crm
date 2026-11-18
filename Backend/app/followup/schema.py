from datetime import date, datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, ConfigDict, Field

FollowUpSequence = Literal[
    "First Follow-Up",
    "Second Follow-Up",
    "Third Follow-Up",
    "Additional Follow-Up",
]
FollowUpStatus = Literal["Pending", "Completed", "Overdue", "Rescheduled"]
FollowUpChannel = Literal[
    "Email", "Phone Call", "Video Meeting", "In-Person", "Direct Message"
]


class FollowUpBase(BaseModel):
    inquiry_deal_id: int
    company_id: int
    contact_person_id: Optional[int] = None
    sequence: FollowUpSequence = "First Follow-Up"
    scheduled_date: date
    performed_by: str = Field(default="Account Lead", max_length=100)
    channel: FollowUpChannel = "Phone Call"
    notes: Optional[str] = None


class FollowUpCreate(FollowUpBase):
    pass


class FollowUpComplete(BaseModel):
    outcome: str = Field(..., min_length=1)
    notes: Optional[str] = None
    schedule_next: bool = False
    next_date: Optional[date] = None
    next_channel: Optional[FollowUpChannel] = "Email"


class FollowUpReschedule(BaseModel):
    scheduled_date: date
    notes: Optional[str] = None


class FollowUpResponse(FollowUpBase):
    id: int
    user_id: int
    status: FollowUpStatus
    completed_date: Optional[date] = None
    outcome: Optional[str] = None
    next_follow_up_date: Optional[date] = None
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    deal_title: Optional[str] = None
    is_overdue: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class FollowUpListResponse(BaseModel):
    total: int
    items: List[FollowUpResponse]
