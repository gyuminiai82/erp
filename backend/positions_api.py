from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

import models
from database import get_db
from auth import get_current_employee
import json

router = APIRouter(prefix="/api/positions", tags=["Positions"])

class PositionBase(BaseModel):
    name: str
    level: int = 10
    description: Optional[str] = None

class ReorderRequestItem(BaseModel):
    id: int
    sort_order: int

class ReorderRequest(BaseModel):
    items: List[ReorderRequestItem]

class PositionCreate(PositionBase):
    pass

class PositionSchema(PositionBase):
    id: int

    class Config:
        from_attributes = True

@router.get("", response_model=List[PositionSchema])
def get_positions(db: Session = Depends(get_db)):
    return db.query(models.Position).order_by(models.Position.sort_order.asc(), models.Position.level.asc()).all()

@router.put("/reorder")
def reorder_positions(data: ReorderRequest, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    for item in data.items:
        db.query(models.Position).filter(models.Position.id == item.id).update({"sort_order": item.sort_order})
    db.commit()
    
    try:
        audit = models.AuditLog(event_title="직급 정렬 순서 변경", event_desc="직급 목록의 정렬 순서를 변경했습니다.", user_name=current_user.name, user_email=current_user.email, payload=json.dumps({"count": len(data.items)}))
        db.add(audit); db.commit()
    except Exception as e: db.rollback()
    
    return {"message": "정렬 순서가 업데이트되었습니다."}

@router.post("", response_model=PositionSchema)
def create_position(data: PositionCreate, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    db_pos = db.query(models.Position).filter(models.Position.name == data.name).first()
    if db_pos:
        raise HTTPException(status_code=400, detail="이미 존재하는 직급명입니다.")
        
    new_pos = models.Position(name=data.name, level=data.level, description=data.description)
    db.add(new_pos)
    db.commit()
    db.refresh(new_pos)
    
    try:
        audit = models.AuditLog(event_title="직급 추가", event_desc=f"새 직급 '{data.name}'을(를) 추가했습니다.", user_name=current_user.name, user_email=current_user.email, payload=json.dumps({"name": data.name}))
        db.add(audit); db.commit()
    except Exception as e: db.rollback()
    
    return new_pos

@router.put("/{pos_id}", response_model=PositionSchema)
def update_position(pos_id: int, data: PositionCreate, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    db_pos = db.query(models.Position).filter(models.Position.id == pos_id).first()
    if not db_pos:
        raise HTTPException(status_code=404, detail="직급을 찾을 수 없습니다.")
        
    db_pos.name = data.name
    db_pos.level = data.level
    db_pos.description = data.description
    db.commit()
    db.refresh(db_pos)
    
    try:
        audit = models.AuditLog(event_title="직급 수정", event_desc=f"직급 '{data.name}' 정보를 수정했습니다.", user_name=current_user.name, user_email=current_user.email, payload=json.dumps({"id": pos_id, "name": data.name}))
        db.add(audit); db.commit()
    except Exception as e: db.rollback()
    
    return db_pos

@router.delete("/{pos_id}")
def delete_position(pos_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    db_pos = db.query(models.Position).filter(models.Position.id == pos_id).first()
    if not db_pos:
        raise HTTPException(status_code=404, detail="직급을 찾을 수 없습니다.")
    
    # 해당 직급을 가진 사원이 있는지 확인
    has_employees = db.query(models.Employee).filter(models.Employee.position_id == pos_id).count() > 0
    if has_employees:
        raise HTTPException(status_code=400, detail="해당 직급을 가진 사원이 있어 삭제할 수 없습니다.")
        
    db.delete(db_pos)
    db.commit()
    
    try:
        audit = models.AuditLog(event_title="직급 삭제", event_desc=f"직급 ID {pos_id}을(를) 삭제했습니다.", user_name=current_user.name, user_email=current_user.email, payload=json.dumps({"id": pos_id}))
        db.add(audit); db.commit()
    except Exception as e: db.rollback()
    
    return {"detail": "삭제되었습니다."}
