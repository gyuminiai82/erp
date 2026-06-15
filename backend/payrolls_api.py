from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date
from pydantic import BaseModel

from database import get_db
from models import Payroll, Employee
from auth import SECRET_KEY, ALGORITHM
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

security = HTTPBearer()

def get_current_employee(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        emp = db.query(Employee).filter(Employee.email == email).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
        return emp
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

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

class PayrollGenerateRequest(BaseModel):
    payment_month: str

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
def get_payrolls(month: Optional[str] = None, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
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
def create_payroll(payroll: PayrollCreate, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
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
def update_payroll(payroll_id: int, payroll: PayrollUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
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
def delete_payroll(payroll_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    db_payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not db_payroll:
        raise HTTPException(status_code=404, detail="Payroll not found")
        
    db.delete(db_payroll)
    db.commit()
    return {"ok": True}

@router.post("/generate")
def generate_payrolls(payload: PayrollGenerateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    from models import SystemSetting
    
    # 1. 활성 사원 목록
    employees = db.query(Employee).filter(Employee.is_active == True, Employee.deleted_at == None).all()
    
    # 2. 4대보험 요율 설정 가져오기
    setting = db.query(SystemSetting).first()
    nps_rate = setting.nps_rate if setting and setting.nps_rate is not None else 4.75
    nhis_rate = setting.nhis_rate if setting and setting.nhis_rate is not None else 3.595
    ltci_rate = setting.ltci_rate if setting and setting.ltci_rate is not None else 13.25
    ei_rate = setting.ei_rate if setting and setting.ei_rate is not None else 0.9
    
    generated_count = 0
    
    for emp in employees:
        base = emp.base_salary or 0
        if base == 0:
            continue
            
        nps = int(base * (nps_rate / 100))
        nhis = int(base * (nhis_rate / 100))
        ltci = int(nhis * (ltci_rate / 100))
        ei = int(base * (ei_rate / 100))
        
        deductions = nps + nhis + ltci + ei
        bonus = 0
        net_pay = base + bonus - deductions
        
        existing = db.query(Payroll).filter(Payroll.employee_id == emp.id, Payroll.payment_month == payload.payment_month).first()
        if existing:
            existing.base_salary = base
            existing.bonus = bonus
            existing.deductions = deductions
            existing.net_pay = net_pay
        else:
            new_payroll = Payroll(
                employee_id=emp.id,
                payment_month=payload.payment_month,
                base_salary=base,
                bonus=bonus,
                deductions=deductions,
                net_pay=net_pay,
                payment_date=date.today()
            )
            db.add(new_payroll)
        generated_count += 1
        
    db.commit()
    return {"message": f"{generated_count}명의 급여 대장이 자동 산출되었습니다."}
