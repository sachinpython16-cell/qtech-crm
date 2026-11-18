from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.apis import get_current_user
from app.auth.models import User
from app.company.apis import get_company_by_id
from app.contact.apis import get_contact_by_id
from app.deal import schema, apis

router = APIRouter(prefix="/deals", tags=["Deals & Inquiries"])


@router.post(
    "",
    response_model=schema.DealResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new deal or inquiry",
)
def create_deal_endpoint(
    payload: schema.DealCreate,
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

    # Verify contact if provided
    contact_name = None
    if payload.contact_person_id:
        contact = get_contact_by_id(db, payload.contact_person_id, current_user.id)
        if not contact or contact.company_id != company.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contact person does not belong to the selected company",
            )
        contact_name = contact.name

    deal = apis.create_deal(db, payload, current_user.id)
    resp = schema.DealResponse.model_validate(deal)
    resp.company_name = company.name
    resp.contact_name = contact_name
    return resp


@router.get(
    "",
    response_model=schema.DealListResponse,
    summary="List deals and inquiries with filtering",
)
def list_deals_endpoint(
    company_id: Optional[int] = Query(None, description="Filter by company ID"),
    contact_id: Optional[int] = Query(None, description="Filter by contact person ID"),
    status: Optional[str] = Query(None, description="Filter by deal status"),
    deal_type: Optional[str] = Query(None, description="Filter by deal type"),
    priority: Optional[str] = Query(None, description="Filter by priority ('High', 'Medium', 'Low')"),
    search: Optional[str] = Query(None, description="Search term for title, description, company, or contact"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = apis.get_deals(
        db,
        user_id=current_user.id,
        company_id=company_id,
        contact_id=contact_id,
        status=status,
        deal_type=deal_type,
        priority=priority,
        search=search,
        skip=skip,
        limit=limit,
    )

    result = []
    for d in items:
        resp = schema.DealResponse.model_validate(d)
        resp.company_name = d.company.name if d.company else None
        resp.contact_name = d.contact_person.name if d.contact_person else None
        result.append(resp)

    return schema.DealListResponse(total=total, items=result)


@router.get(
    "/{deal_id}",
    response_model=schema.DealResponse,
    summary="Get single deal/inquiry details",
)
def get_deal_endpoint(
    deal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deal = apis.get_deal_by_id(db, deal_id, current_user.id)
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal/Inquiry not found",
        )

    resp = schema.DealResponse.model_validate(deal)
    resp.company_name = deal.company.name if deal.company else None
    resp.contact_name = deal.contact_person.name if deal.contact_person else None
    return resp


@router.put(
    "/{deal_id}",
    response_model=schema.DealResponse,
    summary="Update deal/inquiry details",
)
def update_deal_endpoint(
    deal_id: int,
    payload: schema.DealUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deal = apis.get_deal_by_id(db, deal_id, current_user.id)
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal/Inquiry not found",
        )

    if payload.company_id and payload.company_id != deal.company_id:
        company = get_company_by_id(db, payload.company_id, current_user.id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target company not found",
            )

    updated = apis.update_deal(db, deal, payload)
    resp = schema.DealResponse.model_validate(updated)
    resp.company_name = updated.company.name if updated.company else None
    resp.contact_name = updated.contact_person.name if updated.contact_person else None
    return resp


@router.patch(
    "/{deal_id}/status",
    response_model=schema.DealResponse,
    summary="Update deal status (e.g. mark Closed or Lost with reasons)",
)
def update_deal_status_endpoint(
    deal_id: int,
    payload: schema.DealStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deal = apis.get_deal_by_id(db, deal_id, current_user.id)
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal/Inquiry not found",
        )

    updated = apis.update_deal_status(db, deal, payload)
    resp = schema.DealResponse.model_validate(updated)
    resp.company_name = updated.company.name if updated.company else None
    resp.contact_name = updated.contact_person.name if updated.contact_person else None
    return resp


@router.delete(
    "/{deal_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete deal/inquiry (soft delete)",
)
def delete_deal_endpoint(
    deal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deal = apis.get_deal_by_id(db, deal_id, current_user.id)
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal/Inquiry not found",
        )

    apis.delete_deal(db, deal)
    return {"message": "Deal deleted successfully"}
