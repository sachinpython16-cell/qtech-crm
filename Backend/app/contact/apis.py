from datetime import date
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.contact import models, schema
from app.company.models import Company


def get_contact_by_id(
    db: Session, contact_id: int, user_id: int
) -> Optional[models.ContactPerson]:
    """Retrieves an active contact by ID belonging to the user."""
    return (
        db.query(models.ContactPerson)
        .filter(
            models.ContactPerson.id == contact_id,
            models.ContactPerson.user_id == user_id,
            models.ContactPerson.deleted_at.is_(None),
        )
        .first()
    )


def get_contacts(
    db: Session,
    user_id: int,
    company_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[models.ContactPerson], int]:
    """Retrieves contacts with optional company filtering and search by name/email/phone/designation."""
    query = (
        db.query(models.ContactPerson)
        .join(Company, models.ContactPerson.company_id == Company.id)
        .filter(
            models.ContactPerson.user_id == user_id,
            models.ContactPerson.deleted_at.is_(None),
            Company.deleted_at.is_(None),
        )
    )

    if company_id:
        query = query.filter(models.ContactPerson.company_id == company_id)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.ContactPerson.name.ilike(pattern),
                models.ContactPerson.email.ilike(pattern),
                models.ContactPerson.phone.ilike(pattern),
                models.ContactPerson.designation.ilike(pattern),
                Company.name.ilike(pattern),
            )
        )

    total = query.count()
    items = (
        query.order_by(
            models.ContactPerson.is_primary.desc(),
            models.ContactPerson.name.asc(),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
    return items, total


def create_contact(
    db: Session, payload: schema.ContactCreate, user_id: int
) -> models.ContactPerson:
    """Creates a new contact person. If is_primary is True, demotes any other primary contacts for the same company."""
    if payload.is_primary:
        _demote_other_primaries(db, payload.company_id)

    today = date.today()
    contact = models.ContactPerson(
        user_id=user_id,
        company_id=payload.company_id,
        name=payload.name.strip(),
        designation=payload.designation.strip(),
        email=payload.email,
        phone=payload.phone.strip() if payload.phone else None,
        is_primary=payload.is_primary,
        notes=payload.notes,
        last_contacted_date=payload.last_contacted_date or today,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


def update_contact(
    db: Session, contact: models.ContactPerson, payload: schema.ContactUpdate
) -> models.ContactPerson:
    """Updates contact person details, managing primary status changes."""
    update_data = payload.model_dump(exclude_unset=True)

    if update_data.get("is_primary") and not contact.is_primary:
        target_company_id = update_data.get("company_id") or contact.company_id
        _demote_other_primaries(db, target_company_id, exclude_id=contact.id)

    for field, value in update_data.items():
        if value is not None and isinstance(value, str):
            value = value.strip()
        setattr(contact, field, value)

    db.commit()
    db.refresh(contact)
    return contact


def delete_contact(db: Session, contact: models.ContactPerson) -> None:
    """Soft-deletes a contact person."""
    contact.deleted_at = func.now()
    db.commit()


def _demote_other_primaries(
    db: Session, company_id: int, exclude_id: Optional[int] = None
) -> None:
    """Ensures only one primary contact exists per company."""
    query = db.query(models.ContactPerson).filter(
        models.ContactPerson.company_id == company_id,
        models.ContactPerson.is_primary == True,
        models.ContactPerson.deleted_at.is_(None),
    )
    if exclude_id:
        query = query.filter(models.ContactPerson.id != exclude_id)
    query.update({"is_primary": False})
    db.flush()
