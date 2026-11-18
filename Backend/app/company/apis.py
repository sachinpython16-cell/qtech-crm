from datetime import date
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.company import models, schema


def get_company_by_id(
    db: Session, company_id: int, user_id: int
) -> Optional[models.Company]:
    """Retrieve an active company by ID belonging to the user."""
    return (
        db.query(models.Company)
        .filter(
            models.Company.id == company_id,
            models.Company.user_id == user_id,
            models.Company.deleted_at.is_(None),
        )
        .first()
    )


def get_company_by_name(
    db: Session, name: str, user_id: int
) -> Optional[models.Company]:
    """Check for an existing company with the same name (case-insensitive) for this user."""
    return (
        db.query(models.Company)
        .filter(
            func.lower(models.Company.name) == func.lower(name.strip()),
            models.Company.user_id == user_id,
            models.Company.deleted_at.is_(None),
        )
        .first()
    )


def get_companies(
    db: Session,
    user_id: int,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[models.Company], int]:
    """Retrieve companies with optional filtering by relationship status and search text."""
    query = db.query(models.Company).filter(
        models.Company.user_id == user_id,
        models.Company.deleted_at.is_(None),
    )

    if status and status != "all":
        query = query.filter(models.Company.relationship_status == status)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Company.name.ilike(search_pattern),
                models.Company.industry.ilike(search_pattern),
                models.Company.location.ilike(search_pattern),
                models.Company.notes.ilike(search_pattern),
            )
        )

    total = query.count()
    items = (
        query.order_by(models.Company.name.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return items, total


def create_company(
    db: Session, payload: schema.CompanyCreate, user_id: int
) -> models.Company:
    """Creates and persists a new client company record."""
    today = date.today()
    company = models.Company(
        user_id=user_id,
        name=payload.name.strip(),
        industry=payload.industry.strip(),
        relationship_status=payload.relationship_status,
        location=payload.location.strip(),
        website=payload.website.strip() if payload.website else None,
        notes=payload.notes,
        first_engaged_date=payload.first_engaged_date or today,
        last_interaction_date=payload.last_interaction_date or today,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def update_company(
    db: Session, company: models.Company, payload: schema.CompanyUpdate
) -> models.Company:
    """Updates fields of an existing company."""
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None and isinstance(value, str):
            value = value.strip()
        setattr(company, field, value)

    db.commit()
    db.refresh(company)
    return company


def delete_company(db: Session, company: models.Company) -> None:
    """Soft-deletes a company."""
    company.deleted_at = func.now()
    db.commit()


def calculate_company_statistics(
    db: Session, company_id: int
) -> schema.CompanyStatistics:
    """Computes real-time relationship statistics for a given company."""
    # Count contacts
    # We will import ContactPerson, InquiryDeal, FollowUpRecord dynamically or from models to prevent circular imports
    try:
        from app.contact.models import ContactPerson
        contacts_count = (
            db.query(ContactPerson)
            .filter(
                ContactPerson.company_id == company_id,
                ContactPerson.deleted_at.is_(None),
            )
            .count()
        )
    except Exception:
        contacts_count = 0

    try:
        from app.deal.models import InquiryDeal
        deals = (
            db.query(InquiryDeal)
            .filter(
                InquiryDeal.company_id == company_id,
                InquiryDeal.deleted_at.is_(None),
            )
            .all()
        )
        total_projects = len(deals)
        closed_projects = sum(1 for d in deals if d.status == "Closed")
        ongoing_projects = sum(1 for d in deals if d.status == "In Progress")
        lost_projects = sum(1 for d in deals if d.status == "Lost")
        inquiry_count = sum(
            1
            for d in deals
            if d.deal_type == "Inquiry" or d.status in ["New", "Follow-Up Required"]
        )
    except Exception:
        total_projects = 0
        closed_projects = 0
        ongoing_projects = 0
        lost_projects = 0
        inquiry_count = 0

    try:
        from app.followup.models import FollowUpRecord
        pending_follow_ups = (
            db.query(FollowUpRecord)
            .filter(
                FollowUpRecord.company_id == company_id,
                FollowUpRecord.status.in_(["Pending", "Overdue"]),
            )
            .count()
        )
    except Exception:
        pending_follow_ups = 0

    has_worked_before = (closed_projects > 0) or (ongoing_projects > 0)

    return schema.CompanyStatistics(
        total_projects=total_projects,
        closed_projects=closed_projects,
        ongoing_projects=ongoing_projects,
        lost_projects=lost_projects,
        inquiry_count=inquiry_count,
        contacts_count=contacts_count,
        pending_follow_ups=pending_follow_ups,
        has_worked_before=has_worked_before,
    )
