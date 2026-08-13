from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from app.models.models import User
from app.schemas.schemas import (
    RegisterRequest, VerifyOTPRequest, LoginRequest, TokenResponse, UserResponse
)
from app.core.security import hash_password, verify_password, create_access_token, verify_mock_otp
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory pending registrations (phone/username → hashed_password)
_pending: dict = {}


@router.post("/register", status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Step 1: register with phone/username + password → mock OTP is always 123456."""
    identifier = payload.phone_number or payload.username
    if not identifier:
        raise HTTPException(400, "phone_number or username required")

    # Check duplicate
    existing = db.query(User).filter(
        (User.phone_number == payload.phone_number) | (User.username == payload.username)
    ).first()
    if existing:
        raise HTTPException(400, "User already registered")

    _pending[identifier] = hash_password(payload.password)
    return {"message": "OTP sent (use 123456)", "otp_hint": "123456"}


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Step 2: verify OTP + set display name → issue JWT."""
    identifier = payload.phone_number or payload.username
    if not identifier:
        raise HTTPException(400, "phone_number or username required")

    if not verify_mock_otp(payload.otp):
        raise HTTPException(400, "Invalid OTP")

    password_hash = _pending.get(identifier)
    if not password_hash:
        raise HTTPException(400, "No pending registration. Call /auth/register first.")

    # Check duplicate again (race condition guard)
    existing = db.query(User).filter(
        (User.phone_number == payload.phone_number) | (User.username == payload.username)
    ).first()
    if existing:
        raise HTTPException(400, "User already exists")

    user = User(
        id=str(uuid.uuid4()),
        phone_number=payload.phone_number,
        username=payload.username,
        display_name=payload.display_name,
        avatar_url=payload.avatar_url,
        password_hash=password_hash,
        is_online=True,
        last_seen=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _pending.pop(identifier, None)

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
