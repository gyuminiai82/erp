from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import AuditLog
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter()

class AuditLogResponse(BaseModel):
    id: int
    created_at: datetime
    event_title: str
    event_desc: str
    user_email: str
    ip_address: str
    severity: str

    class Config:
        from_attributes = True

@router.get("/api/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db)):
    # 최신 로그 20개를 반환
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(20).all()
    return logs
