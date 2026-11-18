from typing import List, Optional
from pydantic import BaseModel
from app.company.schema import CompanyDetailResponse
from app.contact.schema import ContactResponse
from app.deal.schema import DealResponse


class DashboardMetricsResponse(BaseModel):
    total_companies: int
    active_companies: int
    previous_companies: int
    total_contacts: int
    total_inquiries: int
    ongoing_deals: int
    closed_deals: int
    lost_deals: int
    pending_follow_ups: int
    first_follow_ups_pending: int
    first_follow_ups_completed: int
    second_follow_ups_pending: int
    second_follow_ups_completed: int
    third_follow_ups_pending: int
    third_follow_ups_completed: int
    additional_follow_ups_pending: int
    additional_follow_ups_completed: int
    overdue_follow_ups: int
    due_today_follow_ups: int


class RelationshipLookupResponse(BaseModel):
    query: str
    has_matches: bool
    matched_companies: List[CompanyDetailResponse]
    matched_contacts: List[ContactResponse]
    matched_deals: List[DealResponse]
