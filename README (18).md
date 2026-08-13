# 🔒 Signal Clone — Secure Messaging Platform

> A pixel-close, fully functional clone of **Signal Messenger** — built for the SDE Fullstack Assignment. Real-time one-on-one & group messaging, mocked auth, and a UI that feels indistinguishable from the real app.

---

## 📖 Table of Contents

1. [What This Assignment Actually Is](#what-this-assignment-actually-is)
2. [What We're Building — In Plain Words](#what-were-building--in-plain-words)
3. [Tech Stack](#tech-stack)
4. [UI/UX Design System](#uiux-design-system)
5. [Feature List](#feature-list)
6. [Extra Features We're Adding (Beyond the Brief)](#extra-features-were-adding-beyond-the-brief)
7. [Database Schema](#database-schema)
8. [API Overview](#api-overview)
9. [Project Structure](#project-structure)
10. [Build Plan (Phase-wise)](#build-plan-phase-wise)
11. [Setup Instructions](#setup-instructions)
12. [Assumptions & Notes](#assumptions--notes)

---

## What This Assignment Actually Is

This is an **SDE Fullstack evaluation assignment**. The goal is not just "make a chat app" — it's to prove you can:

- Design a **real database schema** from scratch (users, conversations, messages, groups, membership, read receipts).
- Build a **clean REST + WebSocket API** (FastAPI/Django backend).
- Build a **production-quality frontend** (Next.js + TypeScript) that closely mirrors Signal's actual UI/UX — not a generic Bootstrap chat template.
- Wire up **real-time behavior**: live messages, typing indicators, delivery/read ticks, online status.
- Ship it: **public GitHub repo + hosted deployed link**.
- Be able to **explain every decision** in an interview — so no blind copy-pasting, even though AI tools are allowed.

Encryption, calls, stories, linked devices — all of that is **mocked/placeholder only**. The real bar is: *does this feel and behave like Signal, and is the engineering underneath solid?*

---

## What We're Building — In Plain Words

Think of it as three big blocks:

1. **Auth block** — register with phone/username → mock OTP (fixed, e.g. `123456`) → set display name & avatar → session persists across refresh (JWT).
2. **Messaging block** — a conversation list on the left (like Signal's home screen), a chat pane on the right, real-time messages over WebSocket, with proper status ticks (sending → sent → delivered → read) and typing indicators.
3. **Groups block** — same messaging engine, but with multiple members, admin controls, and a member list view.

Everything sits on top of a **seeded SQLite database** so the app looks alive the moment it's opened — multiple fake users, ongoing conversations, groups, and message history already present.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 14 (App Router) + TypeScript** | File-based routing, SSR where needed, strong typing for a data-heavy app |
| Styling | **Tailwind CSS + shadcn/ui** | Fast, consistent, easy to theme (light/dark), matches modern Signal aesthetic |
| State/Data | **React Query / Zustand** | Server cache + lightweight local state (active chat, typing status, etc.) |
| Backend | **FastAPI (Python)** | Async-first, native WebSocket support, fast to build clean REST APIs |
| Real-time | **WebSockets (native FastAPI `WebSocket`)** | True real-time messaging, typing indicators, presence |
| Database | **SQLite + SQLAlchemy ORM** | Matches assignment requirement, portable, easy to seed |
| Auth | **Custom JWT-based auth** (no third-party like Clerk/Auth0 — schema must be self-owned) | Assignment explicitly wants a self-designed schema + mocked OTP flow |
| Animations | **Lottie (`lottie-react`)** | Onboarding animations, empty states, loading states, success/error micro-animations |
| Icons / Illustrations | **Iconscout (3D icons, illustrations, and animated icon packs)** | Empty-state illustrations, onboarding screens, settings icons, avatars fallback |
| Deployment | Frontend → **Vercel**, Backend → **Render / Railway** | Free, reliable, fast to set up |

---

## UI/UX Design System

This is the part evaluators will notice first — the app must **feel** like Signal, not just function like one. Below is the exact design language to follow (based on Signal's actual production app + close UI-research).

### 🎨 Color Palette

| Purpose | Light Mode | Dark Mode |
|---|---|---|
| Primary / Brand Accent | `#2C6BED` (Signal blue) | `#3A76F0` |
| Background (app shell) | `#FFFFFF` | `#0F1113` / `#121417` |
| Conversation list background | `#F7F7F8` | `#17191C` |
| Sent message bubble | `#2C6BED` (blue, white text) | `#1B4DBB` |
| Received message bubble | `#F1F1F1` (light grey, dark text) | `#26282C` |
| Border / Divider | `#E4E4E5` | `#2A2C30` |
| Muted text (timestamps, last seen) | `#6B7280` | `#8A8F98` |
| Unread badge | `#2C6BED` | `#3A76F0` |
| Online indicator dot | `#2ECC71` (green) | `#2ECC71` |
| Danger / delete actions | `#EF4444` | `#F87171` |

### 🖋️ Typography

- **Font family:** `Inter` (matches Signal's clean, geometric sans-serif feel) — fallback to system-ui.
- **Scale:**
  - Chat name / headers → 16px, semi-bold (600)
  - Message text → 15px, regular (400)
  - Timestamps / meta → 12px, medium (500), muted color
  - Section headers (Settings etc.) → 13px, uppercase, letter-spacing 0.05em, muted

### 🧱 Layout (Desktop — 3-pane like real Signal)

```
┌──────────────┬───────────────────────────────┬──────────────┐
│  Left Rail    │        Chat List Pane          │   Chat Pane   │
│ (icons only:  │  - Search bar (top)            │ - Header:     │
│  chats,       │  - "New chat" / "New group" btn│   avatar,name,│
│  stories*,    │  - Sorted conversation list     │   online dot  │
│  calls*,      │    (avatar, name, last msg,     │ - Messages    │
│  settings)    │     timestamp, unread badge)    │   (scrollable)│
│               │                                  │ - Typing dots │
│               │                                  │ - Composer    │
│               │                                  │   (bottom)    │
└──────────────┴───────────────────────────────┴──────────────┘
```
*(stories/calls icons present but disabled → "Coming Soon" toast on click)*

### 📱 Layout (Mobile / Responsive)

- Single-pane, stack-based navigation: Conversation List → tap → full-screen Chat View → back button returns.
- Bottom sheet modals for "New Chat", "New Group", "Settings" instead of desktop side panels.
- Composer sticks to bottom with safe-area padding.

### 💬 Message Bubbles

- **Sent (mine):** right-aligned, blue background, white text, rounded corners (`18px`, with the bottom-right corner slightly squared — Signal's signature "tail-less" bubble style).
- **Received (theirs):** left-aligned, light-grey background, dark text.
- **Grouped messages** from the same sender within 1 minute → no repeated avatar/name, tighter vertical spacing.
- **Status ticks** (sent messages only, bottom-right of bubble):
  - 🕓 Clock icon = Sending
  - ✓ Single grey check = Sent
  - ✓✓ Double grey check = Delivered
  - ✓✓ Double **blue** check = Read
- **Timestamp** shows on hover (desktop) or long-press (mobile) if not already visible.

### ✨ Motion & Micro-interactions (Lottie + native transitions)

| Moment | Animation |
|---|---|
| App splash / initial load | Lottie: animated shield/lock icon "assembling" (privacy branding) |
| OTP verification success | Lottie: checkmark burst animation |
| Empty conversation list (new user) | Iconscout 3D illustration — "no chats yet" + subtle floating animation |
| Message send | Bubble scales in from 95%→100% with slight upward slide (150ms ease-out) |
| Typing indicator | Three bouncing dots (CSS keyframe, staggered delay) |
| New message arrival | Gentle slide-up + fade-in, unread badge pulses once |
| Toast notifications | Slide in from top-right, auto-dismiss with progress bar |
| Group creation success | Lottie: confetti-lite / member avatars stacking animation |
| Settings toggle switches | Smooth spring animation (framer-motion) |
| Page/panel transitions | Framer Motion `AnimatePresence` cross-fade (120ms) |

### 🧩 Iconscout Usage Plan

- **3D avatar placeholders** for users without a profile picture (soft-shadow 3D blob/emoji-style avatars — Iconscout's 3D icon packs).
- **Onboarding illustrations** — 3D "lock", "chat bubble", "people connecting" visuals on the welcome/register screens.
- **Empty states** — "No conversations", "No messages yet", "No contacts found" each get a matching 3D illustration instead of a plain icon.
- **Settings section icons** — 3D-style icons for Privacy, Notifications, Appearance, Linked Devices (Coming Soon), Help.
- **Attachment picker icons** (bonus feature) — 3D file/image/camera icons for a friendlier feel than flat SVGs.

### 🌗 Dark Mode

- True dark theme (not just inverted colors) — background near-black (`#0F1113`), not pure black, to avoid OLED smearing and to match Signal's actual dark palette.
- Toggle lives in Settings → Appearance, persisted in `localStorage` + reflected instantly via CSS variables / Tailwind `dark:` class strategy.

### ♿ Details That Make It Feel "Real"

- Skeleton loaders (shimmer) while conversations/messages load — not blank spinners.
- Optimistic UI: message appears instantly on send (status = "sending"), then updates to "sent" once server confirms.
- Keyboard shortcuts (bonus): `Cmd/Ctrl + K` → search, `Esc` → close modal, `Enter` → send, `Shift+Enter` → newline.
- Toasts for every background event (new message while on another chat, member added to group, "Coming soon" clicks on calls/stories).

---

## Feature List

### ✅ Core (Must-Have — from the brief)

- [ ] Mocked registration (phone/username + fixed OTP) with display name & avatar setup
- [ ] Login / Logout with persistent JWT session
- [ ] Conversation list — sorted by recent activity, search, unread badges, last-message preview, mocked online/last-seen
- [ ] Add new contact
- [ ] Real-time 1-on-1 messaging over WebSocket
- [ ] Message status: sending → sent → delivered → read (with tick UI)
- [ ] Typing indicators
- [ ] Message timestamps, all messages persisted
- [ ] Group creation (name + members), group messaging, member list, add/remove members (admin-only)
- [ ] Full Signal-like navigation, bubbles, modals, toasts, settings placeholder pages
- [ ] Placeholders ("Coming Soon") for Calls, Stories, Linked Devices, Real E2E Encryption
- [ ] Seeded database with multiple users, conversations, and message history

### ⭐ Bonus (from the brief — pick as many as time allows)

- [ ] Image/file attachments
- [ ] Emoji reactions on messages
- [ ] Reply-to / quoted messages
- [ ] Disappearing messages (functional, with a timer)
- [ ] Dark mode
- [ ] Fully responsive (mobile/tablet/desktop)
- [ ] Keyboard shortcuts

## Extra Features We're Adding (Beyond the Brief)

These aren't required but push the project from "assignment" to "portfolio-grade":

- **3D/Lottie-enhanced onboarding** — animated welcome carousel explaining privacy-first messaging (purely visual, mocked).
- **Message search within a conversation** — highlight + jump to matched messages.
- **@mentions in groups** — highlighted mention chips, with a mention-notification badge.
- **Pinned conversations** — pin up to 3 chats to the top of the list.
- **Archive chat** — move conversation out of the main list without deleting.
- **Mute conversation** — mutes notifications for a chat/group (mocked, UI-only toggle).
- **Profile "About" status text** — short bio line shown on profile, like Signal's status message.
- **Command palette (`Cmd+K`)** — quick jump to any conversation or contact.
- **Sound toggle** — subtle message-sent/received sound effect (togglable in Settings).
- **Multi-device session list (mocked)** — under Settings → Linked Devices, shows a fake "this device" card even though feature is placeholder.

---

## Database Schema

```
users
├── id (PK, UUID)
├── phone_number / username (unique)
├── display_name
├── avatar_url
├── about_status (nullable)
├── password_hash / otp-based auth flag
├── is_online (bool, mocked toggle)
├── last_seen (timestamp)
└── created_at

conversations
├── id (PK, UUID)
├── type (enum: 'direct' | 'group')
├── group_name (nullable, only for groups)
├── group_avatar_url (nullable)
├── created_by (FK → users.id, nullable for direct)
├── last_message_id (FK → messages.id, nullable, for sort optimization)
└── created_at

conversation_members
├── id (PK)
├── conversation_id (FK → conversations.id)
├── user_id (FK → users.id)
├── role (enum: 'member' | 'admin')
├── is_muted (bool)
├── is_pinned (bool)
├── joined_at
└── UNIQUE(conversation_id, user_id)

messages
├── id (PK, UUID)
├── conversation_id (FK → conversations.id)
├── sender_id (FK → users.id)
├── content (text, nullable if attachment-only)
├── attachment_url (nullable)
├── reply_to_message_id (FK → messages.id, nullable)
├── is_deleted (bool)
├── expires_at (nullable — disappearing messages)
├── created_at

message_status
├── id (PK)
├── message_id (FK → messages.id)
├── user_id (FK → users.id)          -- per-recipient status (matters in groups)
├── status (enum: 'sent' | 'delivered' | 'read')
├── updated_at
└── UNIQUE(message_id, user_id)

message_reactions
├── id (PK)
├── message_id (FK → messages.id)
├── user_id (FK → users.id)
├── emoji
└── UNIQUE(message_id, user_id, emoji)

contacts
├── id (PK)
├── owner_id (FK → users.id)
├── contact_user_id (FK → users.id)
├── nickname (nullable)
└── created_at
```

**Key design decisions:**
- `conversations` handles **both** 1-on-1 and group chats through a single table (`type` enum) — avoids duplicate messaging logic.
- `message_status` is **per-recipient**, not per-message, because in group chats a message can be "read" by some members and only "delivered" to others (matches real Signal behavior).
- `conversation_members` acts as the join table carrying group-specific data (admin role, mute, pin) without polluting the `conversations` table.

---

## API Overview

### REST Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register with phone/username |
| POST | `/auth/verify-otp` | Verify mocked OTP → issue JWT |
| POST | `/auth/login` | Login existing user |
| POST | `/auth/logout` | Invalidate session |
| GET | `/users/me` | Current user profile |
| PATCH | `/users/me` | Update display name / avatar / about |
| GET | `/contacts` | List contacts |
| POST | `/contacts` | Add a contact |
| GET | `/conversations` | List conversations (sorted, with last message + unread count) |
| POST | `/conversations` | Create direct or group conversation |
| GET | `/conversations/{id}/messages` | Paginated message history |
| POST | `/conversations/{id}/members` | Add group member (admin only) |
| DELETE | `/conversations/{id}/members/{user_id}` | Remove member (admin only) |
| PATCH | `/conversations/{id}` | Update group name/avatar |

### WebSocket Events

| Event | Direction | Payload |
|---|---|---|
| `message:send` | Client → Server | `{ conversation_id, content, reply_to? }` |
| `message:new` | Server → Client | full message object |
| `message:status_update` | Server → Client | `{ message_id, status, user_id }` |
| `typing:start` / `typing:stop` | Client ↔ Server | `{ conversation_id, user_id }` |
| `presence:update` | Server → Client | `{ user_id, is_online, last_seen }` |

---

## Project Structure

```
signal-clone/
├── frontend/                  # Next.js + TypeScript
│   ├── app/
│   │   ├── (auth)/register, verify-otp, login
│   │   ├── (main)/chats, chats/[id], groups/[id]/members, settings
│   │   └── layout.tsx
│   ├── components/
│   │   ├── chat/ (MessageBubble, Composer, TypingIndicator, ChatHeader)
│   │   ├── sidebar/ (ConversationList, ConversationItem, SearchBar)
│   │   ├── ui/ (shadcn primitives)
│   │   └── shared/ (Avatar, Toast, Modal, Lottie wrappers)
│   ├── lib/ (api client, websocket client, utils)
│   ├── store/ (zustand stores)
│   └── styles/
├── backend/                   # FastAPI
│   ├── app/
│   │   ├── models/ (SQLAlchemy models)
│   │   ├── routers/ (auth, users, contacts, conversations, messages)
│   │   ├── websocket/ (connection manager, event handlers)
│   │   ├── schemas/ (Pydantic models)
│   │   ├── services/ (business logic layer)
│   │   └── seed/ (seed_data.py — fake users/chats/messages)
│   ├── main.py
│   └── database.py
└── README.md
```

---

## Build Plan (Phase-wise)

1. **Phase 1 — Foundation:** DB schema + models, FastAPI project skeleton, JWT auth flow, seed script.
2. **Phase 2 — Core UI shell:** Next.js layout (3-pane), routing, Tailwind theme (light/dark tokens), Signal-accurate components (Avatar, Bubble, Sidebar).
3. **Phase 3 — Messaging engine:** WebSocket connection manager, send/receive, persistence, status ticks, typing indicator.
4. **Phase 4 — Groups:** group creation, member management, admin controls.
5. **Phase 5 — Polish:** Lottie animations, Iconscout illustrations, empty states, toasts, dark mode, responsive pass.
6. **Phase 6 — Bonus features:** attachments, reactions, reply-to, disappearing messages, keyboard shortcuts.
7. **Phase 7 — Ship:** deploy frontend (Vercel) + backend (Render/Railway), write final README, record a short walkthrough, double-check seeded data looks good on first load.

---

## Setup Instructions

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m app.seed.seed_data     # seeds fake users, chats, messages
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Environment variables needed (`.env` in each folder — see `.env.example`):
- `DATABASE_URL` (SQLite file path)
- `JWT_SECRET`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

---

## Assumptions & Notes

- OTP is fixed (`123456`) for all users — no real SMS gateway.
- Encryption is visually implied (lock icons, "encrypted" labels) but not cryptographically implemented, per assignment scope.
- Calls, Stories, and Linked Devices show a "Coming Soon" screen on click — no backend logic behind them.
- Online/last-seen status is simulated (randomized/toggle-based), not derived from actual socket presence in a distributed sense — acceptable per the brief.
- Auth is fully self-built (no Clerk/Auth0/Firebase) to keep the database schema and API surface entirely our own, as required by the evaluation criteria.
