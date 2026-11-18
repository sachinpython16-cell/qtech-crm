from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.apis import get_current_user
from app.auth.models import User
from app.company import schema, apis

router = APIRouter(prefix="/companies", tags=["Client Companies"])


@router.post(
    "",
    response_model=schema.CompanyDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new client company",
)
def create_company_endpoint(
    payload: schema.CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check duplicate
    existing = apis.get_company_by_name(db, payload.name, current_user.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A company named '{payload.name}' already exists in your client list.",
        )

    company = apis.create_company(db, payload, current_user.id)
    stats = apis.calculate_company_statistics(db, company.id)

    response = schema.CompanyDetailResponse.model_validate(company)
    response.stats = stats
    return response


@router.get(
    "",
    response_model=schema.CompanyListResponse,
    summary="List client companies with filtering and search",
)
def list_companies_endpoint(
    status: Optional[str] = Query(
        None, description="Filter by status ('active', 'previous', 'prospect', 'all')"
    ),
    search: Optional[str] = Query(
        None, description="Search term for name, industry, location, or notes"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = apis.get_companies(
        db,
        user_id=current_user.id,
        status=status,
        search=search,
        skip=skip,
        limit=limit,
    )

    result_items = []
    for comp in items:
        resp = schema.CompanyDetailResponse.model_validate(comp)
        resp.stats = apis.calculate_company_statistics(db, comp.id)
        result_items.append(resp)

    return schema.CompanyListResponse(total=total, items=result_items)


@router.get(
    "/{company_id}",
    response_model=schema.CompanyDetailResponse,
    summary="Get single client company details with relationship statistics",
)
def get_company_endpoint(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = apis.get_company_by_id(db, company_id, current_user.id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    response = schema.CompanyDetailResponse.model_validate(company)
    response.stats = apis.calculate_company_statistics(db, company.id)
    return response


@router.put(
    "/{company_id}",
    response_model=schema.CompanyDetailResponse,
    summary="Update client company record",
)
def update_company_endpoint(
    company_id: int,
    payload: schema.CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = apis.get_company_by_id(db, company_id, current_user.id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    # If renaming, verify not duplicate
    if payload.name and payload.name.lower().strip() != company.name.lower():
        duplicate = apis.get_company_by_name(db, payload.name, current_user.id)
        if duplicate and duplicate.id != company.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A company named '{payload.name}' already exists.",
            )

    updated = apis.update_company(db, company, payload)
    response = schema.CompanyDetailResponse.model_validate(updated)
    response.stats = apis.calculate_company_statistics(db, updated.id)
    return response


@router.delete(
    "/{company_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete client company (soft delete)",
)
def delete_company_endpoint(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = apis.get_company_by_id(db, company_id, current_user.id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    apis.delete_company(db, company)
    return {"message": "Company deleted successfully"}
