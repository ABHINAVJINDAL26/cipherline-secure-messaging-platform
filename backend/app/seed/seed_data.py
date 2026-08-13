# -*- coding: utf-8 -*-
"""
Seed script — populates the database with realistic fake data:
  - 9 users (including a demo user: username=demo, password=demo123)
  - Mix of DM and group conversations
  - 50+ messages with varied content
  - Message statuses and read receipts
  - Contacts
"""
import sys
import os
import uuid
from datetime import datetime, timedelta
import random

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database import SessionLocal, engine, Base
from app.models.models import (
    User, Conversation, ConversationMember, Message, MessageStatus,
    MessageReaction, Contact, ConversationType, MemberRole, MessageStatusEnum
)
from app.core.security import hash_password


def random_time(days_ago_max=7, days_ago_min=0) -> datetime:
    offset = timedelta(
        days=random.randint(days_ago_min, days_ago_max),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
    )
    return datetime.utcnow() - offset


AVATAR_URLS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Dave",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Eve",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Frank",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Grace",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Heidi",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan",
]

USERS_DATA = [
    {"username": "demo",   "display_name": "Demo User",      "phone": "+1-555-0001", "about": "👋 I'm the demo account!"},
    {"username": "alice",  "display_name": "Alice Johnson",  "phone": "+1-555-0101", "about": "Privacy matters. 🔒"},
    {"username": "bob",    "display_name": "Bob Martinez",   "phone": "+1-555-0102", "about": "Backend dev @ Startup"},
    {"username": "carol",  "display_name": "Carol White",    "phone": "+1-555-0103", "about": "Design is how it works 🎨"},
    {"username": "dave",   "display_name": "Dave Brown",     "phone": "+1-555-0104", "about": "Coffee + Code ☕"},
    {"username": "eve",    "display_name": "Eve Wilson",     "phone": "+1-555-0105", "about": "Security researcher 🛡️"},
    {"username": "frank",  "display_name": "Frank Garcia",   "phone": "+1-555-0106", "about": "Building things that matter"},
    {"username": "grace",  "display_name": "Grace Lee",      "phone": "+1-555-0107", "about": "Machine Learning Engineer"},
    {"username": "heidi",  "display_name": "Heidi Chen",     "phone": "+1-555-0108", "about": "Life is short, use Signal 😄"},
]

DM_MESSAGES = [
    [
        ("alice", "Hey! Did you check out the new Signal update?"),
        ("demo", "Not yet! What's new?"),
        ("alice", "They added better group calling features 🎉"),
        ("demo", "Nice! Signal keeps getting better"),
        ("alice", "Agreed. Privacy first always 🔒"),
        ("demo", "100%. Speaking of which, did you read about that data breach?"),
        ("alice", "Yeah, scary stuff. That's why I only use Signal now"),
        ("demo", "Smart move. Tell all your friends too!"),
        ("alice", "Already on it 😄"),
        ("demo", "You're the best 👍"),
    ],
    [
        ("bob", "Hey, are you free for a call later?"),
        ("demo", "Sure! What time?"),
        ("bob", "Around 4pm work for you?"),
        ("demo", "Perfect, I'll be free then"),
        ("bob", "Great! We need to discuss the backend refactor"),
        ("demo", "Yeah, I've been thinking about moving to async everywhere"),
        ("bob", "Exactly what I was thinking. FastAPI is really solid"),
        ("demo", "Agreed. The WebSocket support is top-notch"),
        ("bob", "See you at 4 then!"),
        ("demo", "Looking forward to it 🚀"),
    ],
    [
        ("carol", "Love what you did with the UI!"),
        ("demo", "Thanks Carol! Took a while to get the colors right"),
        ("carol", "The dark mode is 🔥"),
        ("demo", "Haha yeah, I spent way too long on that"),
        ("carol", "Worth it though. Signal's design is really clean"),
        ("demo", "That's the goal — pixel perfect clone"),
        ("carol", "You're almost there! The bubble styles look great"),
        ("demo", "Still tweaking the tail on the message bubbles 😅"),
        ("carol", "That tiny detail matters though"),
        ("demo", "Exactly my thinking!"),
    ],
]

