from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

import models
from database import get_db
from auth import get_password_hash
import crypto

router = APIRouter(
    prefix="/api/employees",
    tags=["Employees"]
)

class RoleUpdateRequest(BaseModel):
    role_id: str

class EmployeeBulkDeleteRequest(BaseModel):
    employee_ids: List[int]

class EmployeeUpdateRequest(BaseModel):
    id: int
    name: str = None
    email: str = None
    department: str = None
    position: str = None
    phone: str = None
    birth_date: str = None
    gender: str = None
    address: str = None
    employment_type: str = None
    resident_num: str = None
    status: str = None
    hire_date: str = None

class EmployeeBulkUpdateRequest(BaseModel):
    employees: List[EmployeeUpdateRequest]

class EmployeeCreateRequest(BaseModel):
    emp_no: str = None  # Frontend might send it, but we'll override it
    name: str
    email: str
    department_id: int = None
    position_id: int = None
    role_id: str = "employee"
    phone: str = None
    birth_date: str = None
    gender: str = None
    address: str = None
    employment_type: str = "정규직"
    resident_num: str = None
    profile_image_url: str = None

@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    return db.query(models.Department).all()

@router.get("/next-emp-no")
def get_next_emp_no(db: Session = Depends(get_db)):
    setting = db.query(models.SystemSetting).first()
    
    prefix = setting.emp_no_prefix if setting else "EMP"
    year_format = setting.emp_no_year_format if setting else "YY"
    seq_length = setting.emp_no_length if setting else 3
    
    year_str = ""
    current_year = datetime.now().year
    if year_format == "YY":
        year_str = str(current_year)[-2:]
    elif year_format == "YYYY":
        year_str = str(current_year)
        
    base_prefix = f"{prefix}{year_str}"
    
    latest_emp = db.query(models.Employee).filter(
        models.Employee.emp_no.like(f"{base_prefix}%")
    ).order_by(models.Employee.emp_no.desc()).first()
    
    next_seq = 1
    if latest_emp and latest_emp.emp_no.startswith(base_prefix):
        seq_str = latest_emp.emp_no[len(base_prefix):]
        if seq_str.isdigit():
            next_seq = int(seq_str) + 1
            
    next_emp_no = f"{base_prefix}{str(next_seq).zfill(seq_length)}"
    return {"next_emp_no": next_emp_no}

@router.get("")
def get_employees(db: Session = Depends(get_db)):
    employees = db.query(models.Employee).filter(models.Employee.deleted_at == None).order_by(models.Employee.emp_no).all()
    result = []
    for emp in employees:
        # Get primary role
        role_record = db.query(models.EmployeeRole).filter(models.EmployeeRole.employee_id == emp.id).first()
        role_id = role_record.role.name if role_record and role_record.role else "employee"
        
        # Get department and position names
        dept_name = emp.department.name if emp.department else ""
        pos_name = emp.position.name if emp.position else ""
        
        result.append({
            "id": emp.id,
            "emp_no": emp.emp_no,
            "name": emp.name,
            "email": emp.email,
            "department": dept_name,
            "department_id": emp.department_id,
            "position": pos_name,
            "position_id": emp.position_id,
            "role": role_id,
            "status": emp.status,
            "hire_date": str(emp.hire_date) if emp.hire_date else None,
            "phone": emp.phone,
            "birth_date": str(emp.birth_date) if emp.birth_date else None,
            "gender": emp.gender,
            "address": emp.address,
            "employment_type": emp.employment_type,
            "resident_num": crypto.mask_resident_num(emp.resident_num),
            "profile_image_url": emp.profile_image_url
        })
    return result

