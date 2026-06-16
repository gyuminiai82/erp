from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date
import models
from database import get_db
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/mes/work-orders", tags=["Work Orders"])

class WorkOrderBase(BaseModel):
    order_no: str
    item_id: int
    planned_quantity: float
    produced_quantity: float = 0.0
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "PENDING"
    manager_id: Optional[int] = None

class WorkOrderCreate(WorkOrderBase):
    pass

class ItemInfo(BaseModel):
    id: int
    item_code: str
    item_name: str
    item_type: str
    unit: str
    class Config:
        from_attributes = True

class ManagerInfo(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class WorkOrderResponse(WorkOrderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    item: Optional[ItemInfo] = None
    manager: Optional[ManagerInfo] = None
    
    class Config:
        from_attributes = True

@router.get("", response_model=List[WorkOrderResponse])
def get_work_orders(db: Session = Depends(get_db)):
    orders = db.query(models.WorkOrder).order_by(models.WorkOrder.id.desc()).all()
    return orders

@router.post("", response_model=WorkOrderResponse)
def create_work_order(order: WorkOrderCreate, db: Session = Depends(get_db)):
    db_order = db.query(models.WorkOrder).filter(models.WorkOrder.order_no == order.order_no).first()
    if db_order:
        raise HTTPException(status_code=400, detail="이미 존재하는 지시번호입니다.")
    new_order = models.WorkOrder(**order.model_dump())
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

@router.put("/{order_id}", response_model=WorkOrderResponse)
def update_work_order(order_id: int, order: WorkOrderCreate, db: Session = Depends(get_db)):
    db_order = db.query(models.WorkOrder).filter(models.WorkOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="작업 지시서를 찾을 수 없습니다.")
    for k, v in order.model_dump().items():
        setattr(db_order, k, v)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.put("/{order_id}/status", response_model=WorkOrderResponse)
def update_work_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    db_order = db.query(models.WorkOrder).filter(models.WorkOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="작업 지시서를 찾을 수 없습니다.")
    db_order.status = status
    db.commit()
    db.refresh(db_order)
    return db_order

@router.delete("/{order_id}")
def delete_work_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(models.WorkOrder).filter(models.WorkOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="작업 지시서를 찾을 수 없습니다.")
    db.delete(db_order)
    db.commit()
    return {"detail": "삭제되었습니다."}
