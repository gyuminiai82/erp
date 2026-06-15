from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models import AuditLog
from pydantic import BaseModel
from typing import List, Optional
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
    target_resource: Optional[str] = None
    action_type: Optional[str] = None
    payload: Optional[str] = None

    class Config:
        from_attributes = True

class PaginatedAuditLogResponse(BaseModel):
    total: int
    items: List[AuditLogResponse]

@router.get("/api/audit-logs", response_model=PaginatedAuditLogResponse)
def get_audit_logs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    severity: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    
    if severity and severity != 'ALL':
        query = query.filter(AuditLog.severity == severity)
        
    if keyword:
        query = query.filter(
            or_(
                AuditLog.event_title.ilike(f"%{keyword}%"),
                AuditLog.user_email.ilike(f"%{keyword}%"),
                AuditLog.event_desc.ilike(f"%{keyword}%")
            )
        )
        
    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * size).limit(size).all()
    
    return {"total": total, "items": logs}