GROUP_MESSAGES = {
    "🚀 Scaler SDE Team": [
        ("alice", "Welcome everyone to the team channel!"),
        ("bob", "Hey team! Excited to be here"),
        ("carol", "Same! This is going to be a great project"),
        ("demo", "Let's build something amazing together 💪"),
        ("dave", "I've set up the repo. Who wants write access?"),
        ("alice", "Add me please! @dave"),
        ("bob", "Me too!"),
        ("carol", "And me 🙋"),
        ("demo", "Added everyone. Let's ship this!"),
        ("eve", "I'll handle the security review once we have the first build"),
        ("demo", "Perfect. Security first!"),
        ("frank", "I can help with deployment to Render. Done it before"),
        ("demo", "Amazing, Frank! That'll save us a lot of time"),
        ("grace", "And I can set up monitoring once it's live"),
        ("alice", "This team is 🔥"),
        ("bob", "Let's do a standup tomorrow at 10am?"),
        ("demo", "Works for me! Everyone else?"),
        ("carol", "✅"),
        ("dave", "✅"),
        ("eve", "Will be there!"),
    ],
    "🎉 Weekend Plans": [
        ("alice", "Anyone up for hiking this Saturday?"),
        ("carol", "Yes!! Which trail?"),
        ("alice", "Thinking Blue Ridge Trail — it's beautiful this time of year"),
        ("bob", "I'm in! What time?"),
        ("alice", "Meet at the trailhead at 8am?"),
        ("demo", "Count me in! Should I bring snacks?"),
        ("carol", "Please! I'll bring water bottles"),
        ("alice", "Bob, can you bring the portable speaker?"),
        ("bob", "Of course! Already have a hiking playlist ready 🎵"),
        ("demo", "This is going to be so fun"),
        ("carol", "Can't wait! Weather looks perfect too"),
    ],
    "📚 Study Group": [
        ("grace", "Hey everyone, here's the study material for this week"),
        ("heidi", "Thanks Grace! The algorithms section looks tough"),
        ("grace", "Yeah the dynamic programming part especially"),
        ("demo", "I'm stuck on the knapsack problem tbh"),
        ("heidi", "Me too! Shall we pair on it?"),
        ("demo", "Yes! Let's schedule a session"),
        ("grace", "I can explain it. I've seen this pattern before in interviews"),
        ("demo", "That would be amazing Grace!"),
        ("heidi", "Same time as last week?"),
        ("grace", "Works for me. Saturday 2pm"),
        ("demo", "Perfect. I'll create the video call link"),
        ("heidi", "See you both then! 📖"),
    ],
}


