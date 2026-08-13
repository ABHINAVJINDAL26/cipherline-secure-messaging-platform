# 🔒 Signal Clone — Secure Messaging Platform

> A pixel-close, fully functional clone of **Signal Messenger** — built for the Scaler SDE Fullstack Assignment. Real-time one-on-one & group messaging, mocked auth, and a UI that feels indistinguishable from the real app.

**Live Demo:** `[Add deployed URL here]`  
**GitHub:** `[Add repo URL here]`

---

## 🚀 Quick Start

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python app/seed/seed_data.py   # seeds demo users, chats, messages
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`  
API Docs: `http://localhost:8000/docs`

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 🔑 Demo Credentials

| Username | Password |
|---|---|
| `demo` | `demo123` |
| `alice` | `demo123` |
| `bob` | `demo123` |
| `carol` | `demo123` |
| *(all others)* | `demo123` |

OTP for registration: **`123456`** (always fixed)

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | File-based routing, SSR, strong typing |
| Styling | Tailwind CSS + Custom CSS Variables | Signal-accurate dark/light theming |
| State | Zustand | Lightweight, no boilerplate |
| Data Fetching | Axios + React Query | Caching, optimistic updates |
| Backend | FastAPI (Python) | Async-first, native WebSocket |
| Real-time | Native FastAPI WebSockets | True real-time, no extra deps |
| Database | SQLite + SQLAlchemy ORM | Portable, self-contained |
| Auth | Custom JWT (python-jose) | Self-designed schema, no third-party |
| Animations | CSS Keyframes + Framer Motion | Smooth, performant micro-animations |

---

## 🗄️ Database Schema

```
users
├── id (UUID PK)
├── phone_number (unique, nullable)
├── username (unique, nullable)
├── display_name
├── avatar_url
├── about_status
├── password_hash
├── is_online (bool)
├── last_seen
└── created_at

conversations
├── id (UUID PK)
├── type (enum: 'direct' | 'group')
├── group_name (nullable)
├── group_avatar_url (nullable)
├── created_by (FK → users)
├── last_message_id (FK → messages, for O(1) sort)
└── created_at

conversation_members (join table)
├── id (PK)
├── conversation_id (FK)
├── user_id (FK)
├── role (enum: 'member' | 'admin')
├── is_muted (bool)
├── is_pinned (bool)
├── joined_at
└── UNIQUE(conversation_id, user_id)

messages
├── id (UUID PK)
├── conversation_id (FK)
├── sender_id (FK)
├── content (text, nullable)
├── attachment_url (nullable)
├── reply_to_message_id (FK → messages, self-ref)
├── is_deleted (bool)
├── expires_at (nullable — disappearing messages)
└── created_at

message_status (per-recipient tracking)
├── id (PK)
├── message_id (FK)
├── user_id (FK)
├── status (enum: 'sent' | 'delivered' | 'read')
├── updated_at
└── UNIQUE(message_id, user_id)

message_reactions
├── id (PK)
├── message_id (FK)
├── user_id (FK)
├── emoji
└── UNIQUE(message_id, user_id, emoji)

contacts
├── id (PK)
├── owner_id (FK)
├── contact_user_id (FK)
├── nickname
└── created_at
```

**Key Design Decisions:**
- `conversations` handles both DM and groups through a `type` enum — single messaging engine
- `message_status` is **per-recipient** — in groups, a message can be "read" by some and "delivered" to others (exactly like real Signal)
- `last_message_id` on conversations enables O(1) sorting without expensive subqueries

---

## 🔌 API Overview

### REST Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register (step 1) |
| POST | `/auth/verify-otp` | Verify OTP + set profile → JWT |
| POST | `/auth/login` | Login existing user |
| POST | `/auth/logout` | Client-side logout |
| GET | `/users/me` | My profile |
| PATCH | `/users/me` | Update profile |
| GET | `/users/?q=` | Search users |
| GET | `/contacts/` | List contacts |
| POST | `/contacts/` | Add contact |
| DELETE | `/contacts/{id}` | Remove contact |
| GET | `/conversations/` | List conversations |
| POST | `/conversations/` | Create DM or group |
| GET | `/conversations/{id}/messages` | Paginated messages |
| POST | `/conversations/{id}/messages` | Send message |
| POST/DELETE | `/conversations/{id}/members` | Add/remove group member |
| POST | `/conversations/{id}/messages/{msg_id}/reactions` | Add/toggle reaction |

### WebSocket Events

Connect: `ws://localhost:8000/ws/{user_id}?token={JWT}`

| Event | Direction | Payload |
|---|---|---|
| `message:send` | Client → Server | `{ conversation_id, content, reply_to_message_id? }` |
| `message:new` | Server → Client | Full message object |
| `message:status_update` | Server → Client | `{ message_id, user_id, status }` |
| `message:reaction` | Server → Client | `{ message_id, user_id, emoji, action }` |
| `typing:start/stop` | Bidirectional | `{ conversation_id, user_id }` |
| `presence:update` | Server → Client | `{ user_id, is_online, last_seen }` |
| `ping/pong` | Bidirectional | Keepalive |

---

## 📁 Project Structure

