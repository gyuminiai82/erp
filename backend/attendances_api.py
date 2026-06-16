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

from sqlalchemy.orm import joinedload
import calendar

@router.get("/my")
def get_my_attendances(year: int, month: int, emp: models.Employee = Depends(get_current_employee), db: Session = Depends(get_db)):
    start_date = date(year, month, 1)
    end_date = date(year, month, calendar.monthrange(year, month)[1])
    
    records = db.query(models.Attendance).filter(
        models.Attendance.employee_id == emp.id,
        models.Attendance.work_date >= start_date,
        models.Attendance.work_date <= end_date
    ).all()
    
    result = []
    for r in records:
        result.append({
            "id": r.id,
            "work_date": r.work_date,
            "check_in": r.check_in,
            "check_out": r.check_out,
            "status": r.status,
        })
        
    leaves_query = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.employee_id == emp.id,
        models.LeaveRequest.status == '승인',
        models.LeaveRequest.start_date <= end_date,
        models.LeaveRequest.end_date >= start_date
    ).all()

    leaves = []
    for l in leaves_query:
        leaves.append({
            "id": l.id,
            "start_date": l.start_date,
            "end_date": l.end_date,
            "leave_type": l.leave_type,
        })

    return {"attendances": result, "leaves": leaves}

@router.get("/all")
def get_all_attendances(year: int, month: int, emp: models.Employee = Depends(get_current_employee), db: Session = Depends(get_db)):
    start_date = date(year, month, 1)
    end_date = date(year, month, calendar.monthrange(year, month)[1])
    
    records = db.query(models.Attendance).options(
        joinedload(models.Attendance.employee).joinedload(models.Employee.department),
        joinedload(models.Attendance.employee).joinedload(models.Employee.position)
    ).filter(
        models.Attendance.work_date >= start_date,
        models.Attendance.work_date <= end_date
    ).all()
    
    result = []
    for r in records:
        result.append({
            "id": r.id,
            "employee_id": r.employee_id,
            "work_date": r.work_date,
            "check_in": r.check_in,
            "check_out": r.check_out,
            "status": r.status,
            "employee": {
                "name": r.employee.name if r.employee else None,
                "emp_no": r.employee.emp_no if r.employee else None,
                "department": r.employee.department.name if r.employee and r.employee.department else None,
                "position": r.employee.position.name if r.employee and r.employee.position else None
            }
        })
    leaves_query = db.query(models.LeaveRequest).options(
        joinedload(models.LeaveRequest.employee).joinedload(models.Employee.department),
        joinedload(models.LeaveRequest.employee).joinedload(models.Employee.position)
    ).filter(
        models.LeaveRequest.status == '승인',
        models.LeaveRequest.start_date <= end_date,
        models.LeaveRequest.end_date >= start_date
    ).all()

    leaves = []
    for l in leaves_query:
        leaves.append({
            "id": l.id,
            "employee_id": l.employee_id,
            "start_date": l.start_date,
            "end_date": l.end_date,
            "leave_type": l.leave_type,
            "employee": {
                "name": l.employee.name if l.employee else None,
                "emp_no": l.employee.emp_no if l.employee else None,
                "department": l.employee.department.name if l.employee and l.employee.department else None,
                "position": l.employee.position.name if l.employee and l.employee.position else None
            }
        })

    return {"attendances": result, "leaves": leaves}

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
    
    policy = db.query(models.AttendancePolicy).filter_by(is_default=True).first()
    status = "정상"
    if policy and policy.work_start_time:
        if now.time() > policy.work_start_time:
            status = "지각"
            
    if not record:
        record = models.Attendance(
            employee_id=emp.id,
            work_date=today,
            check_in=now.replace(tzinfo=None),
            status=status
        )
        db.add(record)
    else:
        record.check_in = now.replace(tzinfo=None)
        record.status = status
    
    db.commit()
    db.refresh(record)
    
    check_in_iso = record.check_in.isoformat() if record.check_in else None
    
    return {"message": "출근이 완료되었습니다.", "check_in": check_in_iso, "status": record.status}

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
    
    # Calculate status upon checkout
    policy = db.query(models.AttendancePolicy).filter_by(is_default=True).first()
    diff = record.check_out - record.check_in
    hours_worked = diff.total_seconds() / 3600
    
    if policy and policy.work_start_time and policy.work_end_time:
        if record.check_in.time() > policy.work_start_time:
            record.status = "지각"
        elif hours_worked < (policy.required_work_hours / 2) or record.check_out.time() < policy.work_end_time:
            record.status = "조퇴"
        else:
            record.status = "정상"
    else:
        # Fallback if no policy
        if hours_worked < 4:
            record.status = "조퇴"
            
    db.commit()
    db.refresh(record)
    
    check_out_iso = record.check_out.isoformat() if record.check_out else None
    
    return {"message": "퇴근이 완료되었습니다.", "check_out": check_out_iso, "status": record.status}
