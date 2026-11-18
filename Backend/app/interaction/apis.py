from datetime import date
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session

from app.interaction import models, schema
from app.company.models import Company
from app.contact.models import ContactPerson
from app.deal.models import InquiryDeal


def create_interaction(
    db: Session, payload: schema.InteractionCreate, user_id: int
) -> models.InteractionLog:
    """Creates a new timeline interaction log and updates company's last_interaction_date."""
    today = date.today()
    interaction_date = payload.date or today

    log = models.InteractionLog(
        user_id=user_id,
        company_id=payload.company_id,
        contact_person_id=payload.contact_person_id,
        inquiry_deal_id=payload.inquiry_deal_id,
        date=interaction_date,
        interaction_type=payload.interaction_type,
        title=payload.title.strip(),
        details=payload.details,
        logged_by=payload.logged_by,
    )
    db.add(log)

    # Update company last interaction date
    company = db.query(Company).filter(Company.id == payload.company_id).first()
    if company:
        company.last_interaction_date = interaction_date

    # Update contact last contacted date if specified
    if payload.contact_person_id:
        contact = (
            db.query(ContactPerson)
            .filter(ContactPerson.id == payload.contact_person_id)
            .first()
        )
        if contact:
            contact.last_contacted_date = interaction_date

    db.commit()
    db.refresh(log)
    return log


def get_interactions(
    db: Session,
    user_id: int,
    company_id: Optional[int] = None,
    deal_id: Optional[int] = None,
    contact_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[models.InteractionLog], int]:
    """Retrieves interaction logs filtered by company, deal, or contact."""
    query = (
        db.query(models.InteractionLog)
        .join(Company, models.InteractionLog.company_id == Company.id)
        .filter(
            models.InteractionLog.user_id == user_id,
            Company.deleted_at.is_(None),
        )
    )

    if company_id:
        query = query.filter(models.InteractionLog.company_id == company_id)

    if deal_id:
        query = query.filter(models.InteractionLog.inquiry_deal_id == deal_id)

    if contact_id:
        query = query.filter(models.InteractionLog.contact_person_id == contact_id)

    total = query.count()
    items = (
        query.order_by(models.InteractionLog.date.desc(), models.InteractionLog.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return items, total
