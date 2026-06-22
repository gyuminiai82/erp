from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, timedelta, datetime
from typing import List, Optional
from pydantic import BaseModel
import holidays
from dateutil.relativedelta import relativedelta

from database import get_db
import models
from auth import SECRET_KEY, ALGORITHM
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from notifications_api import create_notification_sync

security = HTTPBearer()

def get_current_employee(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(models.Employee).filter(models.Employee.email == email).first()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

router = APIRouter(prefix="/api/leaves", tags=["Leaves"])

def calculate_annual_leave(hire_date: date, target_year: int) -> float:
    if not hire_date or hire_date.year > target_year:
        return 0.0
    cal_years_worked = target_year - hire_date.year
    if cal_years_worked == 0:
        return float(12 - hire_date.month)
    elif cal_years_worked <= 2:
        return 15.0
    else:
        extra_days = (cal_years_worked - 1) // 2
        return min(15.0 + extra_days, 25.0)

def calculate_business_days(start_date: date, end_date: date) -> float:
    kr_holidays = holidays.KR()
    business_days = 0
    current_date = start_date
    while current_date <= end_date:
        if current_date.weekday() < 5 and current_date not in kr_holidays:
            business_days += 1
        current_date += timedelta(days=1)
    return float(business_days)

def get_or_create_leave_balance(db: Session, employee: models.Employee, target_year: int) -> models.LeaveBalance:
    balance = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == employee.id, models.LeaveBalance.year == target_year).first()
    total_days = calculate_annual_leave(employee.hire_date, target_year) if employee.hire_date else 0.0
    if not balance:
        balance = models.LeaveBalance(employee_id=employee.id, year=target_year, total_days=total_days, used_days=0.0)
        db.add(balance)
        db.commit()
        db.refresh(balance)
    elif balance.total_days != total_days:
        balance.total_days = total_days
        db.commit()
        db.refresh(balance)
    return balance

class LeaveBalanceResponse(BaseModel):
    year: int
    total_days: float
    used_days: float
    remaining_days: float

@router.get("/balance", response_model=LeaveBalanceResponse)
def get_my_leave_balance(emp: models.Employee = Depends(get_current_employee), db: Session = Depends(get_db)):
    current_year = date.today().year
    balance = get_or_create_leave_balance(db, emp, current_year)
    return {
        "year": balance.year,
        "total_days": balance.total_days,
        "used_days": balance.used_days,
        "remaining_days": balance.total_days - balance.used_days
    }

class LeaveRequestCreate(BaseModel):
    start_date: date
    end_date: date
    leave_type: str
    reason: str

class LeaveRequestStatusUpdate(BaseModel):
    status: str # "승인" or "반려"

class EmployeeBase(BaseModel):
    id: int
    name: str
    department: Optional[str] = None
    position: Optional[str] = None
    
    class Config:
        from_attributes = True

class LeaveResponse(BaseModel):
    id: int
    employee_id: int
    start_date: date
    end_date: date
    leave_type: str
    status: str
    reason: str
    approver_id: Optional[int]
    employee: Optional[EmployeeBase] = None
    remaining_balance: Optional[float] = None
    
    class Config:
        from_attributes = True

@router.post("/apply", response_model=LeaveResponse)
def apply_leave(req: LeaveRequestCreate, emp: models.Employee = Depends(get_current_employee), db: Session = Depends(get_db)):
    if req.start_date > req.end_date:
        raise HTTPException(status_code=400, detail="Start date cannot be after end date")
        
    deduction = 0.0
    if req.leave_type == "연차":
        deduction = calculate_business_days(req.start_date, req.end_date)
    elif req.leave_type in ["오전반차", "오후반차"]:
        deduction = 0.5
        
    current_year = req.start_date.year
    balance = get_or_create_leave_balance(db, emp, current_year)
    
    if deduction > 0 and balance.total_days - balance.used_days < deduction:
        raise HTTPException(status_code=400, detail=f"잔여 연차가 부족합니다. (잔여: {balance.total_days - balance.used_days}일, 신청: {deduction}일)")

    leave = models.LeaveRequest(
        employee_id=emp.id,
        start_date=req.start_date,
        end_date=req.end_date,
        leave_type=req.leave_type,
        reason=req.reason,
        status="대기"
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    
    managers = db.query(models.Employee).join(models.EmployeeRole).join(models.Role).filter(
        models.Role.name.in_(["master", "hr_manager", "manager"])
    ).all()
    for m in managers:
        create_notification_sync(db, m.id, "휴가 신청", f"{emp.name}님의 휴가 신청이 접수되었습니다.", "/erp/leaves")
        
    return leave

@router.get("/my", response_model=List[LeaveResponse])
def get_my_leaves(emp: models.Employee = Depends(get_current_employee), db: Session = Depends(get_db)):
    leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.employee_id == emp.id).order_by(models.LeaveRequest.id.desc()).all()
    
    # attach dept/pos info manually if needed, or rely on relationship
    result = []
    for l in leaves:
        dept_name = l.employee.department.name if l.employee and l.employee.department else None
        pos_name = l.employee.position.name if l.employee and l.employee.position else None
        
        emp_base = EmployeeBase(
            id=l.employee.id,
            name=l.employee.name,
            department=dept_name,
            position=pos_name
        ) if l.employee else None
        
        balance = get_or_create_leave_balance(db, l.employee, l.start_date.year) if l.employee else None
        
        l_dict = {
            "id": l.id,
            "employee_id": l.employee_id,
            "start_date": l.start_date,
            "end_date": l.end_date,
            "leave_type": l.leave_type,
            "status": l.status,
            "reason": l.reason,
            "approver_id": l.approver_id,
            "employee": emp_base,
            "remaining_balance": (balance.total_days - balance.used_days) if balance else None
        }
        result.append(l_dict)
    
    return result

