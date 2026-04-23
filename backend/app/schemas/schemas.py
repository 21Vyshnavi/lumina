from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── Auth ───────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: str
    username: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Chat ───────────────────────────────────────────────────

class MessageCreate(BaseModel):
    content: str
    session_id: Optional[str] = None


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    messages: List[MessageOut] = []

    class Config:
        from_attributes = True


class ChatSessionSummary(BaseModel):
    id: str
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Documents ──────────────────────────────────────────────

class DocumentCreate(BaseModel):
    title: str
    content: str


class DocumentOut(BaseModel):
    id: str
    title: str
    content: str
    summary: Optional[str]
    word_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentSummaryOut(BaseModel):
    id: str
    title: str
    summary: Optional[str]
    word_count: int
    created_at: datetime

    class Config:
        from_attributes = True
