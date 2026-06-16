from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

import models
from database import get_db
from auth import get_current_employee
import json

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

class AppointmentBase(BaseModel):
    employee_id: int
    type: str
    before_dept_id: Optional[int] = None
    after_dept_id: Optional[int] = None
    before_pos_id: Optional[int] = None
    after_pos_id: Optional[int] = None
    appointment_date: date
    status: Optional[str] = "대기"
    memo: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    status: str

class AppointmentSchema(AppointmentBase):
    id: int
    
    # We will include basic info of related entities if possible, but let's just stick to IDs for now and return them from a custom dict if needed.
    
    class Config:
        from_attributes = True

@router.get("")
def get_appointments(db: Session = Depends(get_db)):
    appointments = db.query(models.Appointment).order_by(models.Appointment.appointment_date.desc()).all()
    result = []
    for app in appointments:
        result.append({
            "id": app.id,
            "employee_id": app.employee_id,
            "employee_name": app.employee.name if app.employee else None,
            "employee_no": app.employee.emp_no if app.employee else None,
            "type": app.type,
            "before_dept_id": app.before_dept_id,
            "before_dept_name": app.before_dept.name if app.before_dept else None,
            "after_dept_id": app.after_dept_id,
            "after_dept_name": app.after_dept.name if app.after_dept else None,
            "before_pos_id": app.before_pos_id,
            "before_pos_name": app.before_pos.name if app.before_pos else None,
            "after_pos_id": app.after_pos_id,
            "after_pos_name": app.after_pos.name if app.after_pos else None,
            "appointment_date": app.appointment_date,
            "status": app.status,
            "memo": app.memo
        })
    return result

@router.post("")
def create_appointment(data: AppointmentCreate, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    db_app = models.Appointment(
        employee_id=data.employee_id,
        type=data.type,
        before_dept_id=data.before_dept_id,
        after_dept_id=data.after_dept_id,
        before_pos_id=data.before_pos_id,
        after_pos_id=data.after_pos_id,
        appointment_date=data.appointment_date,
        status="대기",
        memo=data.memo
    )
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    
    try:
        audit = models.AuditLog(event_title="인사 발령 추가", event_desc=f"사원 ID {data.employee_id}에 대한 발령(유형: {data.type})을 추가했습니다.", user_name=current_user.name, user_email=current_user.email, payload=json.dumps({"employee_id": data.employee_id, "type": data.type}))
        db.add(audit); db.commit()
    except Exception as e: db.rollback()
    
    return db_app

@router.put("/{app_id}/status")
def update_appointment_status(app_id: int, data: AppointmentUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    db_app = db.query(models.Appointment).filter(models.Appointment.id == app_id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="발령 내역을 찾을 수 없습니다.")
        
    if db_app.status == "승인":
        raise HTTPException(status_code=400, detail="이미 승인된 발령은 상태를 변경할 수 없습니다.")
        
    db_app.status = data.status
    
    if data.status == "승인":
        # Apply the appointment to the employee
        employee = db.query(models.Employee).filter(models.Employee.id == db_app.employee_id).first()
        if employee:
            if db_app.after_dept_id is not None:
                employee.department_id = db_app.after_dept_id
            if db_app.after_pos_id is not None:
                employee.position_id = db_app.after_pos_id
                
    db.commit()
    db.refresh(db_app)
    
    try:
        audit = models.AuditLog(event_title="인사 발령 상태 변경", event_desc=f"발령 ID {app_id}의 상태를 '{data.status}'(으)로 변경했습니다.", user_name=current_user.name, user_email=current_user.email, payload=json.dumps({"app_id": app_id, "status": data.status}))
        db.add(audit); db.commit()
    except Exception as e: db.rollback()
    
    return db_app

@router.delete("/{app_id}")
def delete_appointment(app_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    db_app = db.query(models.Appointment).filter(models.Appointment.id == app_id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="발령 내역을 찾을 수 없습니다.")
    
    if db_app.status == "승인":
        raise HTTPException(status_code=400, detail="이미 승인된 발령 내역은 삭제할 수 없습니다.")
        
    db.delete(db_app)
    db.commit()
    
    try:
        audit = models.AuditLog(event_title="인사 발령 삭제", event_desc=f"발령 ID {app_id}을(를) 삭제했습니다.", user_name=current_user.name, user_email=current_user.email, payload=json.dumps({"app_id": app_id}))
        db.add(audit); db.commit()
    except Exception as e: db.rollback()
    
    return {"detail": "삭제되었습니다."}
