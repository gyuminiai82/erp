from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from typing import Optional
from websocket_manager import manager
import asyncio
import json
from auth import get_current_employee
from anyio.from_thread import run

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

def create_notification_sync(db: Session, employee_id: int, title: str, message: str, link: Optional[str] = None):
    new_noti = models.Notification(
        employee_id=employee_id,
        title=title,
        message=message,
        link=link
    )
    db.add(new_noti)
    db.commit()
    db.refresh(new_noti)
    
    noti_data = {
        "type": "new_notification",
        "data": {
            "id": new_noti.id,
            "title": new_noti.title,
            "message": new_noti.message,
            "link": new_noti.link,
            "is_read": new_noti.is_read,
            "created_at": new_noti.created_at.isoformat()
        }
    }
    
    try:
        run(manager.send_personal_message, json.dumps(noti_data), employee_id)
    except Exception as e:
        print(f"Error sending websocket notification: {e}")

@router.get("")
def get_notifications(db: Session = Depends(get_db), current_user: models.Employee = Depends(get_current_employee)):
    notis = db.query(models.Notification).filter(
        models.Notification.employee_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(50).all()
    
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "link": n.link,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        }
        for n in notis
    ]

@router.put("/{noti_id}/read")
def read_notification(noti_id: int, db: Session = Depends(get_db), current_user: models.Employee = Depends(get_current_employee)):
    noti = db.query(models.Notification).filter(
        models.Notification.id == noti_id,
        models.Notification.employee_id == current_user.id
    ).first()
    if not noti:
        raise HTTPException(status_code=404, detail="Notification not found")
    noti.is_read = True
    db.commit()
    return {"message": "Success"}

@router.put("/read-all")
def read_all_notifications(db: Session = Depends(get_db), current_user: models.Employee = Depends(get_current_employee)):
    db.query(models.Notification).filter(
        models.Notification.employee_id == current_user.id,
        models.Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "Success"}
