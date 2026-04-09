from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.notification import Notification
from models.user import User
from utils.security import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

def get_db_user(db: Session, current_user_token):
    user = db.query(User).filter(User.email == current_user_token["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def serialize_notification(notification: Notification):
    return {
        "id": str(notification.id),
        "title": notification.title,
        "message": notification.message,
        "channel": notification.channel,
        "is_read": notification.is_read,
        "created_at": notification.created_at,
    }

@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user_token = Depends(get_current_user)
):
    user = get_db_user(db, current_user_token)
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [serialize_notification(notification) for notification in notifications]

@router.put("/{notification_id}/read")
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user_token = Depends(get_current_user)
):
    user = get_db_user(db, current_user_token)
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}
