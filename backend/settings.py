from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

import models
from database import get_db

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class SystemSettingSchema(BaseModel):
    emp_no_prefix: str = "EMP"
    emp_no_year_format: str = "YY"
    emp_no_length: int = 3
    national_pension_rate: float = 0.0475
    health_insurance_rate: float = 0.03595
    long_term_care_rate: float = 0.1314
    employment_insurance_rate: float = 0.009
    overtime_multiplier: float = 1.5

    class Config:
        from_attributes = True

@router.get("", response_model=SystemSettingSchema)
def get_settings(db: Session = Depends(get_db)):
    setting = db.query(models.SystemSetting).first()
    if not setting:
        setting = models.SystemSetting(
            emp_no_prefix="EMP",
            emp_no_year_format="YY",
            emp_no_length=3,
            national_pension_rate=0.0475,
            health_insurance_rate=0.03595,
            long_term_care_rate=0.1314,
            employment_insurance_rate=0.009,
            overtime_multiplier=1.5
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

@router.put("", response_model=SystemSettingSchema)
def update_settings(update_data: SystemSettingSchema, db: Session = Depends(get_db)):
    setting = db.query(models.SystemSetting).first()
    if not setting:
        setting = models.SystemSetting()
        db.add(setting)
    
    setting.emp_no_prefix = update_data.emp_no_prefix
    setting.emp_no_year_format = update_data.emp_no_year_format
    setting.emp_no_length = update_data.emp_no_length
    setting.national_pension_rate = update_data.national_pension_rate
    setting.health_insurance_rate = update_data.health_insurance_rate
    setting.long_term_care_rate = update_data.long_term_care_rate
    setting.employment_insurance_rate = update_data.employment_insurance_rate
    setting.overtime_multiplier = update_data.overtime_multiplier
    
    db.commit()
    db.refresh(setting)
    return setting