@router.get("/all", response_model=List[LeaveResponse])
def get_all_leaves(emp: models.Employee = Depends(get_current_employee), db: Session = Depends(get_db)):
    # Check if manager or master
    is_manager = any(r.role.name in ["master", "hr_manager", "manager"] for r in emp.roles)
    if not is_manager:
        raise HTTPException(status_code=403, detail="Not authorized to view all leaves")
        
    leaves = db.query(models.LeaveRequest).order_by(models.LeaveRequest.id.desc()).all()
    
    result = []
    for l in leaves:
        dept_name = l.employee.department.name if l.employee and l.employee.department else None
        pos_name = l.employee.position.name if l.employee and l.employee.position else None
        
        emp_base = EmployeeBase(
            id=l.employee.id,
            name=l.employee.name,
            department=dept_name,
            position=pos_name
        ) if l.employee else None
        
        balance = get_or_create_leave_balance(db, l.employee, l.start_date.year) if l.employee else None

        l_dict = {
            "id": l.id,
            "employee_id": l.employee_id,
            "start_date": l.start_date,
            "end_date": l.end_date,
            "leave_type": l.leave_type,
            "status": l.status,
            "reason": l.reason,
            "approver_id": l.approver_id,
            "employee": emp_base,
            "remaining_balance": (balance.total_days - balance.used_days) if balance else None
        }
        result.append(l_dict)
        
    return result

@router.put("/{leave_id}/status", response_model=LeaveResponse)
def update_leave_status(leave_id: int, req: LeaveRequestStatusUpdate, emp: models.Employee = Depends(get_current_employee), db: Session = Depends(get_db)):
    # Check if manager or master
    is_manager = any(r.role.name in ["master", "hr_manager", "manager"] for r in emp.roles)
    if not is_manager:
        raise HTTPException(status_code=403, detail="Not authorized to approve leaves")
        
    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    if req.status not in ["승인", "반려"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    # Deduct or restore leave balance
    deduction = 0.0
    if leave.leave_type == "연차":
        deduction = calculate_business_days(leave.start_date, leave.end_date)
    elif leave.leave_type in ["오전반차", "오후반차"]:
        deduction = 0.5

    if deduction > 0:
        balance = get_or_create_leave_balance(db, leave.employee, leave.start_date.year)
        if leave.status != "승인" and req.status == "승인":
            # Approving
            if balance.total_days - balance.used_days < deduction:
                raise HTTPException(status_code=400, detail="잔여 연차가 부족하여 승인할 수 없습니다.")
            balance.used_days += deduction
        elif leave.status == "승인" and req.status != "승인":
            # Reverting approval
            balance.used_days -= deduction
            if balance.used_days < 0: balance.used_days = 0.0

    leave.status = req.status
    leave.approver_id = emp.id
    db.commit()
    db.refresh(leave)
    
    if req.status == "승인":
        create_notification_sync(db, leave.employee_id, "휴가 승인", f"신청하신 휴가가 승인되었습니다.", "/erp/leaves")
    elif req.status == "반려":
        create_notification_sync(db, leave.employee_id, "휴가 반려", f"신청하신 휴가가 반려되었습니다.", "/erp/leaves")
    
    dept_name = leave.employee.department.name if leave.employee and leave.employee.department else None
    pos_name = leave.employee.position.name if leave.employee and leave.employee.position else None
    
    emp_base = EmployeeBase(
        id=leave.employee.id,
        name=leave.employee.name,
        department=dept_name,
        position=pos_name
    ) if leave.employee else None
    
    return {
        "id": leave.id,
        "employee_id": leave.employee_id,
        "start_date": leave.start_date,
        "end_date": leave.end_date,
        "leave_type": leave.leave_type,
        "status": leave.status,
        "reason": leave.reason,
        "approver_id": leave.approver_id,
        "employee": emp_base
    }

@router.delete("/{leave_id}")
def delete_leave(leave_id: int, emp: models.Employee = Depends(get_current_employee), db: Session = Depends(get_db)):
    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    if leave.employee_id != emp.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this leave request")
        
    if leave.status != "대기":
        raise HTTPException(status_code=400, detail="Only pending leave requests can be deleted")
        
    db.delete(leave)
    db.commit()
    return {"detail": "Leave request deleted successfully"}
