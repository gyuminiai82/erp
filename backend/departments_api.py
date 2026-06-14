from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

import models
from database import get_db

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
def reorder_departments(data: ReorderRequest, db: Session = Depends(get_db)):
    # Update sort orders in bulk
    for item in data.items:
        db.query(models.Department).filter(models.Department.id == item.id).update({"sort_order": item.sort_order})
    db.commit()
    return {"message": "정렬 순서가 업데이트되었습니다."}

@router.post("", response_model=DepartmentSchema)
def create_department(data: DepartmentCreate, db: Session = Depends(get_db)):
    db_dept = models.Department(name=data.name, manager_id=data.manager_id)
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.put("/{dept_id}", response_model=DepartmentSchema)
def update_department(dept_id: int, data: DepartmentCreate, db: Session = Depends(get_db)):
    db_dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="부서를 찾을 수 없습니다.")
    db_dept.name = data.name
    db_dept.manager_id = data.manager_id
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.delete("/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    db_dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="부서를 찾을 수 없습니다.")
    
    # 사원이 있는지 확인
    has_employees = db.query(models.Employee).filter(models.Employee.department_id == dept_id).count() > 0
    if has_employees:
        raise HTTPException(status_code=400, detail="소속된 사원이 있는 부서는 삭제할 수 없습니다.")
        
    db.delete(db_dept)
    db.commit()
    return {"detail": "삭제되었습니다."}
