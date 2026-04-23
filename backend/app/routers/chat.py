from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import json

from app.database import get_db
from app.models.models import User, ChatSession, Message
from app.schemas.schemas import MessageCreate, ChatSessionOut, ChatSessionSummary, MessageOut
from app.utils.auth import get_current_user
from app.services.ai_service import stream_chat_response, generate_chat_title

router = APIRouter()


@router.get("/sessions", response_model=List[ChatSessionSummary])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    return sessions


@router.get("/sessions/{session_id}", response_model=ChatSessionOut)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()


@router.post("/stream")
async def stream_message(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stream AI response via Server-Sent Events."""
    # Create or retrieve session
    if payload.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == payload.session_id,
            ChatSession.user_id == current_user.id,
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        session = ChatSession(user_id=current_user.id, title="New Chat")
        db.add(session)
        db.commit()
        db.refresh(session)

    # Save user message
    user_msg = Message(session_id=session.id, role="user", content=payload.content)
    db.add(user_msg)
    db.commit()

    # Build message history for context
    history_msgs = (
        db.query(Message)
        .filter(Message.session_id == session.id)
        .order_by(Message.created_at)
        .all()
    )
    messages = [{"role": m.role, "content": m.content} for m in history_msgs]

    # Auto-generate title on first message
    is_first = len(history_msgs) == 1
    session_id = session.id

    async def event_generator():
        full_response = []

        # Send session_id first so frontend knows which session to update
        yield f"data: {json.dumps({'type': 'session_id', 'session_id': session_id})}\n\n"

        try:
            async for chunk in stream_chat_response(messages):
                full_response.append(chunk)
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"

            # Save full assistant response
            assistant_content = "".join(full_response)
            assistant_msg = Message(
                session_id=session_id,
                role="assistant",
                content=assistant_content,
            )
            db.add(assistant_msg)

            # Generate title for new session
            if is_first:
                title = generate_chat_title(payload.content)
                session_obj = db.query(ChatSession).filter(ChatSession.id == session_id).first()
                if session_obj:
                    session_obj.title = title

            db.commit()
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
