from datetime import date
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.deal import models, schema
from app.company.models import Company
from app.contact.models import ContactPerson


def get_deal_by_id(
    db: Session, deal_id: int, user_id: int
) -> Optional[models.InquiryDeal]:
    """Retrieves an active deal by ID belonging to user."""
    return (
        db.query(models.InquiryDeal)
        .filter(
            models.InquiryDeal.id == deal_id,
            models.InquiryDeal.user_id == user_id,
            models.InquiryDeal.deleted_at.is_(None),
        )
        .first()
    )


def get_deals(
    db: Session,
    user_id: int,
    company_id: Optional[int] = None,
    contact_id: Optional[int] = None,
    status: Optional[str] = None,
    deal_type: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[models.InquiryDeal], int]:
    """Retrieves deals with filters and search."""
    query = (
        db.query(models.InquiryDeal)
        .join(Company, models.InquiryDeal.company_id == Company.id)
        .outerjoin(ContactPerson, models.InquiryDeal.contact_person_id == ContactPerson.id)
        .filter(
            models.InquiryDeal.user_id == user_id,
            models.InquiryDeal.deleted_at.is_(None),
            Company.deleted_at.is_(None),
        )
    )

    if company_id:
        query = query.filter(models.InquiryDeal.company_id == company_id)

    if contact_id:
        query = query.filter(models.InquiryDeal.contact_person_id == contact_id)

    if status and status != "all":
        query = query.filter(models.InquiryDeal.status == status)

    if deal_type and deal_type != "all":
        query = query.filter(models.InquiryDeal.deal_type == deal_type)

    if priority and priority != "all":
        query = query.filter(models.InquiryDeal.priority == priority)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.InquiryDeal.title.ilike(pattern),
                models.InquiryDeal.description.ilike(pattern),
                Company.name.ilike(pattern),
                ContactPerson.name.ilike(pattern),
            )
        )

    total = query.count()
    items = (
        query.order_by(models.InquiryDeal.date_received.desc(), models.InquiryDeal.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return items, total


def create_deal(
    db: Session, payload: schema.DealCreate, user_id: int
) -> models.InquiryDeal:
    """Creates a new deal/inquiry record and creates the initial follow-up task if date provided."""
    today = date.today()
    date_received = payload.date_received or today

    deal = models.InquiryDeal(
        user_id=user_id,
        company_id=payload.company_id,
        contact_person_id=payload.contact_person_id,
        title=payload.title.strip(),
        deal_type=payload.deal_type,
        description=payload.description,
        date_received=date_received,
        status=payload.status,
        priority=payload.priority,
        current_follow_up_stage=payload.current_follow_up_stage,
        next_follow_up_date=payload.next_follow_up_date,
        notes=payload.notes,
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)

    # Automatically create the initial pending follow-up record if next_follow_up_date is set
    if payload.next_follow_up_date:
        try:
            from app.followup.models import FollowUpRecord
            new_follow_up = FollowUpRecord(
                user_id=user_id,
                inquiry_deal_id=deal.id,
                company_id=deal.company_id,
                contact_person_id=deal.contact_person_id,
                sequence=deal.current_follow_up_stage if deal.current_follow_up_stage != "None" else "First Follow-Up",
                status="Pending",
                scheduled_date=payload.next_follow_up_date,
                performed_by="Account Lead",
                channel="Phone Call",
                notes=f"Initial outreach for: {deal.title}",
            )
            db.add(new_follow_up)
            db.commit()
        except Exception:
            pass

    return deal


def update_deal(
    db: Session, deal: models.InquiryDeal, payload: schema.DealUpdate
) -> models.InquiryDeal:
    """Updates deal fields."""
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None and isinstance(value, str):
            value = value.strip()
        setattr(deal, field, value)

    db.commit()
    db.refresh(deal)
    return deal


def update_deal_status(
    db: Session, deal: models.InquiryDeal, payload: schema.DealStatusUpdate
) -> models.InquiryDeal:
    """Updates deal status (e.g. marking Closed or Lost with reasons)."""
    deal.status = payload.status
    today = date.today()

    if payload.status == "Closed":
        deal.closed_date = payload.closed_date or today
        deal.lost_reason = None
    elif payload.status == "Lost":
        deal.lost_reason = payload.lost_reason or "Client did not proceed."
    else:
        deal.closed_date = None
        deal.lost_reason = None

    db.commit()
    db.refresh(deal)
    return deal


def delete_deal(db: Session, deal: models.InquiryDeal) -> None:
    """Soft-deletes a deal record."""
    deal.deleted_at = func.now()
    db.commit()
