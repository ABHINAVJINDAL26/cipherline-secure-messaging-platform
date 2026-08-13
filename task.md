# Signal Clone — Task Tracker

## Phase 1 — Backend Foundation
- [x] Create backend/ project structure
- [x] requirements.txt + .env.example
- [x] database.py (SQLAlchemy engine + session)
- [x] app/models/models.py (all 7 ORM models)
- [x] app/schemas/schemas.py (Pydantic)
- [x] app/core/config.py + security.py (JWT)
- [x] app/routers/auth.py
- [x] app/routers/users.py
- [x] app/routers/contacts.py
- [x] app/routers/conversations.py
- [x] app/websocket/manager.py
- [x] app/seed/seed_data.py
- [x] main.py (FastAPI app entry)

## Phase 2 — Frontend Foundation
- [x] Next.js 14 project init
- [x] Tailwind + shadcn/ui setup
- [x] types/index.ts
- [x] lib/api.ts + lib/websocket.ts
- [x] store/ (Zustand: auth, chat, ui)
- [x] Auth pages (register, verify-otp, login)

## Phase 3 — Messaging Engine
- [x] useWebSocket hook / client
- [x] ConversationList + ConversationItem
- [x] ChatHeader + Composer
- [x] MessageBubble (with status ticks)
- [x] TypingIndicator
- [x] Main chats page (3-pane layout)

## Phase 4 — Groups
- [x] Group creation modal
- [x] Group messaging (multi-recipient status)
- [x] Member list + admin controls

## Phase 5 — UI Polish
- [x] Micro-animations (splash, OTP success, empty states)
- [x] Framer Motion transitions
- [x] Dark mode (CSS vars + localStorage)
- [x] Responsive layout (mobile/tablet/desktop)
- [x] Skeleton loaders

## Phase 6 — Bonus Features
- [x] Dark mode toggle in Settings
- [x] Reply-to / quoted messages
- [x] Emoji reactions
- [x] Keyboard shortcuts (Cmd+K, Esc, Enter)

## Phase 7 — Deploy + README
- [x] Final README.md
- [x] Deploy backend (Render) — Mocked/Prepared
- [x] Deploy frontend (Vercel) — Mocked/Prepared
