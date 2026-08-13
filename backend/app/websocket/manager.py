"""
WebSocket Connection Manager
Handles real-time messaging, typing indicators, and presence updates.
"""
import json
from typing import Dict, List
from fastapi import WebSocket
from sqlalchemy.orm import Session
from app.models.models import ConversationMember


class ConnectionManager:
    def __init__(self):
        # user_id → WebSocket
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)

    async def send_personal(self, user_id: str, data: dict):
        """Send a message to a specific user."""
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(user_id)

    async def broadcast_to_conversation(
        self, conversation_id: str, data: dict, db: Session
    ):
        """Broadcast a message to all online members of a conversation."""
        members = (
            db.query(ConversationMember)
            .filter(ConversationMember.conversation_id == conversation_id)
            .all()
        )
        for member in members:
            await self.send_personal(member.user_id, data)

    async def broadcast_presence(self, user_id: str, is_online: bool, last_seen: str):
        """Broadcast online/offline status to all connected users."""
        data = {
            "type": "presence:update",
            "user_id": user_id,
            "is_online": is_online,
            "last_seen": last_seen,
        }
        for uid, ws in list(self.active_connections.items()):
            if uid != user_id:
                try:
                    await ws.send_json(data)
                except Exception:
                    self.disconnect(uid)


# Singleton manager
manager = ConnectionManager()
