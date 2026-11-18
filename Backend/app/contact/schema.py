from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, EmailStr


class ContactBase(BaseModel):
    company_id: int
    name: str = Field(..., min_length=1, max_length=255)
    designation: str = Field(default="Contact Person", max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    is_primary: bool = False
    notes: Optional[str] = None
    last_contacted_date: Optional[date] = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    company_id: Optional[int] = None
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    designation: Optional[str] = Field(default=None, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    is_primary: Optional[bool] = None
    notes: Optional[str] = None
    last_contacted_date: Optional[date] = None


class ContactResponse(ContactBase):
    id: int
    user_id: int
    company_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ContactListResponse(BaseModel):
    total: int
    items: List[ContactResponse]
