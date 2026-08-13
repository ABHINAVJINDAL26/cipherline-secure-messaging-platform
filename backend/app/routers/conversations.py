from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc
from typing import List, Optional
from datetime import datetime
import uuid
from database import get_db
from app.models.models import (
    User, Conversation, ConversationMember, Message, MessageStatus,
    MessageReaction, ConversationType, MemberRole, MessageStatusEnum
)
from app.schemas.schemas import (
    ConversationResponse, CreateConversationRequest, UpdateConversationRequest,
    MessageResponse, SendMessageRequest, AddMemberRequest,
    AddReactionRequest, ConversationMemberResponse, UserResponse,
    MessageStatusResponse, MessageReactionResponse
)
from app.core.deps import get_current_user
from app.websocket.manager import manager

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _build_conversation_response(conv: Conversation, current_user_id: str) -> dict:
    """Helper to build conversation dict with unread_count."""
    # Count unread messages for current user
    unread = 0
    if conv.messages:
        for msg in conv.messages:
            if msg.sender_id != current_user_id:
                status = next(
                    (s for s in msg.statuses if s.user_id == current_user_id), None
                )
                if not status or status.status == MessageStatusEnum.sent or status.status == MessageStatusEnum.delivered:
                    unread += 1
    return conv


@router.get("/", response_model=List[ConversationResponse])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all conversations for current user, sorted by most recent activity."""
    memberships = (
        db.query(ConversationMember)
        .filter(ConversationMember.user_id == current_user.id)
        .all()
    )
    conv_ids = [m.conversation_id for m in memberships]

    conversations = (
        db.query(Conversation)
        .filter(Conversation.id.in_(conv_ids))
        .options(
            joinedload(Conversation.members).joinedload(ConversationMember.user),
            joinedload(Conversation.last_message).joinedload(Message.sender),
            joinedload(Conversation.last_message).joinedload(Message.statuses),
            joinedload(Conversation.last_message).joinedload(Message.reactions).joinedload(MessageReaction.user),
        )
        .all()
    )

    # Sort by last message created_at desc
    conversations.sort(
        key=lambda c: (c.last_message.created_at if c.last_message else c.created_at),
        reverse=True,
    )

    result = []
    for conv in conversations:
        # Compute unread
        unread = 0
        all_msgs = db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user.id,
            Message.is_deleted == False,
        ).all()
        for msg in all_msgs:
            st = next((s for s in msg.statuses if s.user_id == current_user.id), None)
            if not st or st.status != MessageStatusEnum.read:
                unread += 1

        conv_dict = ConversationResponse.model_validate(conv).model_dump()
        conv_dict["unread_count"] = unread
        result.append(conv_dict)

    return result


@router.post("/", response_model=ConversationResponse, status_code=201)
def create_conversation(
    payload: CreateConversationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.type == ConversationType.direct:
        if not payload.target_user_id:
            raise HTTPException(400, "target_user_id required for direct conversation")

        target = db.query(User).filter(User.id == payload.target_user_id).first()
        if not target:
            raise HTTPException(404, "Target user not found")

        # Check if direct conversation already exists
        my_convs = [
            m.conversation_id
            for m in db.query(ConversationMember)
            .filter(ConversationMember.user_id == current_user.id)
            .all()
        ]
        target_convs = [
            m.conversation_id
            for m in db.query(ConversationMember)
            .filter(ConversationMember.user_id == target.id)
            .all()
        ]
        shared = set(my_convs) & set(target_convs)
        for conv_id in shared:
            conv = db.query(Conversation).filter(
                Conversation.id == conv_id,
                Conversation.type == ConversationType.direct,
            ).first()
            if conv:
                return conv

        # Create new direct conversation
        conv = Conversation(
            id=str(uuid.uuid4()),
            type=ConversationType.direct,
            created_by=current_user.id,
        )
        db.add(conv)
        db.flush()

        for uid in [current_user.id, target.id]:
            db.add(ConversationMember(
                id=str(uuid.uuid4()),
                conversation_id=conv.id,
                user_id=uid,
                role=MemberRole.member,
            ))

    else:  # group
        if not payload.group_name:
            raise HTTPException(400, "group_name required for group conversation")

        member_ids = list(set(payload.member_ids or []))
        if current_user.id not in member_ids:
            member_ids.append(current_user.id)

        conv = Conversation(
            id=str(uuid.uuid4()),
            type=ConversationType.group,
            group_name=payload.group_name,
            group_avatar_url=payload.group_avatar_url,
            created_by=current_user.id,
        )
        db.add(conv)
        db.flush()

        for uid in member_ids:
            role = MemberRole.admin if uid == current_user.id else MemberRole.member
            db.add(ConversationMember(
                id=str(uuid.uuid4()),
                conversation_id=conv.id,
                user_id=uid,
                role=role,
            ))

    db.commit()
    db.refresh(conv)
    return conv


@router.get("/{conv_id}", response_model=ConversationResponse)
def get_conversation(
    conv_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == current_user.id,
    ).first()
    if not member:
        raise HTTPException(403, "Not a member of this conversation")

    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(404, "Conversation not found")
    return conv


@router.patch("/{conv_id}", response_model=ConversationResponse)
def update_conversation(
    conv_id: str,
    payload: UpdateConversationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == current_user.id,
        ConversationMember.role == MemberRole.admin,
    ).first()
    if not member:
        raise HTTPException(403, "Admin access required")

    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(404, "Not found")

    if payload.group_name:
        conv.group_name = payload.group_name
    if payload.group_avatar_url:
        conv.group_avatar_url = payload.group_avatar_url
    db.commit()
    db.refresh(conv)
    return conv


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

@router.get("/{conv_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conv_id: str,
    limit: int = Query(50, le=100),
    before: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == current_user.id,
    ).first()
    if not member:
        raise HTTPException(403, "Not a member")

    query = (
        db.query(Message)
        .filter(Message.conversation_id == conv_id, Message.is_deleted == False)
        .options(
            joinedload(Message.sender),
            joinedload(Message.statuses),
            joinedload(Message.reactions).joinedload(MessageReaction.user),
            joinedload(Message.reply_to).joinedload(Message.sender),
        )
        .order_by(desc(Message.created_at))
    )

    if before:
        ref_msg = db.query(Message).filter(Message.id == before).first()
        if ref_msg:
            query = query.filter(Message.created_at < ref_msg.created_at)

    messages = query.limit(limit).all()
    messages.reverse()  # Chronological order

    # Mark messages as delivered/read for current user
    for msg in messages:
        if msg.sender_id != current_user.id:
            st = next((s for s in msg.statuses if s.user_id == current_user.id), None)
            if not st:
                db.add(MessageStatus(
                    id=str(uuid.uuid4()),
                    message_id=msg.id,
                    user_id=current_user.id,
                    status=MessageStatusEnum.read,
                ))
            elif st.status != MessageStatusEnum.read:
                st.status = MessageStatusEnum.read
                st.updated_at = datetime.utcnow()

    db.commit()

    # Broadcast read receipts via WebSocket
    for msg in messages:
        if msg.sender_id != current_user.id:
            await manager.broadcast_to_conversation(
                conv_id,
                {
                    "type": "message:status_update",
                    "message_id": msg.id,
                    "user_id": current_user.id,
                    "status": "read",
                },
                db,
            )

    return messages


@router.post("/{conv_id}/messages", response_model=MessageResponse, status_code=201)
async def send_message(
    conv_id: str,
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == current_user.id,
    ).first()
    if not member:
        raise HTTPException(403, "Not a member")

    if not payload.content:
        raise HTTPException(400, "Message content required")

    msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conv_id,
        sender_id=current_user.id,
        content=payload.content,
        reply_to_message_id=payload.reply_to_message_id,
        created_at=datetime.utcnow(),
    )
    db.add(msg)
    db.flush()

    # Create "sent" status for sender
    db.add(MessageStatus(
        id=str(uuid.uuid4()),
        message_id=msg.id,
        user_id=current_user.id,
        status=MessageStatusEnum.sent,
    ))

    # Create "delivered" status for all other members
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    for m in conv.members:
        if m.user_id != current_user.id:
            db.add(MessageStatus(
                id=str(uuid.uuid4()),
                message_id=msg.id,
                user_id=m.user_id,
                status=MessageStatusEnum.delivered,
            ))

    # Update last_message_id on conversation
    conv.last_message_id = msg.id
    db.commit()
    db.refresh(msg)

    # Broadcast to all members in the conversation via WebSocket
    msg_data = MessageResponse.model_validate(msg).model_dump(mode="json")
    if payload.client_temp_id:
        msg_data["client_temp_id"] = payload.client_temp_id

    await manager.broadcast_to_conversation(
        conv_id,
        {"type": "message:new", "message": msg_data},
        db,
    )

    # Return the message with the client_temp_id included for the sender
    response_model = MessageResponse.model_validate(msg)
    response_model.client_temp_id = payload.client_temp_id
    return response_model


# ---------------------------------------------------------------------------
# Members (Group admin controls)
# ---------------------------------------------------------------------------

@router.get("/{conv_id}/members", response_model=List[ConversationMemberResponse])
def list_members(
    conv_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == current_user.id,
    ).first()
    if not member:
        raise HTTPException(403, "Not a member")
    return db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id
    ).all()


@router.post("/{conv_id}/members", response_model=ConversationMemberResponse, status_code=201)
def add_member(
    conv_id: str,
    payload: AddMemberRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only admin can add
    admin = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == current_user.id,
        ConversationMember.role == MemberRole.admin,
    ).first()
    if not admin:
        raise HTTPException(403, "Admin access required")

    # Check user exists
    target = db.query(User).filter(User.id == payload.user_id).first()
    if not target:
        raise HTTPException(404, "User not found")

    # Check already member
    existing = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == payload.user_id,
    ).first()
    if existing:
        raise HTTPException(400, "Already a member")

    new_member = ConversationMember(
        id=str(uuid.uuid4()),
        conversation_id=conv_id,
        user_id=payload.user_id,
        role=MemberRole.member,
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member


@router.delete("/{conv_id}/members/{user_id}", status_code=204)
def remove_member(
    conv_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Admin can remove others; anyone can leave (remove themselves)
    requester = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == current_user.id,
    ).first()
    if not requester:
        raise HTTPException(403, "Not a member")

    if user_id != current_user.id and requester.role != MemberRole.admin:
        raise HTTPException(403, "Admin access required to remove others")

    target_member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == user_id,
    ).first()
    if not target_member:
        raise HTTPException(404, "Member not found")

    db.delete(target_member)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Reactions
# ---------------------------------------------------------------------------

@router.post("/{conv_id}/messages/{msg_id}/reactions", status_code=201)
async def add_reaction(
    conv_id: str,
    msg_id: str,
    payload: AddReactionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == current_user.id,
    ).first()
    if not member:
        raise HTTPException(403, "Not a member")

    # Toggle: if exists, remove; else add
    existing = db.query(MessageReaction).filter(
        MessageReaction.message_id == msg_id,
        MessageReaction.user_id == current_user.id,
        MessageReaction.emoji == payload.emoji,
    ).first()

    if existing:
        db.delete(existing)
        action = "removed"
    else:
        db.add(MessageReaction(
            id=str(uuid.uuid4()),
            message_id=msg_id,
            user_id=current_user.id,
            emoji=payload.emoji,
        ))
        action = "added"

    db.commit()

    await manager.broadcast_to_conversation(
        conv_id,
        {
            "type": "message:reaction",
            "message_id": msg_id,
            "user_id": current_user.id,
            "emoji": payload.emoji,
            "action": action,
        },
        db,
    )
    return {"action": action}
