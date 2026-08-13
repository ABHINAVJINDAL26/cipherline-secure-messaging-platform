from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from database import get_db
from app.models.models import User, Contact
from app.schemas.schemas import ContactResponse, AddContactRequest
from app.core.deps import get_current_user

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("/", response_model=List[ContactResponse])
def list_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Contact)
        .filter(Contact.owner_id == current_user.id)
        .order_by(Contact.created_at.desc())
        .all()
    )


@router.post("/", response_model=ContactResponse, status_code=201)
def add_contact(
    payload: AddContactRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Resolve target user
    if payload.contact_user_id:
        target = db.query(User).filter(User.id == payload.contact_user_id).first()
    elif payload.phone_number:
        target = db.query(User).filter(User.phone_number == payload.phone_number).first()
    elif payload.username:
        target = db.query(User).filter(User.username == payload.username).first()
    else:
        raise HTTPException(400, "Provide contact_user_id, phone_number, or username")

    if not target:
        raise HTTPException(404, "User not found")
    if target.id == current_user.id:
        raise HTTPException(400, "Cannot add yourself as a contact")

    # Check duplicate
    existing = db.query(Contact).filter(
        Contact.owner_id == current_user.id,
        Contact.contact_user_id == target.id,
    ).first()
    if existing:
        raise HTTPException(400, "Contact already added")

    contact = Contact(
        id=str(uuid.uuid4()),
        owner_id=current_user.id,
        contact_user_id=target.id,
        nickname=payload.nickname,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=204)
def remove_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.owner_id == current_user.id,
    ).first()
    if not contact:
        raise HTTPException(404, "Contact not found")
    db.delete(contact)
    db.commit()
    return None
