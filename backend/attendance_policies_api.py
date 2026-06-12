from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import time

import models
from database import get_db

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
def create_policy(policy: AttendancePolicyCreate, db: Session = Depends(get_db)):
    if policy.is_default:
        # Unset other defaults
        db.query(models.AttendancePolicy).update({"is_default": False})
        
    new_policy = models.AttendancePolicy(**policy.dict())
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    return new_policy

@router.put("/{policy_id}", response_model=AttendancePolicyResponse)
def update_policy(policy_id: int, policy: AttendancePolicyCreate, db: Session = Depends(get_db)):
    existing = db.query(models.AttendancePolicy).filter_by(id=policy_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    if policy.is_default and not existing.is_default:
        db.query(models.AttendancePolicy).update({"is_default": False})
        
    for k, v in policy.dict().items():
        setattr(existing, k, v)
        
    db.commit()
    db.refresh(existing)
    return existing

@router.delete("/{policy_id}")
def delete_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(models.AttendancePolicy).filter_by(id=policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    if policy.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete the default policy")
        
    db.delete(policy)
    db.commit()
    return {"message": "Deleted successfully"}
