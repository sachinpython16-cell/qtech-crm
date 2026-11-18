from contextlib import asynccontextmanager
import logging
import uvicorn
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, get_db
from app.auth.routers import router as auth_router
from app.company.routers import router as company_router
from app.contact.routers import router as contact_router
from app.deal.routers import router as deal_router
from app.followup.routers import router as followup_router
from app.interaction.routers import router as interaction_router
from app.dashboard.routers import router as dashboard_router

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan Context Manager.
    Handles startup database verification and graceful connection pool disposal on shutdown.
    """
    # Startup
    logger.info(f"Starting {settings.PROJECT_NAME} in [{settings.ENVIRONMENT.upper()}] mode...")
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info(f"Database connection verified successfully for {settings.PROJECT_NAME}.")
    except Exception as exc:
        logger.error(f"Database startup check failed: {exc}")

    yield

    # Shutdown
    logger.info(f"Disposing database connection pool for {settings.PROJECT_NAME}...")
    engine.dispose()
    logger.info("Database pool disposed cleanly.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="QtechCRM B2B Relationship & Client Management API",
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None,
    lifespan=lifespan,
)

# Production CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api/v1
app.include_router(auth_router, prefix="/api/v1")
app.include_router(company_router, prefix="/api/v1")
app.include_router(contact_router, prefix="/api/v1")
app.include_router(deal_router, prefix="/api/v1")
app.include_router(followup_router, prefix="/api/v1")
app.include_router(interaction_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global fallback exception handler to prevent leaking stack traces in production."""
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc), "type": type(exc).__name__},
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )


@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs" if settings.ENABLE_DOCS else "disabled",
        "health": "/health",
        "ready": "/ready",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Liveness probe: verifies that the web service is responsive."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/ready", tags=["Health"])
def readiness_check(db: Session = Depends(get_db)):
    """Readiness probe: verifies that the database is connected and ready to serve traffic."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "service": settings.PROJECT_NAME,
            "database": "connected",
        }
    except Exception as exc:
        logger.error(f"Readiness check failed: {exc}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unready",
                "service": settings.PROJECT_NAME,
                "database": "unreachable",
            },
        )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else settings.WORKERS,
    )
