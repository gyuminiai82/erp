from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

import models
from database import get_db
from auth import get_current_user_info
from fastapi import Request

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
def update_settings(
    request: Request,
    payload: SystemSettingSchema, 
    db: Session = Depends(get_db),
    user_info: dict = Depends(get_current_user_info)
):
    setting = db.query(models.SystemSetting).first()
    if not setting:
        raise HTTPException(status_code=404, detail="설정을 찾을 수 없습니다.")

    # 감사 로그(Audit Log)를 위해 변경 전 데이터(old_settings) 백업
    old_settings = {
        "emp_no_prefix": setting.emp_no_prefix,
        "emp_no_year_format": setting.emp_no_year_format,
        "emp_no_length": setting.emp_no_length,
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

    # 감사 로그(Audit Log)를 위해 변경 후 데이터(new_settings) 백업
    new_settings = {
        "emp_no_prefix": payload.emp_no_prefix,
        "emp_no_year_format": payload.emp_no_year_format,
        "emp_no_length": payload.emp_no_length,
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

    # 설정 변경사항이 있다면 Audit Log 적재
    if old_settings != new_settings:
        import json
        audit = models.AuditLog(
            event_title="시스템 환경설정 변경",
            event_desc="사번 생성 규칙 또는 급여/보험 정책이 변경되었습니다.",
            user_name=user_info.get("name", "Unknown"),
            user_email=user_info.get("email", "Unknown"),
            ip_address=request.client.host if request.client else "Unknown",
            severity="WARNING",
            target_resource="system_settings",
            action_type="UPDATE",
            payload=json.dumps({"old": old_settings, "new": new_settings}, ensure_ascii=False)
        )
        db.add(audit)
        db.commit()

    return setting
