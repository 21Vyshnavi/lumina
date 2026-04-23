# Lumina — AI-Powered Knowledge Assistant

<div align="center">

![Lumina Banner](https://img.shields.io/badge/Lumina-AI%20Knowledge%20Assistant-6366f1?style=for-the-badge)

[![CI/CD Pipeline](https://github.com/21Vyshnavi/lumina/actions/workflows/ci.yml/badge.svg)](https://github.com/21Vyshnavi/lumina/actions/workflows/ci.yml)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat&logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat&logo=typescript&logoColor=white)
![Gemini](https://img.shields.io/badge/Google-Gemini%20AI-4285F4?style=flat&logo=google&logoColor=white)

**A production-ready full-stack AI web application featuring real-time streaming chat, intelligent document summarization, and multi-turn conversation memory.**

[Features](#features) • [Architecture](#architecture) • [Quick Start](#quick-start) • [API Docs](#api-reference) • [Demo Videos](#live-demo)

</div>

---

## Live Demo

| Resource | Link |
|----------|------|
| Video Walkthrough | [Watch on Google Drive](https://drive.google.com/file/d/1WgJ7XuCbk-ijNZkRXZxvONXiomUFUWbr/view?usp=drive_link) |
| Live Demo Video | [Watch on Google Drive](https://drive.google.com/file/d/1boGMX-AjSVWJtkdFQ-dSAfhuXQMfzCo6/view?usp=drive_link) |
| GitHub Repo | [21Vyshnavi/lumina](https://github.com/21Vyshnavi/lumina) |
| API Docs | http://localhost:8000/docs |

---

## Features

### AI-Powered Chat
- **Real-time streaming** via Server-Sent Events (SSE) — token-by-token like ChatGPT
- **Multi-turn memory** — full conversation history stored in PostgreSQL
- **Auto-generated titles** — Gemini generates a 3-5 word title after your first message
- **Markdown rendering** — code blocks, tables, lists rendered with react-markdown

### Document Intelligence
- **Upload any text** — paste articles, notes, reports, research papers
- **One-click AI summarization** — Gemini returns a 3-5 sentence summary
- **Word count tracking** and creation date per document
- **Full content viewer** — expand any document inline

### Authentication & Security
- **JWT authentication** — secure token-based auth with 24h expiry
- **Bcrypt password hashing** — industry-standard security
- **Protected routes** — both frontend and backend enforce auth
- **Auto token refresh** — Axios interceptors handle 401s gracefully

### Infrastructure
- **Docker Compose** — one command starts the entire stack
- **GitHub Actions CI/CD** — tests + Docker builds on every push
- **Swagger UI** — full interactive API docs at `/docs`
- **Hot reload** — Vite (frontend) and uvicorn --reload (backend)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     React 18 + TypeScript                         │
│   Login · Register · Chat (SSE) · Documents · Dashboard          │
│         Tailwind CSS · Zustand · React Router · Axios            │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTP / SSE
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   FastAPI (Python 3.11)                           │
│                                                                   │
│   POST /auth/register   POST /auth/login   GET /auth/me          │
│   POST /chat/stream ──► SSE token-by-token streaming             │
│   GET  /chat/sessions   DELETE /chat/sessions/{id}               │
│   POST /documents       POST /documents/{id}/summarize           │
│                                                                   │
│        JWT Auth · SQLAlchemy ORM · Pydantic · Uvicorn            │
└──────────┬───────────────────────────────┬───────────────────────┘
           │                               │
           ▼                               ▼
┌──────────────────────┐    ┌──────────────────────────────────────┐
│    PostgreSQL 15      │    │       Google Gemini API              │
│                       │    │                                      │
│  users               │    │  gemini-2.0-flash                    │
│  chat_sessions       │    │  • Streaming chat                    │
│  messages            │    │  • Document summarization            │
│  documents           │    │  • Auto title generation             │
└──────────────────────┘    └──────────────────────────────────────┘
```

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Frontend | React + TypeScript | 18.3 / 5.4 |
| Build Tool | Vite | 5.2 |
| Styling | Tailwind CSS | 3.4 |
| State | Zustand | 4.5 |
| Backend | FastAPI + Python | 0.111 / 3.11 |
| ORM | SQLAlchemy | 2.0 |
| Database | PostgreSQL | 15 |
| AI | Google Gemini | 2.0-flash |
| Auth | JWT + Bcrypt | - |
| Testing | Pytest | 8.2 |
| DevOps | Docker + GitHub Actions | - |

---

## Quick Start

### Prerequisites
- Docker Desktop running
- Gemini API key — [get one free](https://aistudio.google.com/apikey)

### 1. Clone
```bash
git clone https://github.com/21Vyshnavi/lumina.git
cd lumina
```

### 2. Configure
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 3. Run
```bash
docker compose up --build
```

### 4. Open
- Frontend: **http://localhost:5173**
- API Docs: **http://localhost:8000/docs**

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT token |
| GET | `/auth/me` | Current user |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/stream` | SSE streaming chat |
| GET | `/chat/sessions` | List sessions |
| DELETE | `/chat/sessions/{id}` | Delete session |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents` | Upload document |
| POST | `/documents/{id}/summarize` | AI summarize |
| DELETE | `/documents/{id}` | Delete document |

---

## AI & Prompt Engineering

### Streaming Chat
```python
SYSTEM_PROMPT = """You are Lumina, a knowledgeable AI assistant.
Be conversational, accurate, and helpful.
Format responses with markdown when it aids readability."""

async for chunk in stream_chat_response(messages):
    yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
```

### Document Summarization
```python
# Truncated to 8,000 chars to respect token limits
f"Summarize '{title}' in 3-5 concise sentences focusing on key takeaways:\n{content}"
```

### Auto Title Generation
```python
# max_tokens=20 keeps this fast and cheap
f"Generate a 3-5 word chat title. Return ONLY the title:\n{first_message[:200]}"
```

---

## Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

| File | Tests | What it covers |
|------|-------|----------------|
| `test_auth.py` | 7 | Register, login, JWT, duplicates |
| `test_documents.py` | 6 | CRUD, auth enforcement |
| `test_chat.py` | 3 | Sessions, auth enforcement |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SECRET_KEY` | Yes | JWT signing secret |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_MODEL` | No | Default: `gemini-2.0-flash` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Default: `1440` (24h) |
| `ALLOWED_ORIGINS` | No | CORS origins |
| `VITE_API_URL` | No | Frontend API URL |

---

## Cost Analysis

| Service | Plan | Cost |
|---------|------|------|
| Google Gemini API | Free (1,500 req/day) | $0/mo |
| Docker | Personal | $0/mo |
| GitHub Actions | Free tier | $0/mo |
| PostgreSQL | Local | $0/mo |
| **Total** | | **$0/mo** |

---

## AI-Assisted Development

Built with **Claude AI** throughout:
- Scaffolding FastAPI routers and SQLAlchemy models
- Debugging SSE streaming implementation
- Designing prompt engineering strategies
- Generating test cases
- Troubleshooting Docker configuration

---

## License

MIT © 2026 [21Vyshnavi](https://github.com/21Vyshnavi)
