import datetime as dt
from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, ConfigDict, Field

InteractionType = Literal[
    "Inquiry Received",
    "Project Kickoff",
    "Milestone Review",
    "Project Completed",
    "Follow-Up Call",
    "Email Thread",
    "Status Update",
    "Client Review",
]


class InteractionBase(BaseModel):
    company_id: int
    contact_person_id: Optional[int] = None
    inquiry_deal_id: Optional[int] = None
    date: Optional[dt.date] = None
    interaction_type: InteractionType = "Status Update"
    title: str = Field(..., min_length=1, max_length=255)
    details: Optional[str] = None
    logged_by: str = Field(default="Team Member", max_length=100)


class InteractionCreate(InteractionBase):
    pass


class InteractionResponse(InteractionBase):
    id: int
    user_id: int
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    deal_title: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InteractionListResponse(BaseModel):
    total: int
    items: List[InteractionResponse]
