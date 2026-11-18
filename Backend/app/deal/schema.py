from datetime import date, datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, ConfigDict, Field

DealType = Literal[
    "Inquiry",
    "Project Deal",
    "Pilot Program",
    "Technical Audit",
    "Implementation",
    "Retainer",
]
DealStatus = Literal["New", "In Progress", "Follow-Up Required", "Closed", "Lost"]
DealPriority = Literal["High", "Medium", "Low"]
FollowUpStage = Literal[
    "First Follow-Up",
    "Second Follow-Up",
    "Third Follow-Up",
    "Additional Follow-Up",
    "None",
]


class DealBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    deal_type: DealType = "Inquiry"
    company_id: int
    contact_person_id: Optional[int] = None
    description: Optional[str] = None
    date_received: Optional[date] = None
    status: DealStatus = "New"
    priority: DealPriority = "Medium"
    current_follow_up_stage: FollowUpStage = "First Follow-Up"
    next_follow_up_date: Optional[date] = None
    notes: Optional[str] = None


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    deal_type: Optional[DealType] = None
    company_id: Optional[int] = None
    contact_person_id: Optional[int] = None
    description: Optional[str] = None
    date_received: Optional[date] = None
    status: Optional[DealStatus] = None
    priority: Optional[DealPriority] = None
    current_follow_up_stage: Optional[FollowUpStage] = None
    next_follow_up_date: Optional[date] = None
    notes: Optional[str] = None
    closed_date: Optional[date] = None
    lost_reason: Optional[str] = None


class DealStatusUpdate(BaseModel):
    status: DealStatus
    lost_reason: Optional[str] = None
    closed_date: Optional[date] = None


class DealResponse(DealBase):
    id: int
    user_id: int
    closed_date: Optional[date] = None
    lost_reason: Optional[str] = None
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DealListResponse(BaseModel):
    total: int
    items: List[DealResponse]
