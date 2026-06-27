from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_, and_, desc
from sqlalchemy.orm import Session
from db.database import get_db
from models.chat import ChatMessage
from models.pool import Pool
from models.user import User
from utils.security import get_current_user
import uuid

router = APIRouter()

class ChatMessageRequest(BaseModel):
    pool_id: str
    receiver_id: str
    message: str

def get_db_user(db: Session, current_user_token):
    user = db.query(User).filter(User.email == current_user_token["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def serialize_message(message: ChatMessage):
    return {
        "id": str(message.id),
        "pool_id": str(message.pool_id),
        "pool_name": message.pool.name if message.pool else None,
        "sender_id": str(message.sender_id),
        "sender_name": message.sender.name if message.sender else None,
        "receiver_id": str(message.receiver_id),
        "receiver_name": message.receiver.name if message.receiver else None,
        "message": message.message,
        "created_at": message.created_at,
    }

@router.get("/inbox")
def get_inbox(
    db: Session = Depends(get_db),
    current_user_token = Depends(get_current_user)
):
    user = get_db_user(db, current_user_token)
    messages = (
        db.query(ChatMessage)
        .filter(or_(ChatMessage.sender_id == user.id, ChatMessage.receiver_id == user.id))
        .order_by(desc(ChatMessage.created_at))
        .all()
    )

    conversations = []
    seen = set()
    for message in messages:
        other_user = message.receiver if str(message.sender_id) == str(user.id) else message.sender
        if not other_user:
            continue
        key = (str(message.pool_id), str(other_user.id))
        if key in seen:
            continue
        seen.add(key)
        conversations.append({
            "pool_id": str(message.pool_id),
            "pool_name": message.pool.name if message.pool else "Pool",
            "other_user_id": str(other_user.id),
            "other_user_name": other_user.name or other_user.email,
            "other_user_email": other_user.email,
            "last_message": message.message,
            "last_message_at": message.created_at,
            "last_sender_id": str(message.sender_id),
            "last_sender_name": message.sender.name if message.sender else None,
        })

    return conversations

@router.get("/{pool_id}/{other_user_id}")
def get_thread(
    pool_id: str,
    other_user_id: str,
    db: Session = Depends(get_db),
    current_user_token = Depends(get_current_user)
):
    user = get_db_user(db, current_user_token)
    messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.pool_id == uuid.UUID(pool_id),
            or_(
                and_(ChatMessage.sender_id == user.id, ChatMessage.receiver_id == uuid.UUID(other_user_id)),
                and_(ChatMessage.sender_id == uuid.UUID(other_user_id), ChatMessage.receiver_id == user.id),
            )
        )
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [serialize_message(message) for message in messages]

@router.post("/")
def send_message(
    payload: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user_token = Depends(get_current_user)
):
    sender = get_db_user(db, current_user_token)
    pool = db.query(Pool).filter(Pool.id == uuid.UUID(payload.pool_id)).first()
    receiver = db.query(User).filter(User.id == uuid.UUID(payload.receiver_id)).first()

    if not pool:
        raise HTTPException(status_code=404, detail="Pool not registered")
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    allowed = str(pool.owner_id) in [str(sender.id), str(receiver.id)]
    if not allowed:
        raise HTTPException(status_code=403, detail="Chat is only available between swimmers and the pool owner")

    message = ChatMessage(
        id=uuid.uuid4(),
        pool_id=uuid.UUID(payload.pool_id),
        sender_id=sender.id,
        receiver_id=receiver.id,
        message=payload.message.strip()
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return serialize_message(message)
