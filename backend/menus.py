from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

import models
from database import get_db

router = APIRouter(prefix="/api/menus", tags=["Menus"])

class MenuBase(BaseModel):
    name: str
    url: Optional[str] = None
    icon: Optional[str] = None
    parent_id: Optional[int] = None
    sort_order: int = 0

class MenuSortUpdate(BaseModel):
    id: int
    sort_order: int

class MenuBatchSortUpdate(BaseModel):
    menus: List[MenuSortUpdate]

class MenuResponse(MenuBase):
    id: int
    class Config:
        from_attributes = True

@router.get("", response_model=List[MenuResponse])
def get_menus(db: Session = Depends(get_db)):
    return db.query(models.Menu).order_by(models.Menu.sort_order).all()

@router.get("/my", response_model=List[MenuResponse])
def get_my_menus(role_name: str = "master", db: Session = Depends(get_db)):
    role = db.query(models.Role).filter(models.Role.name == role_name).first()
    if not role:
        return []
        
    role_menus = db.query(models.RoleMenu).filter(models.RoleMenu.role_id == role.id).all()
    menu_ids = [rm.menu_id for rm in role_menus]
    menus = db.query(models.Menu).filter(models.Menu.id.in_(menu_ids)).order_by(models.Menu.sort_order).all()
    return menus

@router.post("", response_model=MenuResponse)
def create_menu(menu: MenuBase, db: Session = Depends(get_db)):
    db_menu = models.Menu(**menu.model_dump())
    db.add(db_menu)
    db.commit()
    db.refresh(db_menu)
    return db_menu

@router.put("/batch-sort")
def batch_update_menu_sort(payload: MenuBatchSortUpdate, db: Session = Depends(get_db)):
    for item in payload.menus:
        db.query(models.Menu).filter(models.Menu.id == item.id).update({"sort_order": item.sort_order})
    db.commit()
    return {"message": "Sort orders updated successfully"}

@router.put("/{menu_id}", response_model=MenuResponse)
def update_menu(menu_id: int, menu: MenuBase, db: Session = Depends(get_db)):
    db_menu = db.query(models.Menu).filter(models.Menu.id == menu_id).first()
    if not db_menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    
    for key, value in menu.model_dump().items():
        setattr(db_menu, key, value)
        
    db.commit()
    db.refresh(db_menu)
    return db_menu

@router.delete("/{menu_id}")
def delete_menu(menu_id: int, db: Session = Depends(get_db)):
    db_menu = db.query(models.Menu).filter(models.Menu.id == menu_id).first()
    if not db_menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    
    children = db.query(models.Menu).filter(models.Menu.parent_id == menu_id).all()
    if children:
        raise HTTPException(status_code=400, detail="하위 메뉴가 존재하여 삭제할 수 없습니다.")
    
    # 권한 매핑도 함께 삭제
    db.query(models.RoleMenu).filter(models.RoleMenu.menu_id == menu_id).delete()
    db.delete(db_menu)
    db.commit()
    return {"message": "Deleted successfully"}
