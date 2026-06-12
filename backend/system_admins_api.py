from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

import models
from database import get_db
from auth import get_password_hash

router = APIRouter(prefix="/api/admins", tags=["SystemAdmins"])

class SystemAdminBase(BaseModel):
    username: str
    email: str
    is_active: bool = True

class SystemAdminCreate(SystemAdminBase):
    password: str

class SystemAdminUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class SystemAdminResponse(SystemAdminBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None
    class Config:
        from_attributes = True

@router.get("", response_model=List[SystemAdminResponse])
def get_admins(db: Session = Depends(get_db)):
    return db.query(models.SystemAdmin).all()

@router.post("", response_model=SystemAdminResponse)
def create_admin(admin: SystemAdminCreate, db: Session = Depends(get_db)):
    existing = db.query(models.SystemAdmin).filter((models.SystemAdmin.username == admin.username) | (models.SystemAdmin.email == admin.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
        
    new_admin = models.SystemAdmin(
        username=admin.username,
        email=admin.email,
        password_hash=get_password_hash(admin.password),
        created_at=datetime.utcnow(),
        is_active=admin.is_active
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin

@router.put("/{admin_id}", response_model=SystemAdminResponse)
def update_admin(admin_id: int, admin: SystemAdminUpdate, db: Session = Depends(get_db)):
    existing = db.query(models.SystemAdmin).filter_by(id=admin_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Admin not found")
        
    if admin.username is not None and admin.username != existing.username:
        dup = db.query(models.SystemAdmin).filter_by(username=admin.username).first()
        if dup:
            raise HTTPException(status_code=400, detail="Username already exists")
        existing.username = admin.username
        
    if admin.email is not None and admin.email != existing.email:
        dup = db.query(models.SystemAdmin).filter_by(email=admin.email).first()
        if dup:
            raise HTTPException(status_code=400, detail="Email already exists")
        existing.email = admin.email
        
    if admin.password:
        existing.password_hash = get_password_hash(admin.password)
        
    if admin.is_active is not None:
        if not admin.is_active and existing.is_active:
            active_admins = db.query(models.SystemAdmin).filter_by(is_active=True).count()
            if active_admins <= 1:
                raise HTTPException(status_code=400, detail="Cannot disable the last active admin")
        existing.is_active = admin.is_active
        
    db.commit()
    db.refresh(existing)
    return existing

@router.delete("/{admin_id}")
def delete_admin(admin_id: int, db: Session = Depends(get_db)):
    admin = db.query(models.SystemAdmin).filter_by(id=admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    # Check if it's the last active admin
    active_admins = db.query(models.SystemAdmin).filter_by(is_active=True).count()
    if active_admins <= 1 and admin.is_active:
        raise HTTPException(status_code=400, detail="Cannot delete the last active admin")
        
    db.delete(admin)
    db.commit()
    return {"message": "Deleted successfully"}
