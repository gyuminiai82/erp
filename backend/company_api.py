from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

import models
from database import get_db
from auth import get_current_user_info
from fastapi import Request

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
def update_company_info(
    request: Request,
    data: CompanyInfoSchema, 
    db: Session = Depends(get_db),
    user_info: dict = Depends(get_current_user_info)
):
    info = db.query(models.CompanyInfo).first()
    if not info:
        info = models.CompanyInfo()
        db.add(info)
        
    old_info = {
        "name": info.name,
        "registration_number": info.registration_number,
        "representative": info.representative,
        "address": info.address,
        "contact_email": info.contact_email,
        "contact_phone": info.contact_phone,
        "logo_url": info.logo_url
    }
        
    info.name = data.name
    info.registration_number = data.registration_number
    info.representative = data.representative
    info.address = data.address
    info.contact_email = data.contact_email
    info.contact_phone = data.contact_phone
    info.logo_url = data.logo_url
    
    new_info = {
        "name": data.name,
        "registration_number": data.registration_number,
        "representative": data.representative,
        "address": data.address,
        "contact_email": data.contact_email,
        "contact_phone": data.contact_phone,
        "logo_url": data.logo_url
    }
    
    db.commit()
    db.refresh(info)
    
    if old_info != new_info:
        import json
        audit = models.AuditLog(
            event_title="회사 정보 변경",
            event_desc="대표자명 등 회사 기본 정보가 변경되었습니다.",
            user_name=user_info.get("name", "Unknown"),
            user_email=user_info.get("email", "Unknown"),
            ip_address=request.client.host if request.client else "Unknown",
            severity="INFO",
            target_resource="CompanyInfo",
            action_type="UPDATE",
            payload=json.dumps({"old": old_info, "new": new_info}, ensure_ascii=False)
        )
        db.add(audit)
        db.commit()
        
    return info
