import sys
import os

# Ensure backend modules can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal
import models

def add_attendance_menu():
    db = SessionLocal()
    try:
        # Check if the menu already exists
        existing_menu = db.query(models.Menu).filter(models.Menu.name == "전체 근태 현황").first()
        if existing_menu:
            print("전체 근태 현황 메뉴가 이미 존재합니다.")
            menu = existing_menu
        else:
            menu = models.Menu(
                name="전체 근태 현황",
                url="/erp/attendance",
                icon="CalendarClock",
                parent_id=None,
                sort_order=30
            )
            db.add(menu)
            db.commit()
            db.refresh(menu)
            print("전체 근태 현황 메뉴가 추가되었습니다.")

        # Add to roles (master, admin)
        roles = db.query(models.Role).filter(models.Role.name.in_(["master", "admin"])).all()
        for role in roles:
            existing_rm = db.query(models.RoleMenu).filter(
                models.RoleMenu.role_id == role.id,
                models.RoleMenu.menu_id == menu.id
            ).first()
            if not existing_rm:
                rm = models.RoleMenu(
                    role_id=role.id,
                    menu_id=menu.id,
                    can_read=True,
                    can_write=True,
                    can_delete=False,
                    can_print=True
                )
                db.add(rm)
                db.commit()
                print(f"메뉴 권한이 {role.name} 에 추가되었습니다.")

    except Exception as e:
        print(f"오류 발생: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_attendance_menu()