```
signal-clone/
├── backend/
│   ├── main.py              # FastAPI app + WebSocket endpoint
│   ├── database.py          # SQLAlchemy engine + session
│   ├── requirements.txt
│   └── app/
│       ├── core/
│       │   ├── config.py    # Settings (pydantic-settings)
│       │   ├── security.py  # JWT + password hashing
│       │   └── deps.py      # Auth dependency (get_current_user)
│       ├── models/
│       │   └── models.py    # All 7 SQLAlchemy ORM models
│       ├── schemas/
│       │   └── schemas.py   # All Pydantic request/response schemas
│       ├── routers/
│       │   ├── auth.py      # /auth/* endpoints
│       │   ├── users.py     # /users/* endpoints
│       │   ├── contacts.py  # /contacts/* endpoints
│       │   └── conversations.py  # /conversations/* + messages + reactions
│       ├── websocket/
│       │   └── manager.py   # ConnectionManager singleton
│       └── seed/
│           └── seed_data.py # Database seeder
└── frontend/
    ├── app/
    │   ├── layout.tsx        # Root layout + theme init
    │   ├── page.tsx          # Auth redirect
    │   ├── login/page.tsx    # Login page
    │   ├── register/page.tsx # Registration (3-step)
    │   ├── chats/page.tsx    # Main app (3-pane)
    │   └── globals.css       # Design system + animations
    ├── components/
    │   ├── sidebar/
    │   │   ├── LeftRail.tsx        # Navigation rail
    │   │   ├── ConversationList.tsx # Chat list pane
    │   │   └── ConversationItem.tsx # Individual list row
    │   ├── chat/
    │   │   ├── ChatPane.tsx        # Main chat view
    │   │   ├── ChatHeader.tsx      # Chat top bar
    │   │   ├── MessageBubble.tsx   # Message with ticks + reactions
    │   │   ├── Composer.tsx        # Message input
    │   │   ├── TypingIndicator.tsx # Bouncing dots
    │   │   └── EmptyChatState.tsx  # No chat selected
    │   ├── modals/
    │   │   ├── NewChatModal.tsx    # Start new DM
    │   │   ├── NewGroupModal.tsx   # Create group (2-step)
    │   │   └── SettingsPanel.tsx   # Profile + theme + settings
    │   └── shared/
    │       ├── ToastContainer.tsx  # Global notifications
    │       └── CommandPalette.tsx  # Cmd+K search
    ├── lib/
    │   ├── api.ts            # Axios client + all API calls
    │   ├── websocket.ts      # WebSocket client (auto-reconnect)
    │   └── utils.ts          # cn(), formatters, helpers
    ├── store/
    │   ├── authStore.ts      # Zustand auth (persisted)
    │   ├── chatStore.ts      # Conversations, messages, typing
    │   └── uiStore.ts        # Theme, modals, toasts
    └── types/
        └── index.ts          # All TypeScript interfaces
```

---

## ✅ Feature Checklist

### Core (Required)
- [x] Mocked registration (phone/username + OTP `123456`)
- [x] Display name + avatar setup
- [x] Login/Logout + JWT session persistence
- [x] Conversation list — sorted by recent, with search
- [x] Unread badges + last message preview
- [x] Online/last-seen indicators
- [x] Add contacts
- [x] Real-time 1-on-1 messaging over WebSocket
- [x] Message status ticks: Sending → Sent → Delivered → Read
- [x] Typing indicators
- [x] All messages persisted in SQLite
- [x] Group creation with name + members
- [x] Group messaging
- [x] View/add/remove group members (admin controls)
- [x] Signal-accurate 3-pane layout
- [x] Signal-accurate message bubbles
- [x] Settings placeholder pages
- [x] Coming Soon: Calls, Stories, Linked Devices
- [x] Seeded database (9 users, 6 conversations, 70+ messages)

### Bonus
- [x] Dark mode (true dark, CSS variables, persisted)
- [x] Emoji reactions (toggle, per-user, per-message)
- [x] Reply-to / quoted messages
- [x] Keyboard shortcuts (Cmd+K, Esc, Enter send, Shift+Enter newline)
- [x] Responsive design (mobile single-pane, desktop 3-pane)
- [x] Skeleton loaders (shimmer while loading)
- [x] Optimistic UI (message appears instantly, updates on confirm)
- [x] Command palette (Cmd+K → quick jump to any conversation)
- [x] Toast notifications (new messages, errors, Coming Soon)

### Mocked/Placeholder
- [x] Voice/Video calls → "Coming Soon" toast
- [x] Stories → "Coming Soon" toast
- [x] Linked Devices → mocked "This device" card in Settings
- [x] E2E Encryption → visual labels only, not cryptographic

---

## 🔧 Environment Variables

### Backend `.env`
```
DATABASE_URL=sqlite:///./signal_clone.db
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## 📝 Assumptions & Notes

- **OTP is fixed at `123456`** for all users — no real SMS gateway
- **Encryption is visual only** — lock icons and "encrypted" labels, but no cryptographic implementation
- **Calls, Stories, Linked Devices** show a "Coming Soon" screen/toast — no backend logic
- **Online/last-seen** is simulated from WebSocket connection state (not distributed presence)
- **Auth is fully self-built** — no Clerk/Auth0/Firebase — the entire JWT + schema is custom, as required by the evaluation criteria
- **Password hashing** uses `sha256_crypt` (passlib) for Windows compatibility; production should use bcrypt or argon2
