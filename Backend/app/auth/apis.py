from datetime import timedelta
from typing import Optional, Dict, Any
from uuid import uuid4
from jose import jwt, JWTError
from passlib.context import CryptContext  # type: ignore
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_MINUTES,
    now_utc,
)
from app.database import get_db
from app.auth import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hashes a plain password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against its hashed version."""
    return pwd_context.verify(plain_password, hashed_password)


def create_token(
    data: Dict[str, Any], expires_minutes: int, token_type: str, db: Session
) -> str:
    """Generates an encoded JWT token and records an OutstandingToken entry."""
    to_encode = data.copy()
    expire = now_utc() + timedelta(minutes=expires_minutes)
    jti = str(uuid4())

    db_user = (
        db.query(models.User)
        .filter(
            (models.User.username == data["sub"])
            | (models.User.email == data["sub"])
        )
        .first()
    )
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    to_encode.update(
        {
            "exp": expire,
            "type": token_type,
            "jti": jti,
            "user_id": db_user.id,
            "sub": db_user.username,
        }
    )
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    db_token = models.OutstandingToken(
        jti=jti, user_id=db_user.id, token_type=token_type
    )
    db.add(db_token)
    db.commit()
    return token


def create_access_token(data: Dict[str, Any], db: Session) -> str:
    """Creates a short-lived access token."""
    return create_token(data, ACCESS_TOKEN_EXPIRE_MINUTES, "access", db)


def create_refresh_token(data: Dict[str, Any], db: Session) -> str:
    """Creates a longer-lived refresh token."""
    return create_token(data, REFRESH_TOKEN_EXPIRE_MINUTES, "refresh", db)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes a JWT token safely, returning its payload or None if invalid."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def is_blacklisted(jti: str, db: Session) -> bool:
    """Checks whether the given token JTI is in the blacklist."""
    return (
        db.query(models.BlacklistToken)
        .filter(models.BlacklistToken.jti == jti)
        .first()
        is not None
    )


def blacklist_token(token: str, db: Session) -> bool:
    """Adds a token's JTI to the blacklist tokens table."""
    payload = decode_token(token)
    if payload:
        jti = payload.get("jti")
        if jti and not is_blacklisted(jti, db):
            db.add(models.BlacklistToken(jti=jti))
            db.commit()
            return True
    return False


def get_token_type(token: str) -> Optional[str]:
    """Retrieves the token type (access/refresh) from a token payload."""
    payload = decode_token(token)
    return payload.get("type") if payload else None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    """FastAPI dependency to extract and authenticate the current user via JWT bearer."""
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type for authentication",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check blacklist
    jti = payload.get("jti")
    if jti and is_blacklisted(jti, db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .filter(models.User.deleted_at.is_(None))
        .filter(models.User.is_active == True)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
