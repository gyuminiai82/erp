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

class BulkPayrollCreateRequest(BaseModel):
    payrolls: List[PayrollCreate]

class PayrollUpdateWithId(PayrollUpdate):
    id: int

class BulkPayrollUpdateRequest(BaseModel):
    payrolls: List[PayrollUpdateWithId]

class BulkPayrollDeleteRequest(BaseModel):
    payroll_ids: List[int]

# CRUD Endpoints

@router.get("/my", response_model=List[PayrollResponse])
def get_my_payrolls(month: Optional[str] = None, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    query = db.query(Payroll).filter(Payroll.employee_id == current_user.id)
    if month:
        query = query.filter(Payroll.payment_month == month)
        
    payrolls = query.order_by(Payroll.payment_month.desc()).all()
    
    results = []
    for p in payrolls:
        res = PayrollResponse(
            id=p.id,
            employee_id=p.employee_id,
            payment_month=p.payment_month,
            base_salary=p.base_salary,
            bonus=p.bonus,
            deductions=p.deductions,
            net_pay=p.net_pay,
            payment_date=p.payment_date,
            employee_name=current_user.name,
            employee_no=current_user.emp_no,
            department_name=current_user.department.name if current_user.department else None
        )
        results.append(res)
    return results

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

@router.post("/bulk-create")
def bulk_create_payrolls(payload: BulkPayrollCreateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    created_count = 0
    for p in payload.payrolls:
        net_pay = p.base_salary + p.bonus - p.deductions
        db_payroll = Payroll(**p.dict(), net_pay=net_pay)
        db.add(db_payroll)
        created_count += 1
    db.commit()
    return {"message": f"{created_count}건의 급여가 등록되었습니다."}

@router.post("/bulk-update")
def bulk_update_payrolls(payload: BulkPayrollUpdateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    updated_count = 0
    for p in payload.payrolls:
        db_payroll = db.query(Payroll).filter(Payroll.id == p.id).first()
        if db_payroll:
            update_data = p.dict(exclude_unset=True, exclude={"id"})
            for key, value in update_data.items():
                setattr(db_payroll, key, value)
            db_payroll.net_pay = db_payroll.base_salary + db_payroll.bonus - db_payroll.deductions
            updated_count += 1
    db.commit()
    return {"message": f"{updated_count}건의 급여가 수정되었습니다."}

@router.post("/bulk-delete")
def bulk_delete_payrolls(payload: BulkPayrollDeleteRequest, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    deleted_count = 0
    for pid in payload.payroll_ids:
        db_payroll = db.query(Payroll).filter(Payroll.id == pid).first()
        if db_payroll:
            db.delete(db_payroll)
            deleted_count += 1
    db.commit()
    return {"message": f"{deleted_count}건의 급여가 삭제되었습니다."}

@router.post("/generate")
def generate_payrolls(payload: PayrollGenerateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    from models import SystemSetting, Attendance, AttendancePolicy, LeaveBalance
    from sqlalchemy import extract
    import datetime
    
    # 1. 활성 사원 목록
    employees = db.query(Employee).filter(Employee.is_active == True, Employee.deleted_at == None).all()
    
    # 2. 요율 및 배수 설정 가져오기
    setting = db.query(SystemSetting).first()
    nps_rate = setting.national_pension_rate if setting and setting.national_pension_rate is not None else 0.045
    nhis_rate = setting.health_insurance_rate if setting and setting.health_insurance_rate is not None else 0.03545
    ltci_rate = setting.long_term_care_rate if setting and setting.long_term_care_rate is not None else 0.1295
    ei_rate = setting.employment_insurance_rate if setting and setting.employment_insurance_rate is not None else 0.009
    
    over_mult = setting.overtime_multiplier if setting and getattr(setting, 'overtime_multiplier', None) is not None else 1.5
    holi_mult = setting.holiday_multiplier if setting and getattr(setting, 'holiday_multiplier', None) is not None else 1.5
    holi_over_mult = setting.holiday_overtime_multiplier if setting and getattr(setting, 'holiday_overtime_multiplier', None) is not None else 2.0
    
    tardiness_penalty_type = getattr(setting, 'tardiness_penalty_type', 'NONE') if setting else 'NONE'
    tardiness_grace_period = getattr(setting, 'tardiness_grace_period', 0) if setting else 0
    
    default_policy = db.query(AttendancePolicy).filter(AttendancePolicy.is_default == True).first()

    
    try:
        payment_year, payment_month_num = map(int, payload.payment_month.split('-'))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payment_month format. Use YYYY-MM")
    
    generated_count = 0
    
    for emp in employees:
        base = emp.base_salary or 0
        if base == 0:
            continue
            
        hourly_wage = base / 209.0
        bonus_calc = 0.0
        tardy_minutes = 0.0
        tardy_deduction = 0
        
        # 사원 맞춤 근태 기준 조회
        emp_policy = None
        if getattr(emp, 'attendance_policy_id', None):
            emp_policy = db.query(AttendancePolicy).filter(AttendancePolicy.id == emp.attendance_policy_id).first()
        policy = emp_policy if emp_policy else default_policy
        
        work_start_time = policy.work_start_time if policy and policy.work_start_time else datetime.time(9, 0)
        work_end_time = policy.work_end_time if policy and policy.work_end_time else datetime.time(18, 0)
    
        
        # 3. 근태 정보 조회하여 수당 계산
        attendances = db.query(Attendance).filter(
            Attendance.employee_id == emp.id,
            extract('year', Attendance.work_date) == payment_year,
            extract('month', Attendance.work_date) == payment_month_num,
            Attendance.check_out != None
        ).all()
        
        for att in attendances:
            if not att.check_out or not att.check_in:
                continue
                
            weekday = att.work_date.weekday()
            is_weekend = weekday >= 5
            
            if is_weekend:
                work_seconds = (att.check_out - att.check_in).total_seconds()
                work_hours = work_seconds / 3600.0
                if work_hours > 0:
                    if work_hours <= 8:
                        bonus_calc += work_hours * hourly_wage * holi_mult
                    else:
                        bonus_calc += 8 * hourly_wage * holi_mult
                        bonus_calc += (work_hours - 8) * hourly_wage * holi_over_mult
            else:
                in_time = att.check_in.time()
                std_start_dt = datetime.datetime.combine(att.check_in.date(), work_start_time)
                grace_td = datetime.timedelta(minutes=tardiness_grace_period)
                allowed_start_dt = std_start_dt + grace_td
                
                if att.check_in > allowed_start_dt:
                    # 지각 발생 (기준 시간 초과분 전체)
                    tardy_seconds = (att.check_in - std_start_dt).total_seconds()
                    tardy_minutes += tardy_seconds / 60.0
                    
                out_time = att.check_out.time()
                if out_time > work_end_time:
                    std_end_dt = datetime.datetime.combine(att.check_out.date(), work_end_time)
                    over_seconds = (att.check_out - std_end_dt).total_seconds()
                    if over_seconds > 0:
                        over_hours = over_seconds / 3600.0
                        bonus_calc += over_hours * hourly_wage * over_mult
                        
        bonus = int(bonus_calc)
        total_salary = base + bonus
        
        # 지각 차감 처리
        existing = db.query(Payroll).filter(Payroll.employee_id == emp.id, Payroll.payment_month == payload.payment_month).first()
        
        if tardy_minutes > 0:
            if tardiness_penalty_type == 'DEDUCT_SALARY':
                tardy_deduction = int((tardy_minutes / 60.0) * hourly_wage)
            elif tardiness_penalty_type == 'DEDUCT_LEAVE':
                tardy_hours = tardy_minutes / 60.0
                leave_balance = db.query(LeaveBalance).filter(LeaveBalance.employee_id == emp.id, LeaveBalance.year == payment_year).first()
                if leave_balance and leave_balance.remaining_hours >= tardy_hours:
                    # 중복 차감 방지: 기존 급여 명세서가 없을 때만 연차 차감
                    if not existing:
                        leave_balance.remaining_hours -= tardy_hours
                        leave_balance.used_hours += tardy_hours
                else:
                    # 연차 부족 시 급여 차감으로 전환
                    tardy_deduction = int((tardy_minutes / 60.0) * hourly_wage)

        # 4대보험 공제 계산 (세전 총액 기준)
        nps = int(total_salary * nps_rate)
        nhis = int(total_salary * nhis_rate)
        ltci = int(nhis * ltci_rate)
        ei = int(total_salary * ei_rate)
        
        # 총 공제액 = 4대보험 + 지각 차감
        deductions = int((nps + nhis + ltci + ei) / 10) * 10 + tardy_deduction
        net_pay = total_salary - deductions
        
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
