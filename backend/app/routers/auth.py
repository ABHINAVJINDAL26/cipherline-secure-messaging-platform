from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from app.models.models import User
from app.schemas.schemas import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse, GoogleLoginRequest
)
from app.core.security import hash_password, verify_password, create_access_token
from google.oauth2 import id_token
from google.auth.transport import requests
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register directly with username/phone, display name, password → returns JWT."""
    identifier = payload.phone_number or payload.username
    if not identifier:
        raise HTTPException(400, "phone_number or username required")

    # Check duplicate
    existing = db.query(User).filter(
        (User.phone_number == payload.phone_number) | (User.username == payload.username)
    ).first()
    if existing:
        raise HTTPException(400, "User already registered")

    user = User(
        id=str(uuid.uuid4()),
        phone_number=payload.phone_number,
        username=payload.username,
        display_name=payload.display_name,
        avatar_url=payload.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={payload.display_name}",
        password_hash=hash_password(payload.password),
        is_online=True,
        last_seen=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Log in or sign up using Google ID Token (OAuth 2.0)."""
    try:
        # Verify Google Token
        idinfo = id_token.verify_oauth2_token(payload.credential, requests.Request())
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")

    email = idinfo.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email address")

    display_name = idinfo.get("name") or email.split("@")[0]
    avatar_url = idinfo.get("picture")

    # Try finding user by email/username
    user = db.query(User).filter(User.username == email).first()
    if not user:
        # Create a new user
        user = User(
            id=str(uuid.uuid4()),
            username=email,
            display_name=display_name,
            avatar_url=avatar_url,
            password_hash=None,  # OAuth users have no password hash locally
            is_online=True,
            last_seen=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update details and set online
        user.is_online = True
        user.last_seen = datetime.utcnow()
        if avatar_url:
            user.avatar_url = avatar_url
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Login with phone/username + password."""
    user = db.query(User).filter(
        (User.phone_number == payload.phone_number) | (User.username == payload.username)
    ).first()

    if not user or not verify_password(payload.password, user.password_hash or ""):
        raise HTTPException(401, "Invalid credentials")

    # Mark online
    user.is_online = True
    user.last_seen = datetime.utcnow()
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout")
def logout(db: Session = Depends(get_db)):
    """Logout — client drops JWT. Server doesn't track tokens (stateless)."""
    return {"message": "Logged out successfully"}
