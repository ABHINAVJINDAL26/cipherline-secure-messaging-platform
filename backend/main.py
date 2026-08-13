"""
Signal Clone — FastAPI Backend
Entry point: uvicorn main:app --reload
"""
import json
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from app.core.config import settings
from app.core.security import decode_access_token
from app.models.models import User, Conversation, ConversationMember, Message, MessageStatus, MessageStatusEnum
from app.routers import auth, users, contacts, conversations
from app.websocket.manager import manager
from app.schemas.schemas import MessageResponse

import uuid

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Signal Clone API",
    description="Real-time messaging backend for Signal Clone",
    version="1.0.0",
)

# CORS — allow frontend dev server + production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "*",  # During development — tighten for production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(contacts.router)
app.include_router(conversations.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "Signal Clone API is running 🔒"}


@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: str = None,
    db: Session = Depends(get_db),
):
    """
    WebSocket connection for real-time features.
    Client connects to: ws://localhost:8000/ws/{user_id}?token=<JWT>
    
    Supported incoming event types:
      - message:send      { conversation_id, content, reply_to_message_id? }
      - typing:start      { conversation_id }
      - typing:stop       { conversation_id }
      - ping              (keepalive)
    """
    # Authenticate via token query param
    # FastAPI WebSocket doesn't support Authorization header natively
    # so we pass token as query param
    from fastapi import Query
    import urllib.parse

    # Parse token from query string
    query_string = websocket.scope.get("query_string", b"").decode()
    params = dict(urllib.parse.parse_qsl(query_string))
    token = params.get("token", "")

    if token:
        payload = decode_access_token(token)
        if not payload or payload.get("sub") != user_id:
            await websocket.close(code=4001)
            return
    else:
        await websocket.close(code=4001)
        return

    # Connect
    await manager.connect(websocket, user_id)

    # Mark user online
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_online = True
        user.last_seen = datetime.utcnow()
        db.commit()
        # Broadcast presence
        await manager.broadcast_presence(user_id, True, user.last_seen.isoformat())

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            event_type = data.get("type", "")

            # --- Typing indicators ---
            if event_type in ("typing:start", "typing:stop"):
                conv_id = data.get("conversation_id")
                if conv_id:
                    await manager.broadcast_to_conversation(
                        conv_id,
                        {
                            "type": event_type,
                            "conversation_id": conv_id,
                            "user_id": user_id,
                        },
                        db,
                    )

            # --- Send message ---
            elif event_type == "message:send":
                conv_id = data.get("conversation_id")
                content = data.get("content", "").strip()
                reply_to = data.get("reply_to_message_id")

                if not conv_id or not content:
                    continue

                # Verify membership
                member = db.query(ConversationMember).filter(
                    ConversationMember.conversation_id == conv_id,
                    ConversationMember.user_id == user_id,
                ).first()
                if not member:
                    continue

                # Persist message
                msg = Message(
                    id=str(uuid.uuid4()),
                    conversation_id=conv_id,
                    sender_id=user_id,
                    content=content,
                    reply_to_message_id=reply_to,
                    created_at=datetime.utcnow(),
                )
                db.add(msg)
                db.flush()

                # Add sent status for sender
                db.add(MessageStatus(
                    id=str(uuid.uuid4()),
                    message_id=msg.id,
                    user_id=user_id,
                    status=MessageStatusEnum.sent,
                ))

                # Add delivered status for all other members
                conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
                if conv:
                    for m in conv.members:
                        if m.user_id != user_id:
                            db.add(MessageStatus(
                                id=str(uuid.uuid4()),
                                message_id=msg.id,
                                user_id=m.user_id,
                                status=MessageStatusEnum.delivered,
                            ))
                    conv.last_message_id = msg.id

                db.commit()
                db.refresh(msg)

                # Broadcast to conversation
                msg_data = MessageResponse.model_validate(msg).model_dump(mode="json")
                await manager.broadcast_to_conversation(
                    conv_id,
                    {"type": "message:new", "message": msg_data},
                    db,
                )

            # --- Ping/pong keepalive ---
            elif event_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(user_id)
        # Mark user offline
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_online = False
            user.last_seen = datetime.utcnow()
            db.commit()
            await manager.broadcast_presence(user_id, False, user.last_seen.isoformat())
