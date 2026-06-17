from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from database import get_db
from models import Client
import auth

router = APIRouter(
    prefix="/api/clients",
    tags=["Clients"]
)

# Pydantic Schemas
class ClientBase(BaseModel):
    client_code: str
    client_name: str
    client_type: Optional[str] = "고객사"
    registration_number: Optional[str] = None
    representative: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = True

class ClientCreate(ClientBase):
    pass

class ClientUpdate(ClientBase):
    client_code: Optional[str] = None
    client_name: Optional[str] = None

class ClientResponse(ClientBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Endpoints
@router.get("", response_model=List[ClientResponse])
def get_clients(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user: dict = Depends(auth.get_current_user_info)
):
    query = db.query(Client)
    if search:
        query = query.filter(Client.client_name.contains(search) | Client.client_code.contains(search))
    return query.order_by(Client.id.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    client: ClientCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(auth.get_current_user_info)
):
    db_client = db.query(Client).filter(Client.client_code == client.client_code).first()
    if db_client:
        raise HTTPException(status_code=400, detail="이미 존재하는 거래처 코드입니다.")
        
    new_client = Client(**client.model_dump())
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client

@router.put("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: int,
    client: ClientUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(auth.get_current_user_info)
):
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="거래처를 찾을 수 없습니다.")
        
    if client.client_code and client.client_code != db_client.client_code:
        exist = db.query(Client).filter(Client.client_code == client.client_code).first()
        if exist:
            raise HTTPException(status_code=400, detail="이미 존재하는 거래처 코드입니다.")
            
    update_data = client.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_client, key, value)
        
    db_client.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_client)
    return db_client

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(auth.get_current_user_info)
):
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="거래처를 찾을 수 없습니다.")
        
    db.delete(db_client)
    db.commit()
    return None
