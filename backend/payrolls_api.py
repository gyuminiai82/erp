from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date
from pydantic import BaseModel

from database import get_db
from models import Payroll, Employee
from auth import get_current_user

router = APIRouter(
    prefix="/api/payrolls",
    tags=["payrolls"],
)

# Pydantic Models
class PayrollBase(BaseModel):
    employee_id: int
    payment_month: str
    base_salary: int
    bonus: int = 0
    deductions: int = 0
    payment_date: date

class PayrollCreate(PayrollBase):
    pass

class PayrollUpdate(BaseModel):
    base_salary: Optional[int] = None
    bonus: Optional[int] = None
    deductions: Optional[int] = None
    payment_date: Optional[date] = None

class PayrollResponse(PayrollBase):
    id: int
    net_pay: int
    employee_name: Optional[str] = None
    employee_no: Optional[str] = None
    department_name: Optional[str] = None

    class Config:
        orm_mode = True

# CRUD Endpoints

@router.get("", response_model=List[PayrollResponse])
def get_payrolls(month: Optional[str] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # 관리자만 전체 조회가 가능하도록 하거나, 일반 사원은 자기 것만 보게 하려면 여기 로직을 추가
    query = db.query(Payroll)
    
    if month:
        query = query.filter(Payroll.payment_month == month)
        
    payrolls = query.order_by(Payroll.employee_id, Payroll.payment_month.desc()).all()
    
    # 조인해서 이름 매핑 (간단한 응답 생성)
    results = []
    for p in payrolls:
        emp = db.query(Employee).filter(Employee.id == p.employee_id).first()
        res = PayrollResponse(
            id=p.id,
            employee_id=p.employee_id,
            payment_month=p.payment_month,
            base_salary=p.base_salary,
            bonus=p.bonus,
            deductions=p.deductions,
            net_pay=p.net_pay,
            payment_date=p.payment_date,
            employee_name=emp.name if emp else None,
            employee_no=emp.emp_no if emp else None,
            department_name=emp.department.name if emp and emp.department else None
        )
        results.append(res)
        
    return results

@router.post("", response_model=PayrollResponse)
def create_payroll(payroll: PayrollCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # 관리자 권한 체크 필요 (추가 구현)
    
    # 실수령액 계산
    net_pay = payroll.base_salary + payroll.bonus - payroll.deductions
    
    db_payroll = Payroll(
        **payroll.dict(),
        net_pay=net_pay
    )
    db.add(db_payroll)
    db.commit()
    db.refresh(db_payroll)
    
    emp = db.query(Employee).filter(Employee.id == db_payroll.employee_id).first()
    
    return PayrollResponse(
        **db_payroll.__dict__,
        employee_name=emp.name if emp else None,
        employee_no=emp.emp_no if emp else None,
        department_name=emp.department.name if emp and emp.department else None
    )

@router.put("/{payroll_id}", response_model=PayrollResponse)
def update_payroll(payroll_id: int, payroll: PayrollUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not db_payroll:
        raise HTTPException(status_code=404, detail="Payroll not found")
        
    update_data = payroll.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_payroll, key, value)
        
    # 실수령액 재계산
    db_payroll.net_pay = db_payroll.base_salary + db_payroll.bonus - db_payroll.deductions
    
    db.commit()
    db.refresh(db_payroll)
    
    emp = db.query(Employee).filter(Employee.id == db_payroll.employee_id).first()
    return PayrollResponse(
        **db_payroll.__dict__,
        employee_name=emp.name if emp else None,
        employee_no=emp.emp_no if emp else None,
        department_name=emp.department.name if emp and emp.department else None
    )

@router.delete("/{payroll_id}")
def delete_payroll(payroll_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not db_payroll:
        raise HTTPException(status_code=404, detail="Payroll not found")
        
    db.delete(db_payroll)
    db.commit()
    return {"ok": True}
