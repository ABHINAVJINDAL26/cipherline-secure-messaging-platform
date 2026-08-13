# 🔒 Cipherline — Secure Messaging Platform

Cipherline is a secure, real-time messaging platform modeled after Signal. It features pixel-close design, instant message delivery, group chat functionality, and robust user authentication.

---

## ✨ Features

- **Real-Time Messaging**: Built on native WebSockets for sub-second message delivery.
- **Group Chats**: Create group conversations, manage members, and track status.
- **Message Status**: Delivery status ticks (Sent, Delivered, Read) tracked per recipient.
- **Rich Interaction**: Expressive reactions with emojis, nested message replies, and typing indicators.
- **Secure Authentication**: Proper stateless authentication powered by JWT tokens, with planned support for Google OAuth 2.0.
- **Responsive Theme**: High-fidelity UI with dark/light mode toggle and custom animations.

---

## 🚀 Getting Started

### 1. Backend Server (FastAPI)
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python app/seed/seed_data.py   # Populates database
uvicorn main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 2. Frontend App (Next.js)
```bash
cd frontend
npm install
npm run dev
```
- Local URL: `http://localhost:3000`

---

## 🛡️ Authentication Architecture

The application uses a state-of-the-art authentication model:
1. **JWT Session Validation**: Backend verifies client requests securely using JSON Web Tokens.
2. **Google OAuth 2.0 Integration**: Planned integration allowing users to sign in seamlessly using their Google Accounts.
3. **Password Security**: Strong cryptographic password hashing using secure backends.
