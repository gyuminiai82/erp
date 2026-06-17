from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import models
from database import get_db
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/mes", tags=["MES"])

class ItemBase(BaseModel):
    item_code: str
    item_name: str
    item_type: str
    unit: str
    standard: Optional[str] = None
    standard_cost: Optional[float] = 0.0
    safety_stock: Optional[float] = 0.0
    current_stock: Optional[float] = 0.0
    lead_time: Optional[int] = 0
    is_lot_tracked: Optional[bool] = False
    location: Optional[str] = None

class ItemCreate(ItemBase):
    pass

class ItemResponse(ItemBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/items", response_model=List[ItemResponse])
def get_items(db: Session = Depends(get_db)):
    items = db.query(models.Item).order_by(models.Item.id.desc()).all()
    return items

@router.post("/items", response_model=ItemResponse)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    db_item = db.query(models.Item).filter(models.Item.item_code == item.item_code).first()
    if db_item:
        raise HTTPException(status_code=400, detail="이미 존재하는 품목코드입니다.")
    new_item = models.Item(**item.model_dump())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.put("/items/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, item: ItemCreate, db: Session = Depends(get_db)):
    db_item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="품목을 찾을 수 없습니다.")
    for k, v in item.model_dump().items():
        setattr(db_item, k, v)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="품목을 찾을 수 없습니다.")
    db.delete(db_item)
    db.commit()
    return {"detail": "삭제되었습니다."}
