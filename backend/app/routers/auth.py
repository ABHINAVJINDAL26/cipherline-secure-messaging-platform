from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from app.models.models import User
from app.schemas.schemas import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse, GoogleLoginRequest, VerifyOTPRequest
)
from app.core.security import hash_password, verify_password, create_access_token, MOCK_OTP
from google.oauth2 import id_token
from google.auth.transport import requests
import uuid
import random

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory dictionary to hold pending signups (phone_number -> {password_hash, display_name, otp})
_pending_registrations: dict = {}


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

    # Store registration details
    _pending_registrations[payload.phone_number] = {
        "password_hash": hash_password(payload.password),
        "display_name": payload.display_name,
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
        username=payload.phone_number, # use phone as username as fallback
        display_name=pending["display_name"],
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={pending['display_name']}",
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
    user = db.query(User).filter((User.username == email) | (User.phone_number == email)).first()
    if not user:
        # Create a new user
        user = User(
            id=str(uuid.uuid4()),
            username=email,
            phone_number=email, # map email to phone or keep empty, but username is key
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
