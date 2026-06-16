from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

import models
from database import get_db
from auth import get_current_employee
import json

router = APIRouter(prefix="/api/departments", tags=["Departments"])

class DepartmentBase(BaseModel):
    name: str
    manager_id: Optional[int] = None

class ReorderRequestItem(BaseModel):
    id: int
    sort_order: int

class ReorderRequest(BaseModel):
    items: List[ReorderRequestItem]

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentSchema(DepartmentBase):
    id: int

    class Config:
        from_attributes = True

@router.get("", response_model=List[DepartmentSchema])
def get_departments(db: Session = Depends(get_db)):
    return db.query(models.Department).order_by(models.Department.sort_order.asc(), models.Department.id.asc()).all()

@router.put("/reorder")
def reorder_departments(data: ReorderRequest, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    # Update sort orders in bulk
    for item in data.items:
        db.query(models.Department).filter(models.Department.id == item.id).update({"sort_order": item.sort_order})
    db.commit()
    
    try:
        audit = models.AuditLog(event_title="부서 정렬 순서 변경", event_desc="부서 목록의 정렬 순서를 변경했습니다.", user_name=current_user.name, user_email=current_user.email, payload=json.dumps({"count": len(data.items)}))
        db.add(audit); db.commit()
    except Exception as e: db.rollback()
        
    return {"message": "정렬 순서가 업데이트되었습니다."}

@router.post("", response_model=DepartmentSchema)
def create_department(data: DepartmentCreate, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    db_dept = models.Department(name=data.name, manager_id=data.manager_id)
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    
    try:
        audit = models.AuditLog(event_title="부서 추가", event_desc=f"새 부서 '{data.name}'을(를) 추가했습니다.", user_name=current_user.name, user_email=current_user.email, payload=json.dumps({"name": data.name}))
        db.add(audit); db.commit()
    except Exception as e: db.rollback()
    
    return db_dept

@router.put("/{dept_id}", response_model=DepartmentSchema)
def update_department(dept_id: int, data: DepartmentCreate, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    db_dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="부서를 찾을 수 없습니다.")
    db_dept.name = data.name
    db_dept.manager_id = data.manager_id
    db.commit()
    db.refresh(db_dept)
    
    try:
        audit = models.AuditLog(event_title="부서 수정", event_desc=f"부서 '{data.name}' 정보를 수정했습니다.", user_name=current_user.name, user_email=current_user.email, payload=json.dumps({"id": dept_id, "name": data.name}))
        db.add(audit); db.commit()
    except Exception as e: db.rollback()
    
    return db_dept

@router.delete("/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    db_dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="부서를 찾을 수 없습니다.")
    
    # 사원이 있는지 확인
    has_employees = db.query(models.Employee).filter(models.Employee.department_id == dept_id).count() > 0
    if has_employees:
        raise HTTPException(status_code=400, detail="소속된 사원이 있는 부서는 삭제할 수 없습니다.")
        
    db.delete(db_dept)
    db.commit()
    
    try:
        audit = models.AuditLog(event_title="부서 삭제", event_desc=f"부서 ID {dept_id}을(를) 삭제했습니다.", user_name=current_user.name, user_email=current_user.email, payload=json.dumps({"id": dept_id}))
        db.add(audit); db.commit()
    except Exception as e: db.rollback()
    
    return {"detail": "삭제되었습니다."}
