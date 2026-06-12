import sys
from datetime import datetime
from sqlalchemy.orm import Session

# backend 디렉토리 구조 로드
import models
from database import SessionLocal, engine
import auth

def init_db():
    models.Base.metadata.create_all(bind=engine)

def create_super_admin(email: str, password: str, username: str = "Administrator"):
    db = SessionLocal()
    try:
        # 이미 존재하는지 확인
        existing_admin = db.query(models.SystemAdmin).filter(models.SystemAdmin.email == email).first()
        if existing_admin:
            print(f"이미 존재하는 계정입니다: {email}")
            return

        hashed_password = auth.get_password_hash(password)
        admin = models.SystemAdmin(
            username=username,
            email=email,
            password_hash=hashed_password,
            created_at=datetime.utcnow()
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"관리자 계정이 성공적으로 생성되었습니다: {email}")
    except Exception as e:
        print(f"오류 발생: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    create_super_admin("admin@minstudio.com", "admin123!")
