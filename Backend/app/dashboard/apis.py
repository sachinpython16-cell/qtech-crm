from datetime import date
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.dashboard import schema
from app.company.models import Company
from app.contact.models import ContactPerson
from app.deal.models import InquiryDeal
from app.followup.models import FollowUpRecord
from app.company.apis import calculate_company_statistics
from app.company.schema import CompanyDetailResponse
from app.contact.schema import ContactResponse
from app.deal.schema import DealResponse


def get_dashboard_metrics(db: Session, user_id: int) -> schema.DashboardMetricsResponse:
    """Calculates all aggregated dashboard metrics for the user."""
    today = date.today()

    # Companies
    companies = (
        db.query(Company)
        .filter(Company.user_id == user_id, Company.deleted_at.is_(None))
        .all()
    )
    total_companies = len(companies)
    active_companies = sum(1 for c in companies if c.relationship_status == "active")
    previous_companies = sum(1 for c in companies if c.relationship_status == "previous")

    # Contacts
    total_contacts = (
        db.query(ContactPerson)
        .filter(ContactPerson.user_id == user_id, ContactPerson.deleted_at.is_(None))
        .count()
    )

    # Deals
    deals = (
        db.query(InquiryDeal)
        .filter(InquiryDeal.user_id == user_id, InquiryDeal.deleted_at.is_(None))
        .all()
    )
    total_inquiries = sum(
        1
        for d in deals
        if d.deal_type == "Inquiry" or d.status in ["New", "Follow-Up Required"]
    )
    ongoing_deals = sum(1 for d in deals if d.status == "In Progress")
    closed_deals = sum(1 for d in deals if d.status == "Closed")
    lost_deals = sum(1 for d in deals if d.status == "Lost")

    # Follow-ups
    follow_ups = (
        db.query(FollowUpRecord)
        .filter(FollowUpRecord.user_id == user_id)
        .all()
    )

    is_overdue = lambda f: f.status in ["Pending", "Overdue"] and f.scheduled_date < today
    is_due_today = lambda f: f.status == "Pending" and f.scheduled_date == today

    overdue_follow_ups = sum(1 for f in follow_ups if is_overdue(f))
    due_today_follow_ups = sum(1 for f in follow_ups if is_due_today(f))
    pending_follow_ups = sum(1 for f in follow_ups if f.status in ["Pending", "Overdue"])

    first_pending = sum(
        1 for f in follow_ups if f.sequence == "First Follow-Up" and f.status in ["Pending", "Overdue"]
    )
    first_completed = sum(
        1 for f in follow_ups if f.sequence == "First Follow-Up" and f.status == "Completed"
    )

    second_pending = sum(
        1 for f in follow_ups if f.sequence == "Second Follow-Up" and f.status in ["Pending", "Overdue"]
    )
    second_completed = sum(
        1 for f in follow_ups if f.sequence == "Second Follow-Up" and f.status == "Completed"
    )

    third_pending = sum(
        1 for f in follow_ups if f.sequence == "Third Follow-Up" and f.status in ["Pending", "Overdue"]
    )
    third_completed = sum(
        1 for f in follow_ups if f.sequence == "Third Follow-Up" and f.status == "Completed"
    )

    add_pending = sum(
        1 for f in follow_ups if f.sequence == "Additional Follow-Up" and f.status in ["Pending", "Overdue"]
    )
    add_completed = sum(
        1 for f in follow_ups if f.sequence == "Additional Follow-Up" and f.status == "Completed"
    )

    return schema.DashboardMetricsResponse(
        total_companies=total_companies,
        active_companies=active_companies,
        previous_companies=previous_companies,
        total_contacts=total_contacts,
        total_inquiries=total_inquiries,
        ongoing_deals=ongoing_deals,
        closed_deals=closed_deals,
        lost_deals=lost_deals,
        pending_follow_ups=pending_follow_ups,
        first_follow_ups_pending=first_pending,
        first_follow_ups_completed=first_completed,
        second_follow_ups_pending=second_pending,
        second_follow_ups_completed=second_completed,
        third_follow_ups_pending=third_pending,
        third_follow_ups_completed=third_completed,
        additional_follow_ups_pending=add_pending,
        additional_follow_ups_completed=add_completed,
        overdue_follow_ups=overdue_follow_ups,
        due_today_follow_ups=due_today_follow_ups,
    )


def universal_relationship_lookup(
    db: Session, user_id: int, query_text: str
) -> schema.RelationshipLookupResponse:
    """Performs fast cross-table lookup across companies, contacts, and deals."""
    cleaned = query_text.strip()
    if not cleaned:
        return schema.RelationshipLookupResponse(
            query=query_text,
            has_matches=False,
            matched_companies=[],
            matched_contacts=[],
            matched_deals=[],
        )

    pattern = f"%{cleaned}%"

    # Search Companies
    companies = (
        db.query(Company)
        .filter(
            Company.user_id == user_id,
            Company.deleted_at.is_(None),
            or_(
                Company.name.ilike(pattern),
                Company.industry.ilike(pattern),
                Company.location.ilike(pattern),
                Company.website.ilike(pattern),
                Company.notes.ilike(pattern),
            ),
        )
        .limit(20)
        .all()
    )

    matched_companies: List[CompanyDetailResponse] = []
    for comp in companies:
        resp = CompanyDetailResponse.model_validate(comp)
        resp.stats = calculate_company_statistics(db, comp.id)
        matched_companies.append(resp)

    # Search Contacts
    contacts = (
        db.query(ContactPerson)
        .join(Company, ContactPerson.company_id == Company.id)
        .filter(
            ContactPerson.user_id == user_id,
            ContactPerson.deleted_at.is_(None),
            Company.deleted_at.is_(None),
            or_(
                ContactPerson.name.ilike(pattern),
                ContactPerson.email.ilike(pattern),
                ContactPerson.phone.ilike(pattern),
                ContactPerson.designation.ilike(pattern),
                Company.name.ilike(pattern),
            ),
        )
        .limit(20)
        .all()
    )

    matched_contacts: List[ContactResponse] = []
    for cont in contacts:
        resp = ContactResponse.model_validate(cont)
        resp.company_name = cont.company.name if cont.company else None
        matched_contacts.append(resp)

    # Search Deals
    deals = (
        db.query(InquiryDeal)
        .join(Company, InquiryDeal.company_id == Company.id)
        .outerjoin(ContactPerson, InquiryDeal.contact_person_id == ContactPerson.id)
        .filter(
            InquiryDeal.user_id == user_id,
            InquiryDeal.deleted_at.is_(None),
            Company.deleted_at.is_(None),
            or_(
                InquiryDeal.title.ilike(pattern),
                InquiryDeal.description.ilike(pattern),
                Company.name.ilike(pattern),
                ContactPerson.name.ilike(pattern),
            ),
        )
        .limit(20)
        .all()
    )

    matched_deals: List[DealResponse] = []
    for d in deals:
        resp = DealResponse.model_validate(d)
        resp.company_name = d.company.name if d.company else None
        resp.contact_name = d.contact_person.name if d.contact_person else None
        matched_deals.append(resp)

    has_matches = bool(matched_companies or matched_contacts or matched_deals)

    return schema.RelationshipLookupResponse(
        query=query_text,
        has_matches=has_matches,
        matched_companies=matched_companies,
        matched_contacts=matched_contacts,
        matched_deals=matched_deals,
    )
