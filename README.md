# Lumina — AI-Powered Knowledge Assistant

> A production-ready full-stack web application with real-time AI chat, document management, and intelligent summarization — built with React, FastAPI, PostgreSQL, and the Anthropic Claude API.

![CI/CD](https://github.com/your-username/lumina/actions/workflows/ci.yml/badge.svg)

---

## Live Demo

| Service   | URL                                  |
|-----------|--------------------------------------|
| Frontend  | https://lumina-app.onrender.com      |
| Backend   | https://lumina-api.onrender.com      |
| API Docs  | https://lumina-api.onrender.com/docs |

---

## Features

**AI-Powered Chat**
- Real-time streaming responses via Server-Sent Events (SSE)
- Multi-turn conversation memory with persistent sessions
- Auto-generated chat titles using Claude
- Markdown rendering with syntax highlighting

**Document Intelligence**
- Upload and store any text document
- One-click AI summarization (3–5 sentence summaries via Claude)
- Word count tracking and document history

**Authentication & Security**
- JWT-based authentication (register / login / protected routes)
- Bcrypt password hashing
- Token refresh via interceptors

**Infrastructure**
- Docker Compose for local development
- GitHub Actions CI/CD (test → build → deploy)
- One-click Render deployment via `render.yaml`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React + TypeScript                        │
│         Tailwind CSS · Zustand · React Router               │
│         Streaming SSE · React Markdown                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP / SSE
┌─────────────────────▼───────────────────────────────────────┐
│               FastAPI (Python 3.11)                          │
│   /auth  ·  /chat/stream (SSE)  ·  /documents               │
│   JWT Auth · SQLAlchemy ORM · Pydantic validation           │
└──────────┬──────────────────────────┬───────────────────────┘
           │                          │
┌──────────▼──────────┐    ┌──────────▼──────────────────────┐
│    PostgreSQL 15     │    │     Anthropic Claude API         │
│  users · sessions   │    │  claude-sonnet-4-20250514        │
│  messages · docs    │    │  Streaming · Summarization       │
└─────────────────────┘    └──────────────────────────────────┘
```

---

## Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS|
| State       | Zustand                                 |
| Backend     | Python 3.11, FastAPI, Uvicorn           |
| Database    | PostgreSQL 15, SQLAlchemy 2, Alembic    |
| AI          | Anthropic Claude API (`anthropic` SDK)  |
| Auth        | JWT (python-jose), Bcrypt (passlib)     |
| Testing     | Pytest, FastAPI TestClient              |
| DevOps      | Docker, Docker Compose, GitHub Actions  |
| Deployment  | Render (backend + frontend + DB)        |

---

## Local Setup

### Prerequisites

- Docker & Docker Compose
- An Anthropic API key — [get one here](https://console.anthropic.com)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/lumina.git
cd lumina
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

### 3. Start everything with Docker Compose

```bash
docker compose up --build
```

This starts:
- PostgreSQL on port 5432
- FastAPI backend on port 8000
- React frontend on port 5173

### 4. Open the app

Visit **http://localhost:5173**, register an account, and start chatting.

---

## Manual Setup (Without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL=postgresql://lumina:lumina_secret@localhost:5432/lumina_db
export SECRET_KEY=your_secret_key
export ANTHROPIC_API_KEY=sk-ant-xxxxx

# Run
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm run dev
```

---

## API Reference

Full interactive docs available at `/docs` (Swagger UI) when the backend is running.

### Auth

| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| POST   | /auth/register   | Create a new account     |
| POST   | /auth/login      | Get JWT access token     |
| GET    | /auth/me         | Get current user info    |

### Chat

| Method | Endpoint                   | Description                        |
|--------|----------------------------|------------------------------------|
| POST   | /chat/stream               | Send message, stream SSE response  |
| GET    | /chat/sessions             | List all chat sessions             |
| GET    | /chat/sessions/{id}        | Get session with message history   |
| DELETE | /chat/sessions/{id}        | Delete a session                   |

### Documents

| Method | Endpoint                      | Description                     |
|--------|-------------------------------|---------------------------------|
| GET    | /documents                    | List all documents              |
| POST   | /documents                    | Upload a document               |
| GET    | /documents/{id}               | Get document with content       |
| POST   | /documents/{id}/summarize     | AI-generate a summary           |
| DELETE | /documents/{id}               | Delete a document               |

---

## Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

Tests cover: auth registration, login, JWT validation, document CRUD, session management, and health checks.

---

## Deployment to Render

### Automated (recommended)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your GitHub repo — Render auto-detects `render.yaml`
4. Add your `ANTHROPIC_API_KEY` in the Render dashboard under the backend service's environment variables
5. Click **Deploy**

### CI/CD Secrets (GitHub)

Add these secrets to your GitHub repository (`Settings → Secrets → Actions`):

| Secret                        | Value                              |
|-------------------------------|------------------------------------|
| `RENDER_BACKEND_DEPLOY_HOOK`  | From Render → Backend → Deploy Hook|
| `RENDER_FRONTEND_DEPLOY_HOOK` | From Render → Frontend → Deploy Hook|

---

## Environment Variables Reference

| Variable                    | Required | Default              | Description                        |
|-----------------------------|----------|----------------------|------------------------------------|
| `DATABASE_URL`              | Yes      | —                    | PostgreSQL connection string        |
| `SECRET_KEY`                | Yes      | —                    | JWT signing secret (use long random)|
| `ANTHROPIC_API_KEY`         | Yes      | —                    | Your Anthropic API key              |
| `CLAUDE_MODEL`              | No       | claude-sonnet-4-...  | Claude model to use                 |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| No      | 1440 (24h)           | JWT expiry                          |
| `ALLOWED_ORIGINS`           | No       | localhost variants   | CORS allowed origins                |
| `VITE_API_URL`              | No       | http://localhost:8000| Frontend → backend URL              |

---

## AI Features & Prompt Engineering

### Streaming Chat
Uses Anthropic's streaming SDK with SSE to deliver responses token-by-token. The system prompt establishes Lumina's persona and instructs it to use markdown formatting for readability.

### Document Summarization
Content is truncated to 8,000 characters before sending to respect token limits. The prompt instructs Claude to produce a concise 3–5 sentence summary focused on key takeaways.

### Auto Chat Title Generation
After the first message in a session, a lightweight Claude call generates a 3–5 word title. `max_tokens=20` keeps this fast and cheap.

### Graceful Fallback
All AI calls are wrapped in try/except blocks. API failures return HTTP 500 with a descriptive error message. The frontend shows a toast notification and preserves existing chat state.

---

## Project Structure

```
lumina/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions: test → build → deploy
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app entry point
│   │   ├── config.py           # Pydantic settings
│   │   ├── database.py         # SQLAlchemy engine + session
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── routers/            # Route handlers (auth, chat, documents)
│   │   ├── services/           # AI service (Claude integration)
│   │   └── utils/              # JWT auth utilities
│   ├── tests/                  # Pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Routing
│   │   ├── pages/              # LoginPage, RegisterPage, ChatPage, DocumentsPage
│   │   ├── components/         # Layout, UI components
│   │   ├── store/              # Zustand auth store
│   │   ├── services/           # Axios API client
│   │   └── types/              # TypeScript interfaces
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── render.yaml                 # Render Blueprint (one-click deploy)
├── .env.example
└── README.md
```

---

## AI-Assisted Development

This project was built with **Claude Code** and **Claude claude.ai** for:
- Generating boilerplate (FastAPI routers, SQLAlchemy models)
- Debugging SSE streaming implementation
- Writing and iterating on prompt engineering strategies
- Generating test cases

---

## License

MIT
