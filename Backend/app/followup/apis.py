from datetime import date
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.followup import models, schema
from app.company.models import Company
from app.contact.models import ContactPerson
from app.deal.models import InquiryDeal


def advance_sequence(current: str) -> str:
    """Helper to progress sequence to the next tier."""
    if current == "First Follow-Up":
        return "Second Follow-Up"
    elif current == "Second Follow-Up":
        return "Third Follow-Up"
    elif current in ["Third Follow-Up", "Additional Follow-Up"]:
        return "Additional Follow-Up"
    return "First Follow-Up"


def get_follow_up_by_id(
    db: Session, follow_up_id: int, user_id: int
) -> Optional[models.FollowUpRecord]:
    """Retrieves a follow-up record belonging to the user."""
    return (
        db.query(models.FollowUpRecord)
        .filter(
            models.FollowUpRecord.id == follow_up_id,
            models.FollowUpRecord.user_id == user_id,
        )
        .first()
    )


def get_follow_ups(
    db: Session,
    user_id: int,
    status: Optional[str] = None,
    sequence: Optional[str] = None,
    company_id: Optional[int] = None,
    deal_id: Optional[int] = None,
    overdue_only: bool = False,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[models.FollowUpRecord], int]:
    """Retrieves follow-ups with filtering by status, sequence, company, or overdue status."""
    today = date.today()
    query = (
        db.query(models.FollowUpRecord)
        .join(Company, models.FollowUpRecord.company_id == Company.id)
        .join(InquiryDeal, models.FollowUpRecord.inquiry_deal_id == InquiryDeal.id)
        .outerjoin(ContactPerson, models.FollowUpRecord.contact_person_id == ContactPerson.id)
        .filter(
            models.FollowUpRecord.user_id == user_id,
            Company.deleted_at.is_(None),
            InquiryDeal.deleted_at.is_(None),
        )
    )

    if company_id:
        query = query.filter(models.FollowUpRecord.company_id == company_id)

    if deal_id:
        query = query.filter(models.FollowUpRecord.inquiry_deal_id == deal_id)

    if sequence and sequence != "all":
        query = query.filter(models.FollowUpRecord.sequence == sequence)

    if overdue_only:
        query = query.filter(
            models.FollowUpRecord.status.in_(["Pending", "Overdue"]),
            models.FollowUpRecord.scheduled_date < today,
        )
    elif status and status != "all":
        if status == "Overdue":
            query = query.filter(
                models.FollowUpRecord.status.in_(["Pending", "Overdue"]),
                models.FollowUpRecord.scheduled_date < today,
            )
        else:
            query = query.filter(models.FollowUpRecord.status == status)

    total = query.count()
    items = (
        query.order_by(models.FollowUpRecord.scheduled_date.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return items, total


def create_follow_up(
    db: Session, payload: schema.FollowUpCreate, user_id: int
) -> models.FollowUpRecord:
    """Schedules a new follow-up."""
    record = models.FollowUpRecord(
        user_id=user_id,
        inquiry_deal_id=payload.inquiry_deal_id,
        company_id=payload.company_id,
        contact_person_id=payload.contact_person_id,
        sequence=payload.sequence,
        status="Pending",
        scheduled_date=payload.scheduled_date,
        performed_by=payload.performed_by,
        channel=payload.channel,
        notes=payload.notes,
    )
    db.add(record)

    # Update deal's currentFollowUpStage & nextFollowUpDate
    deal = db.query(InquiryDeal).filter(InquiryDeal.id == payload.inquiry_deal_id).first()
    if deal:
        deal.current_follow_up_stage = payload.sequence
        deal.next_follow_up_date = payload.scheduled_date

    db.commit()
    db.refresh(record)
    return record


def complete_follow_up(
    db: Session,
    record: models.FollowUpRecord,
    payload: schema.FollowUpComplete,
    user_id: int,
) -> Tuple[models.FollowUpRecord, Optional[models.FollowUpRecord]]:
    """Marks a follow-up complete, records timeline interaction, and optionally schedules the next sequence."""
    today = date.today()
    record.status = "Completed"
    record.completed_date = today
    record.outcome = payload.outcome.strip()
    if payload.notes:
        record.notes = (
            f"{record.notes}\n[Completed Notes]: {payload.notes.strip()}"
            if record.notes
            else payload.notes.strip()
        )

    # Log interaction timeline entry
    try:
        from app.interaction.models import InteractionLog
        log = InteractionLog(
            user_id=user_id,
            company_id=record.company_id,
            contact_person_id=record.contact_person_id,
            inquiry_deal_id=record.inquiry_deal_id,
            date=today,
            interaction_type="Follow-Up Call",
            title=f"{record.sequence} Completed",
            details=payload.outcome.strip(),
            logged_by=record.performed_by or "Account Lead",
        )
        db.add(log)
    except Exception:
        pass

    # Update company's last interaction date
    company = db.query(Company).filter(Company.id == record.company_id).first()
    if company:
        company.last_interaction_date = today

    # Update contact's last contacted date
    if record.contact_person_id:
        contact = (
            db.query(ContactPerson)
            .filter(ContactPerson.id == record.contact_person_id)
            .first()
        )
        if contact:
            contact.last_contacted_date = today

    # Schedule next sequence if requested
    next_record = None
    deal = db.query(InquiryDeal).filter(InquiryDeal.id == record.inquiry_deal_id).first()

    if payload.schedule_next and payload.next_date:
        next_sequence = advance_sequence(record.sequence)
        next_record = models.FollowUpRecord(
            user_id=user_id,
            inquiry_deal_id=record.inquiry_deal_id,
            company_id=record.company_id,
            contact_person_id=record.contact_person_id,
            sequence=next_sequence,
            status="Pending",
            scheduled_date=payload.next_date,
            performed_by=record.performed_by,
            channel=payload.next_channel or "Email",
            notes=f"Auto-scheduled {next_sequence} following outcome: {payload.outcome.strip()}",
        )
        db.add(next_record)

        if deal:
            deal.current_follow_up_stage = next_sequence
            deal.next_follow_up_date = payload.next_date
    else:
        if deal:
            deal.next_follow_up_date = None

    db.commit()
    db.refresh(record)
    if next_record:
        db.refresh(next_record)

    return record, next_record


def reschedule_follow_up(
    db: Session, record: models.FollowUpRecord, payload: schema.FollowUpReschedule
) -> models.FollowUpRecord:
    """Reschedules a pending follow-up date."""
    record.scheduled_date = payload.scheduled_date
    record.status = "Rescheduled"
    if payload.notes:
        record.notes = (
            f"{record.notes}\n[Rescheduled]: {payload.notes.strip()}"
            if record.notes
            else payload.notes.strip()
        )

    deal = db.query(InquiryDeal).filter(InquiryDeal.id == record.inquiry_deal_id).first()
    if deal:
        deal.next_follow_up_date = payload.scheduled_date

    db.commit()
    db.refresh(record)
    return record


def delete_follow_up(db: Session, record: models.FollowUpRecord) -> None:
    """Deletes a follow-up record."""
    db.delete(record)
    db.commit()
