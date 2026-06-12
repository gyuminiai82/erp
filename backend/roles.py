from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

import models
from database import get_db

router = APIRouter(prefix="/api/roles", tags=["Roles"])

class RoleResponse(BaseModel):
    id: int
    name: str
    description: str

    class Config:
        from_attributes = True

class RoleMenuPermUpdate(BaseModel):
    menu_id: int
    can_read: bool = True
    can_write: bool = False
    can_delete: bool = False
    can_print: bool = False

class RoleMenuUpdate(BaseModel):
    menus: List[RoleMenuPermUpdate]

@router.get("", response_model=List[RoleResponse])
def get_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).all()

@router.get("/{role_id}/menus")
def get_role_menus(role_id: int, db: Session = Depends(get_db)):
    role_menus = db.query(models.RoleMenu).filter(models.RoleMenu.role_id == role_id).all()
    return [{
        "menu_id": rm.menu_id,
        "can_read": rm.can_read,
        "can_write": rm.can_write,
        "can_delete": rm.can_delete,
        "can_print": rm.can_print
    } for rm in role_menus]

@router.put("/{role_id}/menus")
def update_role_menus(role_id: int, payload: RoleMenuUpdate, db: Session = Depends(get_db)):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    db.query(models.RoleMenu).filter(models.RoleMenu.role_id == role_id).delete()
    
    added_menu_ids = {m.menu_id for m in payload.menus}
    parent_ids = set()
    
    for m in payload.menus:
        db.add(models.RoleMenu(
            role_id=role_id, 
            menu_id=m.menu_id,
            can_read=m.can_read,
            can_write=m.can_write,
            can_delete=m.can_delete,
            can_print=m.can_print
        ))
        
        db_menu = db.query(models.Menu).filter(models.Menu.id == m.menu_id).first()
        if db_menu and db_menu.parent_id and db_menu.parent_id not in added_menu_ids:
            parent_ids.add(db_menu.parent_id)
            
    for pid in parent_ids:
        db.add(models.RoleMenu(
            role_id=role_id, 
            menu_id=pid,
            can_read=True,
            can_write=False,
            can_delete=False,
            can_print=False
        ))
        added_menu_ids.add(pid)
        
    db.commit()
    return {"message": "Role menus updated successfully"}
