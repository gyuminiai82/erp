from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

import models
from database import get_db

router = APIRouter(prefix="/api/positions", tags=["Positions"])

class PositionBase(BaseModel):
    name: str
    level: int = 10
    description: Optional[str] = None

class PositionCreate(PositionBase):
    pass

class PositionSchema(PositionBase):
    id: int

    class Config:
        from_attributes = True

@router.get("", response_model=List[PositionSchema])
def get_positions(db: Session = Depends(get_db)):
    return db.query(models.Position).order_by(models.Position.level.asc()).all()

@router.post("", response_model=PositionSchema)
def create_position(data: PositionCreate, db: Session = Depends(get_db)):
    db_pos = db.query(models.Position).filter(models.Position.name == data.name).first()
    if db_pos:
        raise HTTPException(status_code=400, detail="이미 존재하는 직급명입니다.")
        
    new_pos = models.Position(name=data.name, level=data.level, description=data.description)
    db.add(new_pos)
    db.commit()
    db.refresh(new_pos)
    return new_pos

@router.put("/{pos_id}", response_model=PositionSchema)
def update_position(pos_id: int, data: PositionCreate, db: Session = Depends(get_db)):
    db_pos = db.query(models.Position).filter(models.Position.id == pos_id).first()
    if not db_pos:
        raise HTTPException(status_code=404, detail="직급을 찾을 수 없습니다.")
        
    db_pos.name = data.name
    db_pos.level = data.level
    db_pos.description = data.description
    db.commit()
    db.refresh(db_pos)
    return db_pos

@router.delete("/{pos_id}")
def delete_position(pos_id: int, db: Session = Depends(get_db)):
    db_pos = db.query(models.Position).filter(models.Position.id == pos_id).first()
    if not db_pos:
        raise HTTPException(status_code=404, detail="직급을 찾을 수 없습니다.")
    
    # 해당 직급을 가진 사원이 있는지 확인
    has_employees = db.query(models.Employee).filter(models.Employee.position_id == pos_id).count() > 0
    if has_employees:
        raise HTTPException(status_code=400, detail="해당 직급을 가진 사원이 있어 삭제할 수 없습니다.")
        
    db.delete(db_pos)
    db.commit()
    return {"detail": "삭제되었습니다."}
