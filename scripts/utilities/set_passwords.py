import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../backend'))

from database import SessionLocal
import models
from auth import get_password_hash

db = SessionLocal()

# 일반 사원 계정 셋업
employees = db.query(models.Employee).all()
for emp in employees:
    # 이메일이 없는 경우 사번@minstudio.com 으로 생성
    if not emp.email:
        emp.email = f"{emp.emp_no.lower()}@minstudio.com"
    # 비밀번호 초기화 (1234)
    emp.password_hash = get_password_hash("1234")

# 시스템 관리자 계정 셋업
admin = db.query(models.SystemAdmin).first()
if not admin:
    admin = models.SystemAdmin(
        username="admin", 
        email="admin@minstudio.com", 
        password_hash=get_password_hash("admin123")
    )
    db.add(admin)
else:
    admin.password_hash = get_password_hash("admin123")

db.commit()
db.close()

print("Passwords and emails updated successfully!")
