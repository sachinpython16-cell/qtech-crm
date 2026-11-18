from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.apis import get_current_user
from app.auth.models import User
from app.company.apis import get_company_by_id
from app.deal.apis import get_deal_by_id
from app.contact.apis import get_contact_by_id
from app.followup import schema, apis

router = APIRouter(prefix="/followups", tags=["Follow-Up Pipeline"])


@router.post(
    "",
    response_model=schema.FollowUpResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule a new follow-up for a deal/inquiry",
)
def create_follow_up_endpoint(
    payload: schema.FollowUpCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify deal exists and belongs to user
    deal = get_deal_by_id(db, payload.inquiry_deal_id, current_user.id)
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal/Inquiry not found",
        )

    # Verify company
    company = get_company_by_id(db, payload.company_id, current_user.id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    # Verify contact if supplied
    contact_name = None
    if payload.contact_person_id:
        contact = get_contact_by_id(db, payload.contact_person_id, current_user.id)
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact person not found",
            )
        contact_name = contact.name

    record = apis.create_follow_up(db, payload, current_user.id)

    today = date.today()
    is_overdue = (record.status in ["Pending", "Overdue"]) and (record.scheduled_date < today)

    resp = schema.FollowUpResponse.model_validate(record)
    resp.company_name = company.name
    resp.deal_title = deal.title
    resp.contact_name = contact_name
    resp.is_overdue = is_overdue
    return resp


@router.get(
    "",
    response_model=schema.FollowUpListResponse,
    summary="List follow-ups with sequence and status filtering",
)
def list_follow_ups_endpoint(
    status: Optional[str] = Query(None, description="Filter by status ('Pending', 'Completed', 'Overdue', 'Rescheduled')"),
    sequence: Optional[str] = Query(None, description="Filter by sequence ('First Follow-Up', etc.)"),
    company_id: Optional[int] = Query(None, description="Filter by company ID"),
    deal_id: Optional[int] = Query(None, description="Filter by deal/inquiry ID"),
    overdue_only: bool = Query(False, description="Filter only overdue items"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = apis.get_follow_ups(
        db,
        user_id=current_user.id,
        status=status,
        sequence=sequence,
        company_id=company_id,
        deal_id=deal_id,
        overdue_only=overdue_only,
        skip=skip,
        limit=limit,
    )

    today = date.today()
    result = []
    for f in items:
        resp = schema.FollowUpResponse.model_validate(f)
        resp.company_name = f.company.name if f.company else None
        resp.contact_name = f.contact_person.name if f.contact_person else None
        resp.deal_title = f.deal.title if f.deal else None
        resp.is_overdue = (f.status in ["Pending", "Overdue"]) and (f.scheduled_date < today)
        result.append(resp)

    return schema.FollowUpListResponse(total=total, items=result)


@router.get(
    "/{follow_up_id}",
    response_model=schema.FollowUpResponse,
    summary="Get single follow-up details",
)
def get_follow_up_endpoint(
    follow_up_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = apis.get_follow_up_by_id(db, follow_up_id, current_user.id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up record not found",
        )

    today = date.today()
    resp = schema.FollowUpResponse.model_validate(record)
    resp.company_name = record.company.name if record.company else None
    resp.contact_name = record.contact_person.name if record.contact_person else None
    resp.deal_title = record.deal.title if record.deal else None
    resp.is_overdue = (record.status in ["Pending", "Overdue"]) and (record.scheduled_date < today)
    return resp


@router.post(
    "/{follow_up_id}/complete",
    response_model=schema.FollowUpResponse,
    summary="Complete a follow-up, record outcome, and optionally schedule next sequence",
)
def complete_follow_up_endpoint(
    follow_up_id: int,
    payload: schema.FollowUpComplete,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = apis.get_follow_up_by_id(db, follow_up_id, current_user.id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up record not found",
        )

    completed, _ = apis.complete_follow_up(db, record, payload, current_user.id)
    resp = schema.FollowUpResponse.model_validate(completed)
    resp.company_name = completed.company.name if completed.company else None
    resp.contact_name = completed.contact_person.name if completed.contact_person else None
    resp.deal_title = completed.deal.title if completed.deal else None
    resp.is_overdue = False
    return resp


@router.patch(
    "/{follow_up_id}/reschedule",
    response_model=schema.FollowUpResponse,
    summary="Reschedule a follow-up date",
)
def reschedule_follow_up_endpoint(
    follow_up_id: int,
    payload: schema.FollowUpReschedule,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = apis.get_follow_up_by_id(db, follow_up_id, current_user.id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up record not found",
        )

    updated = apis.reschedule_follow_up(db, record, payload)
    today = date.today()
    resp = schema.FollowUpResponse.model_validate(updated)
    resp.company_name = updated.company.name if updated.company else None
    resp.contact_name = updated.contact_person.name if updated.contact_person else None
    resp.deal_title = updated.deal.title if updated.deal else None
    resp.is_overdue = (updated.status in ["Pending", "Overdue"]) and (updated.scheduled_date < today)
    return resp


@router.delete(
    "/{follow_up_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete follow-up record",
)
def delete_follow_up_endpoint(
    follow_up_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = apis.get_follow_up_by_id(db, follow_up_id, current_user.id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up record not found",
        )

    apis.delete_follow_up(db, record)
    return {"message": "Follow-up deleted successfully"}
