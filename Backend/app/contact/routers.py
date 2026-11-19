from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.apis import get_current_user
from app.auth.models import User
from app.company.apis import get_company_by_id
from app.contact import schema, apis

router = APIRouter(prefix="/contacts", tags=["Contact Persons"])


@router.post(
    "",
    response_model=schema.ContactResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new contact person to a client company",
)
def create_contact_endpoint(
    payload: schema.ContactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.company_id or payload.company_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid positive company_id is required.",
        )

    # Verify company exists and belongs to current user
    company = get_company_by_id(db, payload.company_id, current_user.id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with ID {payload.company_id} does not exist for this account.",
        )

    contact = apis.create_contact(db, payload, current_user.id)
    resp = schema.ContactResponse.model_validate(contact)
    resp.company_name = company.name
    return resp


@router.get(
    "",
    response_model=schema.ContactListResponse,
    summary="List contact persons with optional company filter and search",
)
def list_contacts_endpoint(
    company_id: Optional[int] = Query(None, description="Filter contacts by company ID"),
    search: Optional[str] = Query(
        None, description="Search term for name, designation, email, phone, or company name"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = apis.get_contacts(
        db,
        user_id=current_user.id,
        company_id=company_id,
        search=search,
        skip=skip,
        limit=limit,
    )

    result = []
    for c in items:
        resp = schema.ContactResponse.model_validate(c)
        resp.company_name = c.company.name if c.company else None
        result.append(resp)

    return schema.ContactListResponse(total=total, items=result)


@router.get(
    "/{contact_id}",
    response_model=schema.ContactResponse,
    summary="Get single contact person details",
)
def get_contact_endpoint(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = apis.get_contact_by_id(db, contact_id, current_user.id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact person not found",
        )

    resp = schema.ContactResponse.model_validate(contact)
    resp.company_name = contact.company.name if contact.company else None
    return resp


@router.put(
    "/{contact_id}",
    response_model=schema.ContactResponse,
    summary="Update contact person details",
)
def update_contact_endpoint(
    contact_id: int,
    payload: schema.ContactUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = apis.get_contact_by_id(db, contact_id, current_user.id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact person not found",
        )

    if payload.company_id and payload.company_id != contact.company_id:
        company = get_company_by_id(db, payload.company_id, current_user.id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target company not found",
            )

    updated = apis.update_contact(db, contact, payload)
    resp = schema.ContactResponse.model_validate(updated)
    resp.company_name = updated.company.name if updated.company else None
    return resp


@router.delete(
    "/{contact_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete contact person (soft delete)",
)
def delete_contact_endpoint(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = apis.get_contact_by_id(db, contact_id, current_user.id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact person not found",
        )

    apis.delete_contact(db, contact)
    return {"message": "Contact deleted successfully"}
