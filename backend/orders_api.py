from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel

from database import get_db
from models import Order, OrderItem, Client, Employee, Item
import auth

router = APIRouter(
    prefix="/api/orders",
    tags=["Orders"]
)

# Pydantic Schemas
class OrderItemBase(BaseModel):
    item_id: int
    quantity: int
    unit_price: int
    total_price: int

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: int
    order_id: int
    item_name: Optional[str] = None
    item_code: Optional[str] = None

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    order_no: str
    order_type: str
    client_id: int
    order_date: date
    delivery_date: Optional[date] = None
    status: Optional[str] = "대기"
    manager_id: int
    total_amount: int
    remarks: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    order_no: Optional[str] = None
    order_type: Optional[str] = None
    client_id: Optional[int] = None
    order_date: Optional[date] = None
    delivery_date: Optional[date] = None
    status: Optional[str] = None
    manager_id: Optional[int] = None
    total_amount: Optional[int] = None
    remarks: Optional[str] = None
    items: Optional[List[OrderItemCreate]] = None

class OrderResponse(OrderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    client_name: Optional[str] = None
    manager_name: Optional[str] = None
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True

class BulkDeleteRequest(BaseModel):
    order_ids: List[int]

# Endpoints
@router.get("", response_model=List[OrderResponse])
def get_orders(
    order_type: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user: dict = Depends(auth.get_current_user_info)
):
    query = db.query(Order)
    if order_type:
        query = query.filter(Order.order_type == order_type)
    
    if search:
        query = query.join(Client, Order.client_id == Client.id).filter(
            (Order.order_no.contains(search)) |
            (Client.client_name.contains(search))
        )
        
    orders = query.order_by(Order.id.desc()).offset(skip).limit(limit).all()
    
    result = []
    for o in orders:
        o_dict = {
            "id": o.id,
            "order_no": o.order_no,
            "order_type": o.order_type,
            "client_id": o.client_id,
            "order_date": o.order_date,
            "delivery_date": o.delivery_date,
            "status": o.status,
            "manager_id": o.manager_id,
            "total_amount": o.total_amount,
            "remarks": o.remarks,
            "created_at": o.created_at,
            "updated_at": o.updated_at,
            "client_name": o.client.client_name if o.client else None,
            "manager_name": o.manager.name if o.manager else None,
            "items": []
        }
        for item in o.items:
            o_dict["items"].append({
                "id": item.id,
                "order_id": item.order_id,
                "item_id": item.item_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total_price": item.total_price,
                "item_name": item.item.name if item.item else None,
                "item_code": item.item.item_code if item.item else None
            })
        result.append(o_dict)
        
    return result

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(auth.get_current_user_info)
):
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
        
    o_dict = {
        "id": o.id,
        "order_no": o.order_no,
        "order_type": o.order_type,
        "client_id": o.client_id,
        "order_date": o.order_date,
        "delivery_date": o.delivery_date,
        "status": o.status,
        "manager_id": o.manager_id,
        "total_amount": o.total_amount,
        "remarks": o.remarks,
        "created_at": o.created_at,
        "updated_at": o.updated_at,
        "client_name": o.client.client_name if o.client else None,
        "manager_name": o.manager.name if o.manager else None,
        "items": []
    }
    for item in o.items:
        o_dict["items"].append({
            "id": item.id,
            "order_id": item.order_id,
            "item_id": item.item_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "total_price": item.total_price,
            "item_name": item.item.name if item.item else None,
            "item_code": item.item.item_code if item.item else None
        })
    return o_dict

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(auth.get_current_user_info)
):
    exist = db.query(Order).filter(Order.order_no == payload.order_no).first()
    if exist:
        raise HTTPException(status_code=400, detail="이미 존재하는 주문번호입니다.")
        
    order_data = payload.model_dump(exclude={'items'})
    new_order = Order(**order_data)
    db.add(new_order)
    db.flush() # get new_order.id
    
    for item_data in payload.items:
        new_item = OrderItem(
            order_id=new_order.id,
            item_id=item_data.item_id,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            total_price=item_data.total_price
        )
        db.add(new_item)
        
    db.commit()
    db.refresh(new_order)
    
    # Return via get_order logic
    return get_order(new_order.id, db, user)

@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    payload: OrderUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(auth.get_current_user_info)
):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
        
    if payload.order_no and payload.order_no != db_order.order_no:
        exist = db.query(Order).filter(Order.order_no == payload.order_no).first()
        if exist:
            raise HTTPException(status_code=400, detail="이미 존재하는 주문번호입니다.")
            
    update_data = payload.model_dump(exclude_unset=True, exclude={'items'})
    for key, value in update_data.items():
        setattr(db_order, key, value)
        
    if payload.items is not None:
        # 기존 품목 삭제
        db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
        # 새 품목 추가
        for item_data in payload.items:
            new_item = OrderItem(
                order_id=db_order.id,
                item_id=item_data.item_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total_price=item_data.total_price
            )
            db.add(new_item)
            
    db_order.updated_at = datetime.utcnow()
    db.commit()
    
    return get_order(order_id, db, user)

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(auth.get_current_user_info)
):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
        
    db.delete(db_order)
    db.commit()
    return None

@router.post("/bulk-delete")
def bulk_delete_orders(
    payload: BulkDeleteRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(auth.get_current_user_info)
):
    db.query(Order).filter(Order.id.in_(payload.order_ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"{len(payload.order_ids)} orders deleted."}
