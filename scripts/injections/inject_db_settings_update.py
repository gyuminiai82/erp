import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../backend'))
from sqlalchemy import text
from database import engine, SessionLocal
from models import SystemSetting

def upgrade_system_settings():
    db = SessionLocal()
    try:
        # 1. 컬럼 추가
        commands = [
            "ALTER TABLE system_settings ADD COLUMN national_pension_rate FLOAT DEFAULT 0.045;",
            "ALTER TABLE system_settings ADD COLUMN health_insurance_rate FLOAT DEFAULT 0.03545;",
            "ALTER TABLE system_settings ADD COLUMN long_term_care_rate FLOAT DEFAULT 0.1295;",
            "ALTER TABLE system_settings ADD COLUMN employment_insurance_rate FLOAT DEFAULT 0.009;",
            "ALTER TABLE system_settings ADD COLUMN overtime_multiplier FLOAT DEFAULT 1.5;"
        ]
        
        for cmd in commands:
            try:
                db.execute(text(cmd))
                print(f"Executed: {cmd}")
            except Exception as e:
                # 이미 존재하는 컬럼일 경우 무시 (PostgreSQL)
                print(f"Skipped (already exists or error): {e}")
        
        db.commit()
        
        # 2. 기초 데이터가 없다면 1개 생성
        setting = db.query(SystemSetting).first()
        if not setting:
            setting = SystemSetting()
            db.add(setting)
            db.commit()
            print("Created default SystemSetting row.")
        else:
            # 기존 레코드에 기본값 반영
            setting.national_pension_rate = 0.045
            setting.health_insurance_rate = 0.03545
            setting.long_term_care_rate = 0.1295
            setting.employment_insurance_rate = 0.009
            setting.overtime_multiplier = 1.5
            db.commit()
            print("Updated existing SystemSetting row with default values.")
            
    except Exception as e:
        print(f"Error during upgrade: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    upgrade_system_settings()
