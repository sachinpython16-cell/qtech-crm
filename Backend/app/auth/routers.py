from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.auth import models, schema
from app.auth.apis import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    is_blacklisted,
    blacklist_token,
    get_current_user,
    security,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=schema.UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register_user(
    payload: schema.UserRegister, db: Session = Depends(get_db)
):
    # Check if user already exists with either email or username
    existing_user = (
        db.query(models.User)
        .filter(
            or_(
                models.User.email == payload.email,
                models.User.username == payload.username,
            )
        )
        .first()
    )
    if existing_user:
        if existing_user.email == payload.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists",
        )

    # Hash the password and save the new user
    new_user = models.User(
        email=payload.email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post(
    "/login",
    response_model=schema.TokenResponse,
    summary="User login with username/email and password",
)
def login(payload: schema.UserLogin, db: Session = Depends(get_db)):
    # Find user by username or email
    user = (
        db.query(models.User)
        .filter(
            or_(
                models.User.username == payload.identifier,
                models.User.email == payload.identifier,
            )
        )
        .filter(models.User.deleted_at.is_(None))
        .first()
    )

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    token_data = {"sub": user.username}
    access_token = create_access_token(token_data, db)
    refresh_token = create_refresh_token(token_data, db)

    return schema.TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


@router.post(
    "/refresh",
    response_model=schema.TokenResponse,
    summary="Obtain a new access token using a valid refresh token",
)
def refresh_token(
    payload: schema.TokenRefreshRequest, db: Session = Depends(get_db)
):
    decoded = decode_token(payload.refresh_token)
    if not decoded:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if decoded.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Provided token is not a refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    jti = decoded.get("jti")
    if jti and is_blacklisted(jti, db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = decoded.get("user_id")
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

    # Blacklist old refresh token (rotate refresh tokens for security)
    if jti:
        blacklist_token(payload.refresh_token, db)

    # Issue new pair
    token_data = {"sub": user.username}
    new_access_token = create_access_token(token_data, db)
    new_refresh_token = create_refresh_token(token_data, db)

    return schema.TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
    )


@router.post(
    "/logout",
    response_model=schema.MessageResponse,
    summary="Revoke the current authentication token and optional refresh token",
)
def logout(
    payload: Optional[schema.LogoutRequest] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    # Blacklist the current bearer access token
    blacklist_token(credentials.credentials, db)

    # If a refresh token is also passed, blacklist it too
    if payload and payload.refresh_token:
        blacklist_token(payload.refresh_token, db)

    return schema.MessageResponse(message="Successfully logged out")


@router.get(
    "/me",
    response_model=schema.UserResponse,
    summary="Retrieve current logged-in user profile",
)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