@router.put("/{emp_id}/role")
def update_employee_role(emp_id: int, payload: RoleUpdateRequest, db: Session = Depends(get_db)):
    emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    role = db.query(models.Role).filter(models.Role.name == payload.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    # Delete existing roles for simplicity (1:1 mapping in UI)
    db.query(models.EmployeeRole).filter(models.EmployeeRole.employee_id == emp_id).delete()
    
    # Insert new role
    new_emp_role = models.EmployeeRole(employee_id=emp_id, role_id=role.id)
    db.add(new_emp_role)
    db.commit()
    
    return {"message": "Role updated successfully", "new_role": payload.role_id}

@router.post("")
def create_employee(payload: EmployeeCreateRequest, db: Session = Depends(get_db)):
    # Generate actual emp_no
    setting = db.query(models.SystemSetting).first()
    prefix = setting.emp_no_prefix if setting else "EMP"
    year_format = setting.emp_no_year_format if setting else "YY"
    seq_length = setting.emp_no_length if setting else 3
    year_str = ""
    current_year = datetime.now().year
    if year_format == "YY":
        year_str = str(current_year)[-2:]
    elif year_format == "YYYY":
        year_str = str(current_year)
    base_prefix = f"{prefix}{year_str}"
    latest_emp = db.query(models.Employee).filter(models.Employee.emp_no.like(f"{base_prefix}%")).order_by(models.Employee.emp_no.desc()).first()
    next_seq = 1
    if latest_emp and latest_emp.emp_no.startswith(base_prefix):
        seq_str = latest_emp.emp_no[len(base_prefix):]
        if seq_str.isdigit():
            next_seq = int(seq_str) + 1
    final_emp_no = f"{base_prefix}{str(next_seq).zfill(seq_length)}"

    existing = db.query(models.Employee).filter(models.Employee.emp_no == final_emp_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="사번 생성 중 충돌이 발생했습니다. 다시 시도해주세요.")
    
    existing_email = db.query(models.Employee).filter(models.Employee.email == payload.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다.")

    new_emp = models.Employee(
        emp_no=final_emp_no,
        name=payload.name,
        email=payload.email,
        department_id=payload.department_id,
        position_id=payload.position_id,
        password_hash=get_password_hash("1234"),
        must_change_password=True,
        hire_date=datetime.now().date(),
        phone=payload.phone,
        birth_date=datetime.strptime(payload.birth_date, "%Y-%m-%d").date() if payload.birth_date else None,
        gender=payload.gender,
        address=payload.address,
        employment_type=payload.employment_type,
        resident_num=crypto.encrypt_data(payload.resident_num),
        profile_image_url=payload.profile_image_url
    )
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)

    emp_role = db.query(models.Role).filter(models.Role.name == payload.role_id).first()
    if not emp_role:
        emp_role = db.query(models.Role).filter(models.Role.name == "employee").first()
        
    if emp_role:
        db.add(models.EmployeeRole(employee_id=new_emp.id, role_id=emp_role.id))
        db.commit()

    return {"message": "사원이 성공적으로 등록되었습니다.", "id": new_emp.id}

@router.post("/bulk-delete")
def bulk_delete_employees(payload: EmployeeBulkDeleteRequest, db: Session = Depends(get_db)):
    emps = db.query(models.Employee).filter(models.Employee.id.in_(payload.employee_ids)).all()
    if not emps:
        raise HTTPException(status_code=404, detail="No employees found")
        
    for emp in emps:
        emp.deleted_at = datetime.now()
    
    db.commit()
    return {"message": f"{len(emps)}명의 사원이 삭제되었습니다."}

@router.put("/bulk-update")
def bulk_update_employees(payload: EmployeeBulkUpdateRequest, db: Session = Depends(get_db)):
    dept_map = {d.name: d.id for d in db.query(models.Department).all()}
    pos_map = {p.name: p.id for p in db.query(models.Position).all()}
    
    for emp_data in payload.employees:
        emp = db.query(models.Employee).filter(models.Employee.id == emp_data.id).first()
        if emp:
            if emp_data.name is not None: emp.name = emp_data.name
            if emp_data.email is not None: emp.email = emp_data.email
            
            if emp_data.department in dept_map: emp.department_id = dept_map[emp_data.department]
            elif emp_data.department == "": emp.department_id = None
            
            if emp_data.position in pos_map: emp.position_id = pos_map[emp_data.position]
            elif emp_data.position == "": emp.position_id = None
            
            if emp_data.phone is not None: emp.phone = emp_data.phone
            
            if emp_data.birth_date:
                try: emp.birth_date = datetime.strptime(emp_data.birth_date, "%Y-%m-%d").date()
                except: pass
            
            if emp_data.gender is not None: emp.gender = emp_data.gender
            if emp_data.address is not None: emp.address = emp_data.address
            if emp_data.employment_type is not None: emp.employment_type = emp_data.employment_type
            if emp_data.resident_num is not None: emp.resident_num = crypto.encrypt_data(emp_data.resident_num)
            if emp_data.status is not None: emp.status = emp_data.status
            
            if emp_data.hire_date:
                try: emp.hire_date = datetime.strptime(emp_data.hire_date, "%Y-%m-%d").date()
                except: pass
                
    db.commit()
    return {"message": f"{len(payload.employees)}명의 사원이 수정되었습니다."}
