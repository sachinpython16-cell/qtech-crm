from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.apis import get_current_user
from app.auth.models import User
from app.dashboard import schema, apis

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Lookup"])


@router.get(
    "/metrics",
    response_model=schema.DashboardMetricsResponse,
    summary="Get aggregated CRM metrics for the dashboard",
)
def get_metrics_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return apis.get_dashboard_metrics(db, current_user.id)


@router.get(
    "/lookup",
    response_model=schema.RelationshipLookupResponse,
    summary="Instant universal relationship lookup across companies, contacts, and deals",
)
def universal_lookup_endpoint(
    q: str = Query(..., min_length=1, description="Search across companies, emails, phone numbers, and people"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return apis.universal_relationship_lookup(db, current_user.id, q)
