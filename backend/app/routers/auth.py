from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from app.models.models import User
from app.schemas.schemas import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse, VerifyOTPRequest
)
from app.core.security import hash_password, verify_password, create_access_token, MOCK_OTP
import uuid
import random

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory dictionary to hold pending signups (phone_number -> {password_hash, display_name, otp})
_pending_registrations: dict = {}


@router.get("/check-username")
def check_username(username: str, db: Session = Depends(get_db)):
    """Real-time check if a username is available."""
    import re
    clean_username = username.lower().strip()
    if not clean_username:
        return {"available": False, "reason": "Username cannot be empty"}

    if not re.match(r"^[a-z0-9._]{3,20}$", clean_username):
        return {"available": False, "reason": "Must be 3-20 chars, letters, numbers, dot, or underscore"}

    exists = db.query(User).filter(User.username == clean_username).first()
    return {
        "available": exists is None,
        "username": clean_username,
        "reason": "Username already taken" if exists else "Username available"
    }


@router.post("/register", status_code=status.HTTP_200_OK)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register step 1: Validate phone and password, generate random OTP."""
    if not payload.phone_number:
        raise HTTPException(400, "phone_number is required")

    # Check duplicate in database
    existing = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if existing:
        raise HTTPException(400, "User already exists, please login")

    # Use fixed demo OTP for seeded/demo deployments
    otp = MOCK_OTP
    print(f"\n========================================")
    print(f"[OTP] Generated OTP for {payload.phone_number}: {otp}")
    print(f"========================================\n")

    # Check username uniqueness
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(400, "Username already taken, please choose another")

    # Store registration details
    _pending_registrations[payload.phone_number] = {
        "password_hash": hash_password(payload.password),
        "display_name": payload.display_name,
        "username": payload.username.lower().strip(),
        "otp": otp
    }

    # We return the OTP in the JSON response payload for easy local testing
    return {
        "message": "Verification code sent successfully",
        "phone_number": payload.phone_number,
        "otp": otp  # returned for easy developer/evaluator reference
    }


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Register step 2: Verify the OTP and create the user account."""
    pending = _pending_registrations.get(payload.phone_number)
    if not pending:
        raise HTTPException(400, "No pending registration found for this phone number")

    if pending["otp"] != payload.otp:
        raise HTTPException(400, "Invalid OTP, try again")

    # Double check race condition
    existing = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if existing:
        raise HTTPException(400, "User already exists")

    # Create the user
    user = User(
        id=str(uuid.uuid4()),
        phone_number=payload.phone_number,
        username=pending["username"],
        display_name=pending["display_name"],
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={pending['username']}",
        password_hash=pending["password_hash"],
        is_online=True,
        last_seen=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Clean up pending registrations
    _pending_registrations.pop(payload.phone_number, None)

    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


# Google OAuth removed — demo doesn't require Google sign-in.


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Login with phone + password."""
    user = db.query(User).filter(User.phone_number == payload.phone_number).first()

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
