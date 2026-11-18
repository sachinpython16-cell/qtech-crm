from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.apis import get_current_user
from app.auth.models import User
from app.company.apis import get_company_by_id
from app.deal.apis import get_deal_by_id
from app.contact.apis import get_contact_by_id
from app.interaction import schema, apis

router = APIRouter(prefix="/interactions", tags=["Interaction Timeline"])


@router.post(
    "",
    response_model=schema.InteractionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a new interaction (meeting, call, review, kickoff)",
)
def create_interaction_endpoint(
    payload: schema.InteractionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify company exists
    company = get_company_by_id(db, payload.company_id, current_user.id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    # Verify contact if specified
    contact_name = None
    if payload.contact_person_id:
        contact = get_contact_by_id(db, payload.contact_person_id, current_user.id)
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact person not found",
            )
        contact_name = contact.name

    # Verify deal if specified
    deal_title = None
    if payload.inquiry_deal_id:
        deal = get_deal_by_id(db, payload.inquiry_deal_id, current_user.id)
        if not deal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Deal/Inquiry not found",
            )
        deal_title = deal.title

    log = apis.create_interaction(db, payload, current_user.id)
    resp = schema.InteractionResponse.model_validate(log)
    resp.company_name = company.name
    resp.contact_name = contact_name
    resp.deal_title = deal_title
    return resp


@router.get(
    "",
    response_model=schema.InteractionListResponse,
    summary="List interaction history timeline entries",
)
def list_interactions_endpoint(
    company_id: Optional[int] = Query(None, description="Filter by company ID"),
    deal_id: Optional[int] = Query(None, description="Filter by deal/inquiry ID"),
    contact_id: Optional[int] = Query(None, description="Filter by contact person ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = apis.get_interactions(
        db,
        user_id=current_user.id,
        company_id=company_id,
        deal_id=deal_id,
        contact_id=contact_id,
        skip=skip,
        limit=limit,
    )

    result = []
    for log in items:
        resp = schema.InteractionResponse.model_validate(log)
        resp.company_name = log.company.name if log.company else None
        resp.contact_name = log.contact_person.name if hasattr(log, "contact_person") and log.contact_person else None
        resp.deal_title = log.deal.title if log.deal else None
        result.append(resp)

    return schema.InteractionListResponse(total=total, items=result)
