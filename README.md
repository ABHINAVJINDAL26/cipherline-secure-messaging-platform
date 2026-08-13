# 🔒 Signal Clone — Secure Messaging Platform

A pixel-close, fully functional clone of **Signal Messenger** built for the Scaler SDE Fullstack Assignment. Features real-time direct & group messaging, database persistence, and light/dark mode.

---

## 🔑 Demo Credentials

Use these credentials to log in and test:

| Username | Password |
|---|---|
| `demo` | `demo123` |
| `alice` | `demo123` |
| `bob` | `demo123` |

* OTP for new registration: **`123456`**

---

## 🚀 Quick Start

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv

# Activate venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python app/seed/seed_data.py   # Seed database
uvicorn main:app --reload --port 8000
```
* Backend API runs at: `http://localhost:8000`

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
* Frontend runs at: `http://localhost:3000`

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **State Management**: Zustand
- **Backend**: FastAPI (Python) + WebSockets
- **Database**: SQLite + SQLAlchemy ORM
