from fastapi import APIRouter, Depends, HTTPException
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
    holiday_multiplier: float = 1.5
    holiday_overtime_multiplier: float = 2.0

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
            overtime_multiplier=1.5,
            holiday_multiplier=1.5,
            holiday_overtime_multiplier=2.0
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

@router.put("", response_model=SystemSettingSchema)
def update_settings(payload: SystemSettingSchema, db: Session = Depends(get_db)):
    setting = db.query(models.SystemSetting).first()
    if not setting:
        raise HTTPException(status_code=404, detail="설정을 찾을 수 없습니다.")

    # 감사 로그(Audit Log)를 위해 변경 전 데이터(old_rates) 백업
    old_rates = {
        "national_pension_rate": setting.national_pension_rate,
        "health_insurance_rate": setting.health_insurance_rate,
        "long_term_care_rate": setting.long_term_care_rate,
        "employment_insurance_rate": setting.employment_insurance_rate,
        "overtime_multiplier": setting.overtime_multiplier,
        "holiday_multiplier": setting.holiday_multiplier,
        "holiday_overtime_multiplier": setting.holiday_overtime_multiplier
    }

    # 값 갱신
    setting.emp_no_prefix = payload.emp_no_prefix
    setting.emp_no_year_format = payload.emp_no_year_format
    setting.emp_no_length = payload.emp_no_length
    setting.national_pension_rate = payload.national_pension_rate
    setting.health_insurance_rate = payload.health_insurance_rate
    setting.long_term_care_rate = payload.long_term_care_rate
    setting.employment_insurance_rate = payload.employment_insurance_rate
    setting.overtime_multiplier = payload.overtime_multiplier
    setting.holiday_multiplier = payload.holiday_multiplier
    setting.holiday_overtime_multiplier = payload.holiday_overtime_multiplier

    # 감사 로그(Audit Log)를 위해 변경 후 데이터(new_rates) 백업
    new_rates = {
        "national_pension_rate": payload.national_pension_rate,
        "health_insurance_rate": payload.health_insurance_rate,
        "long_term_care_rate": payload.long_term_care_rate,
        "employment_insurance_rate": payload.employment_insurance_rate,
        "overtime_multiplier": payload.overtime_multiplier,
        "holiday_multiplier": payload.holiday_multiplier,
        "holiday_overtime_multiplier": payload.holiday_overtime_multiplier
    }

    db.commit()
    db.refresh(setting)

    # 요율 변경사항이 있다면 Audit Log 적재
    if old_rates != new_rates:
        import json
        audit = models.AuditLog(
            event_title="시스템 및 급여 정책 변경",
            event_desc="4대 보험 요율 또는 수당 배수가 변경되었습니다.",
            user_name="SysAdmin",
            user_email="admin@minstudio.com",
            ip_address="127.0.0.1",
            severity="WARNING",
            target_resource="system_settings",
            action_type="UPDATE",
            payload=json.dumps({"old": old_rates, "new": new_rates}, ensure_ascii=False)
        )
        db.add(audit)
        db.commit()

    return setting
