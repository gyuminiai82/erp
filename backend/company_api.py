from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

import models
from database import get_db

router = APIRouter(prefix="/api/company", tags=["CompanyInfo"])

class CompanyInfoSchema(BaseModel):
    name: str = "Minstudio"
    registration_number: Optional[str] = None
    representative: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    logo_url: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("", response_model=CompanyInfoSchema)
def get_company_info(db: Session = Depends(get_db)):
    info = db.query(models.CompanyInfo).first()
    if not info:
        info = models.CompanyInfo(name="Minstudio")
        db.add(info)
        db.commit()
        db.refresh(info)
    return info

@router.put("", response_model=CompanyInfoSchema)
def update_company_info(data: CompanyInfoSchema, db: Session = Depends(get_db)):
    info = db.query(models.CompanyInfo).first()
    if not info:
        info = models.CompanyInfo()
        db.add(info)
        
    info.name = data.name
    info.registration_number = data.registration_number
    info.representative = data.representative
    info.address = data.address
    info.contact_email = data.contact_email
    info.contact_phone = data.contact_phone
    info.logo_url = data.logo_url
    
    db.commit()
    db.refresh(info)
    return info
