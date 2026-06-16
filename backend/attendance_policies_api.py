from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import time

import models
from database import get_db
from auth import get_current_user_info
from fastapi import Request

router = APIRouter(prefix="/api/attendance-policies", tags=["AttendancePolicies"])

class AttendancePolicyBase(BaseModel):
    name: str
    policy_type: str = "FIXED"
    work_start_time: Optional[time] = None
    work_end_time: Optional[time] = None
    break_start_time: Optional[time] = None
    break_end_time: Optional[time] = None
    break_time_mins: int = 60
    core_time_start: Optional[time] = None
    core_time_end: Optional[time] = None
    required_work_hours: int = 8
    is_default: bool = False

class AttendancePolicyCreate(AttendancePolicyBase):
    pass

class AttendancePolicyResponse(AttendancePolicyBase):
    id: int
    class Config:
        from_attributes = True

@router.get("", response_model=List[AttendancePolicyResponse])
def get_policies(db: Session = Depends(get_db)):
    return db.query(models.AttendancePolicy).order_by(models.AttendancePolicy.id.asc()).all()

@router.post("", response_model=AttendancePolicyResponse)
def create_policy(
    request: Request,
    policy: AttendancePolicyCreate, 
    db: Session = Depends(get_db),
    user_info: dict = Depends(get_current_user_info)
):
    if policy.is_default:
        # Unset other defaults
        db.query(models.AttendancePolicy).update({"is_default": False})
        
    new_policy = models.AttendancePolicy(**policy.dict())
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    
    import json
    def default_serializer(obj):
        from datetime import time
        if isinstance(obj, time):
            return obj.strftime("%H:%M:%S")
        raise TypeError(f"Type {type(obj)} not serializable")
        
    audit = models.AuditLog(
        event_title="근태 기준 설정 추가",
        event_desc=f"새로운 근태 정책 '{new_policy.name}'이(가) 추가되었습니다.",
        user_name=user_info.get("name", "Unknown"),
        user_email=user_info.get("email", "Unknown"),
        ip_address=request.client.host if request.client else "Unknown",
        severity="INFO",
        target_resource="AttendancePolicy",
        action_type="INSERT",
        payload=json.dumps({"new": policy.dict()}, ensure_ascii=False, default=default_serializer)
    )
    db.add(audit)
    db.commit()
    
    return new_policy

@router.put("/{policy_id}", response_model=AttendancePolicyResponse)
def update_policy(
    request: Request,
    policy_id: int, 
    policy: AttendancePolicyCreate, 
    db: Session = Depends(get_db),
    user_info: dict = Depends(get_current_user_info)
):
    existing = db.query(models.AttendancePolicy).filter_by(id=policy_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    if policy.is_default and not existing.is_default:
        db.query(models.AttendancePolicy).update({"is_default": False})
        
    old_data = {
        "name": existing.name,
        "policy_type": existing.policy_type,
        "work_start_time": existing.work_start_time,
        "work_end_time": existing.work_end_time,
        "break_start_time": existing.break_start_time,
        "break_end_time": existing.break_end_time,
        "break_time_mins": existing.break_time_mins,
        "core_time_start": existing.core_time_start,
        "core_time_end": existing.core_time_end,
        "required_work_hours": existing.required_work_hours,
        "is_default": existing.is_default
    }
        
    for k, v in policy.dict().items():
        setattr(existing, k, v)
        
    db.commit()
    db.refresh(existing)
    
    new_data = policy.dict()
    if old_data != new_data:
        import json
        def default_serializer(obj):
            from datetime import time
            if isinstance(obj, time):
                return obj.strftime("%H:%M:%S")
            raise TypeError(f"Type {type(obj)} not serializable")
            
        audit = models.AuditLog(
            event_title="근태 기준 설정 변경",
            event_desc=f"근태 정책 '{existing.name}'의 정보가 변경되었습니다.",
            user_name=user_info.get("name", "Unknown"),
            user_email=user_info.get("email", "Unknown"),
            ip_address=request.client.host if request.client else "Unknown",
            severity="INFO",
            target_resource="AttendancePolicy",
            action_type="UPDATE",
            payload=json.dumps({"old": old_data, "new": new_data}, ensure_ascii=False, default=default_serializer)
        )
        db.add(audit)
        db.commit()
        
    return existing

@router.delete("/{policy_id}")
def delete_policy(
    request: Request,
    policy_id: int, 
    db: Session = Depends(get_db),
    user_info: dict = Depends(get_current_user_info)
):
    policy = db.query(models.AttendancePolicy).filter_by(id=policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    if policy.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete the default policy")
        
    old_data = {
        "name": policy.name,
        "policy_type": policy.policy_type,
        "work_start_time": policy.work_start_time,
        "work_end_time": policy.work_end_time,
        "break_start_time": policy.break_start_time,
        "break_end_time": policy.break_end_time,
        "break_time_mins": policy.break_time_mins,
        "core_time_start": policy.core_time_start,
        "core_time_end": policy.core_time_end,
        "required_work_hours": policy.required_work_hours,
        "is_default": policy.is_default
    }
        
    db.delete(policy)
    db.commit()
    
    import json
    def default_serializer(obj):
        from datetime import time
        if isinstance(obj, time):
            return obj.strftime("%H:%M:%S")
        raise TypeError(f"Type {type(obj)} not serializable")
        
    audit = models.AuditLog(
        event_title="근태 기준 설정 삭제",
        event_desc=f"근태 정책 '{old_data['name']}'이(가) 삭제되었습니다.",
        user_name=user_info.get("name", "Unknown"),
        user_email=user_info.get("email", "Unknown"),
        ip_address=request.client.host if request.client else "Unknown",
        severity="INFO",
        target_resource="AttendancePolicy",
        action_type="DELETE",
        payload=json.dumps({"old": old_data}, ensure_ascii=False, default=default_serializer)
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Deleted successfully"}
