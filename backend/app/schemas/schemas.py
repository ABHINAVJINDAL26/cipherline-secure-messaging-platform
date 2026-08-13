from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.models import ConversationType, MemberRole, MessageStatusEnum


# ---------------------------------------------------------------------------
# Auth Schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    phone_number: str
    password: str
    display_name: str
    username: str


class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp: str


class LoginRequest(BaseModel):
    phone_number: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# ---------------------------------------------------------------------------
# User Schemas
# ---------------------------------------------------------------------------

class UserResponse(BaseModel):
    id: str
    phone_number: Optional[str] = None
    username: Optional[str] = None
    display_name: str
    avatar_url: Optional[str] = None
    about_status: Optional[str] = None
    is_online: bool
    last_seen: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    about_status: Optional[str] = None
    username: Optional[str] = None


# ---------------------------------------------------------------------------
# Contact Schemas
# ---------------------------------------------------------------------------

class ContactResponse(BaseModel):
    id: str
    contact_user: UserResponse
    nickname: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AddContactRequest(BaseModel):
    contact_user_id: Optional[str] = None
    phone_number: Optional[str] = None
    username: Optional[str] = None
    nickname: Optional[str] = None


# ---------------------------------------------------------------------------
# Message Schemas
# ---------------------------------------------------------------------------

class MessageStatusResponse(BaseModel):
    user_id: str
    status: MessageStatusEnum
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageReactionResponse(BaseModel):
    id: str
    user_id: str
    emoji: str
    user: UserResponse

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender: UserResponse
    content: Optional[str] = None
    attachment_url: Optional[str] = None
    reply_to_message_id: Optional[str] = None
    reply_to: Optional["MessageResponse"] = None
    client_temp_id: Optional[str] = None
    is_deleted: bool
    expires_at: Optional[datetime] = None
    created_at: datetime
    statuses: List[MessageStatusResponse] = []
    reactions: List[MessageReactionResponse] = []

    class Config:
        from_attributes = True


class SendMessageRequest(BaseModel):
    content: Optional[str] = None
    reply_to_message_id: Optional[str] = None
    client_temp_id: Optional[str] = None


class AddReactionRequest(BaseModel):
    emoji: str


# ---------------------------------------------------------------------------
# Conversation Schemas
# ---------------------------------------------------------------------------

class ConversationMemberResponse(BaseModel):
    id: str
    user: UserResponse
    role: MemberRole
    is_muted: bool
    is_pinned: bool
    joined_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: str
    type: ConversationType
    group_name: Optional[str] = None
    group_avatar_url: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    members: List[ConversationMemberResponse] = []
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0

    class Config:
        from_attributes = True


class CreateConversationRequest(BaseModel):
    type: ConversationType = ConversationType.direct
    target_user_id: Optional[str] = None   # for direct chats
    group_name: Optional[str] = None        # for groups
    group_avatar_url: Optional[str] = None
    member_ids: Optional[List[str]] = None  # for groups


class UpdateConversationRequest(BaseModel):
    group_name: Optional[str] = None
    group_avatar_url: Optional[str] = None


class AddMemberRequest(BaseModel):
    user_id: str


# ---------------------------------------------------------------------------
# WebSocket Schemas
# ---------------------------------------------------------------------------

class WSMessageSend(BaseModel):
    type: str = "message:send"
    conversation_id: str
    content: Optional[str] = None
    reply_to_message_id: Optional[str] = None


class WSTyping(BaseModel):
    type: str  # "typing:start" | "typing:stop"
    conversation_id: str


class WSPresence(BaseModel):
    type: str = "presence:update"
    user_id: str
    is_online: bool
    last_seen: str


# Fix forward reference
MessageResponse.model_rebuild()
TokenResponse.model_rebuild()
