from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, date, timezone, timedelta
from jose import jwt, JWTError

import models
from database import get_db
from auth import SECRET_KEY, ALGORITHM

security = HTTPBearer()

router = APIRouter(prefix="/api/attendances", tags=["Attendances"])

KST = timezone(timedelta(hours=9))

def get_current_employee(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        emp = db.query(models.Employee).filter(models.Employee.email == email).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
        return emp
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/today")
def get_today_attendance(emp: models.Employee = Depends(get_current_employee), db: Session = Depends(get_db)):
    today = datetime.now(KST).date()
    record = db.query(models.Attendance).filter(
        models.Attendance.employee_id == emp.id,
        models.Attendance.work_date == today
    ).first()
    return record

@router.post("/clock-in")
def clock_in(emp: models.Employee = Depends(get_current_employee), db: Session = Depends(get_db)):
    today = datetime.now(KST).date()
    now = datetime.now(KST)
    record = db.query(models.Attendance).filter(
        models.Attendance.employee_id == emp.id,
        models.Attendance.work_date == today
    ).first()
    
    if record and record.check_in:
        raise HTTPException(status_code=400, detail="이미 출근 처리되었습니다.")
    
    if not record:
        record = models.Attendance(
            employee_id=emp.id,
            work_date=today,
            check_in=now.replace(tzinfo=None),
            status="정상"
        )
        db.add(record)
    else:
        record.check_in = now.replace(tzinfo=None)
    
    db.commit()
    db.refresh(record)
    
    check_in_iso = record.check_in.isoformat() if record.check_in else None
    
    return {"message": "출근이 완료되었습니다.", "check_in": check_in_iso}

@router.post("/clock-out")
def clock_out(emp: models.Employee = Depends(get_current_employee), db: Session = Depends(get_db)):
    today = datetime.now(KST).date()
    now = datetime.now(KST)
    record = db.query(models.Attendance).filter(
        models.Attendance.employee_id == emp.id,
        models.Attendance.work_date == today
    ).first()
    
    if not record or not record.check_in:
        raise HTTPException(status_code=400, detail="출근 기록이 없습니다.")
        
    record.check_out = now.replace(tzinfo=None)
    db.commit()
    db.refresh(record)
    
    check_out_iso = record.check_out.isoformat() if record.check_out else None
    
    return {"message": "퇴근이 완료되었습니다.", "check_out": check_out_iso}
