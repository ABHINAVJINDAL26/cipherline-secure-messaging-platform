import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, Text, ForeignKey,
    Enum as SAEnum, UniqueConstraint, func
)
from sqlalchemy.orm import relationship
from database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class ConversationType(str, enum.Enum):
    direct = "direct"
    group = "group"


class MemberRole(str, enum.Enum):
    member = "member"
    admin = "admin"


class MessageStatusEnum(str, enum.Enum):
    sent = "sent"
    delivered = "delivered"
    read = "read"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    phone_number = Column(String, unique=True, nullable=True, index=True)
    username = Column(String, unique=True, nullable=True, index=True)
    display_name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    about_status = Column(String, nullable=True, default="Hey there! I am using Signal.")
    password_hash = Column(String, nullable=True)
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sent_messages = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")
    memberships = relationship("ConversationMember", back_populates="user")
    contacts_owned = relationship("Contact", back_populates="owner", foreign_keys="Contact.owner_id")
    message_statuses = relationship("MessageStatus", back_populates="user")
    message_reactions = relationship("MessageReaction", back_populates="user")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=gen_uuid)
    type = Column(SAEnum(ConversationType), nullable=False, default=ConversationType.direct)
    group_name = Column(String, nullable=True)
    group_avatar_url = Column(String, nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    last_message_id = Column(String, ForeignKey("messages.id", use_alter=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    members = relationship("ConversationMember", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship(
        "Message",
        back_populates="conversation",
        foreign_keys="Message.conversation_id",
        cascade="all, delete-orphan",
    )
    last_message = relationship("Message", foreign_keys=[last_message_id], post_update=True)


class ConversationMember(Base):
    __tablename__ = "conversation_members"

    id = Column(String, primary_key=True, default=gen_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(SAEnum(MemberRole), nullable=False, default=MemberRole.member)
    is_muted = Column(Boolean, default=False)
    is_pinned = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("conversation_id", "user_id", name="uq_conv_user"),)

    # Relationships
    conversation = relationship("Conversation", back_populates="members")
    user = relationship("User", back_populates="memberships")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=gen_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=True)
    attachment_url = Column(String, nullable=True)
    reply_to_message_id = Column(String, ForeignKey("messages.id"), nullable=True)
    is_deleted = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sender = relationship("User", back_populates="sent_messages", foreign_keys=[sender_id])
    conversation = relationship(
        "Conversation",
        back_populates="messages",
        foreign_keys=[conversation_id],
    )
    reply_to = relationship("Message", remote_side="Message.id", foreign_keys=[reply_to_message_id])
    statuses = relationship("MessageStatus", back_populates="message", cascade="all, delete-orphan")
    reactions = relationship("MessageReaction", back_populates="message", cascade="all, delete-orphan")


class MessageStatus(Base):
    __tablename__ = "message_status"

    id = Column(String, primary_key=True, default=gen_uuid)
    message_id = Column(String, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(SAEnum(MessageStatusEnum), nullable=False, default=MessageStatusEnum.sent)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint("message_id", "user_id", name="uq_msg_user_status"),)

    # Relationships
    message = relationship("Message", back_populates="statuses")
    user = relationship("User", back_populates="message_statuses")


class MessageReaction(Base):
    __tablename__ = "message_reactions"

    id = Column(String, primary_key=True, default=gen_uuid)
    message_id = Column(String, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    emoji = Column(String, nullable=False)

    __table_args__ = (UniqueConstraint("message_id", "user_id", "emoji", name="uq_msg_user_emoji"),)

    # Relationships
    message = relationship("Message", back_populates="reactions")
    user = relationship("User", back_populates="message_reactions")


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(String, primary_key=True, default=gen_uuid)
    owner_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    contact_user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    nickname = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("owner_id", "contact_user_id", name="uq_owner_contact"),)

    # Relationships
    owner = relationship("User", back_populates="contacts_owned", foreign_keys=[owner_id])
    contact_user = relationship("User", foreign_keys=[contact_user_id])