def seed():
    print("[*] Seeding database...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Clear existing data
        db.query(MessageReaction).delete()
        db.query(MessageStatus).delete()
        db.query(Message).delete()
        db.query(ConversationMember).delete()
        # Reset last_message_id first to avoid FK constraint
        db.query(Conversation).update({"last_message_id": None})
        db.query(Conversation).delete()
        db.query(Contact).delete()
        db.query(User).delete()
        db.commit()
        print("  [OK] Cleared existing data")

        # Create users
        users: dict[str, User] = {}
        for i, u_data in enumerate(USERS_DATA):
            user = User(
                id=str(uuid.uuid4()),
                username=u_data["username"],
                phone_number=u_data["phone"],
                display_name=u_data["display_name"],
                avatar_url=AVATAR_URLS[i],
                about_status=u_data["about"],
                password_hash=hash_password("demo123"),
                is_online=random.choice([True, False, False]),
                last_seen=random_time(days_ago_max=2),
                created_at=random_time(days_ago_max=30, days_ago_min=7),
            )
            db.add(user)
            users[u_data["username"]] = user

        db.flush()
        print(f"  [OK] Created {len(users)} users")

        # Create DM conversations
        dm_convs = []
        dm_pairs = [
            ("demo", "alice", DM_MESSAGES[0]),
            ("demo", "bob", DM_MESSAGES[1]),
            ("demo", "carol", DM_MESSAGES[2]),
        ]

        for u1_name, u2_name, messages in dm_pairs:
            u1 = users[u1_name]
            u2 = users[u2_name]

            conv = Conversation(
                id=str(uuid.uuid4()),
                type=ConversationType.direct,
                created_by=u1.id,
                created_at=random_time(days_ago_max=14, days_ago_min=5),
            )
            db.add(conv)
            db.flush()

            for uid in [u1.id, u2.id]:
                db.add(ConversationMember(
                    id=str(uuid.uuid4()),
                    conversation_id=conv.id,
                    user_id=uid,
                    role=MemberRole.member,
                ))

            last_msg = None
            base_time = random_time(days_ago_max=3, days_ago_min=1)
            for idx, (sender_name, content) in enumerate(messages):
                sender = users[sender_name]
                msg_time = base_time + timedelta(minutes=idx * random.randint(1, 15))
                msg = Message(
                    id=str(uuid.uuid4()),
                    conversation_id=conv.id,
                    sender_id=sender.id,
                    content=content,
                    created_at=msg_time,
                )
                db.add(msg)
                db.flush()

                # Add statuses
                other = u2 if sender.id == u1.id else u1
                db.add(MessageStatus(
                    id=str(uuid.uuid4()),
                    message_id=msg.id,
                    user_id=other.id,
                    status=MessageStatusEnum.read,
                    updated_at=msg_time + timedelta(minutes=1),
                ))
                last_msg = msg

            conv.last_message_id = last_msg.id if last_msg else None
            dm_convs.append(conv)

        db.flush()
        print(f"  [OK] Created {len(dm_convs)} DM conversations with messages")

        # Create Group conversations
        group_member_map = {
            "🚀 Scaler SDE Team": ["demo", "alice", "bob", "carol", "dave", "eve", "frank", "grace"],
            "🎉 Weekend Plans": ["demo", "alice", "bob", "carol"],
            "📚 Study Group": ["demo", "grace", "heidi"],
        }

        group_convs = []
        for group_name, messages_dict in GROUP_MESSAGES.items():
            member_names = group_member_map[group_name]
            creator = users[member_names[0]]

            conv = Conversation(
                id=str(uuid.uuid4()),
                type=ConversationType.group,
                group_name=group_name,
                group_avatar_url=f"https://api.dicebear.com/7.x/identicon/svg?seed={group_name}",
                created_by=creator.id,
                created_at=random_time(days_ago_max=10, days_ago_min=3),
            )
            db.add(conv)
            db.flush()

            for i, m_name in enumerate(member_names):
                db.add(ConversationMember(
                    id=str(uuid.uuid4()),
                    conversation_id=conv.id,
                    user_id=users[m_name].id,
                    role=MemberRole.admin if i == 0 else MemberRole.member,
                ))

            last_msg = None
            base_time = random_time(days_ago_max=2, days_ago_min=0)
            for idx, (sender_name, content) in enumerate(messages_dict):
                sender = users[sender_name]
                msg_time = base_time + timedelta(minutes=idx * random.randint(2, 20))
                msg = Message(
                    id=str(uuid.uuid4()),
                    conversation_id=conv.id,
                    sender_id=sender.id,
                    content=content,
                    created_at=msg_time,
                )
                db.add(msg)
                db.flush()

                # Add read statuses for all other members
                for m_name in member_names:
                    if users[m_name].id != sender.id:
                        db.add(MessageStatus(
                            id=str(uuid.uuid4()),
                            message_id=msg.id,
                            user_id=users[m_name].id,
                            status=MessageStatusEnum.read,
                            updated_at=msg_time + timedelta(minutes=random.randint(1, 10)),
                        ))
                last_msg = msg

            conv.last_message_id = last_msg.id if last_msg else None
            group_convs.append(conv)

        db.flush()
        print(f"  [OK] Created {len(group_convs)} group conversations with messages")

        # Add some reactions
        all_convs = dm_convs + group_convs
        emojis = ["❤️", "👍", "😂", "😮", "🔥", "👏"]
        for conv in all_convs[:2]:
            msgs = db.query(Message).filter(
                Message.conversation_id == conv.id
            ).limit(3).all()
            for msg in msgs:
                # Add a reaction from a random member
                members = db.query(ConversationMember).filter(
                    ConversationMember.conversation_id == conv.id,
                    ConversationMember.user_id != msg.sender_id,
                ).first()
                if members:
                    db.add(MessageReaction(
                        id=str(uuid.uuid4()),
                        message_id=msg.id,
                        user_id=members.user_id,
                        emoji=random.choice(emojis),
                    ))

        # Add contacts for demo user
        demo_user = users["demo"]
        for name in ["alice", "bob", "carol", "dave", "eve"]:
            db.add(Contact(
                id=str(uuid.uuid4()),
                owner_id=demo_user.id,
                contact_user_id=users[name].id,
            ))

        db.commit()
        print("  [OK] Added reactions and contacts")
        print("\n[OK] Database seeded successfully!")
        print("\n[INFO] Demo credentials:")
        print("   Username: demo")
        print("   Password: demo123")
        print("   (All other users also use password: demo123)")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
