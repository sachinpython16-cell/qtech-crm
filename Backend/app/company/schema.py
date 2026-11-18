from datetime import date, datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, ConfigDict, Field

RelationshipStatus = Literal["active", "previous", "prospect"]


class CompanyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    industry: str = Field(default="General Enterprise", max_length=100)
    relationship_status: RelationshipStatus = "prospect"
    location: str = Field(default="Global / Remote", max_length=255)
    website: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    first_engaged_date: Optional[date] = None
    last_interaction_date: Optional[date] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    industry: Optional[str] = Field(default=None, max_length=100)
    relationship_status: Optional[RelationshipStatus] = None
    location: Optional[str] = Field(default=None, max_length=255)
    website: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    first_engaged_date: Optional[date] = None
    last_interaction_date: Optional[date] = None


class CompanyStatistics(BaseModel):
    total_projects: int = 0
    closed_projects: int = 0
    ongoing_projects: int = 0
    lost_projects: int = 0
    inquiry_count: int = 0
    contacts_count: int = 0
    pending_follow_ups: int = 0
    has_worked_before: bool = False


class CompanyResponse(CompanyBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CompanyDetailResponse(CompanyResponse):
    stats: Optional[CompanyStatistics] = None


class CompanyListResponse(BaseModel):
    total: int
    items: List[CompanyDetailResponse]
