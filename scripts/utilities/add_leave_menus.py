import sys
import os

# add backend dir to path to import models
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../backend'))

from database import SessionLocal
from models import Menu, Role, RoleMenu

def add_leave_menus():
    db = SessionLocal()
    try:
        # Check if parent menu "근태 관리" exists
        parent_menu = db.query(Menu).filter(Menu.name == "전체 근태 현황").first()
        if not parent_menu:
            parent_menu = db.query(Menu).filter(Menu.name == "근태 관리").first()
            
        parent_id = parent_menu.id if parent_menu else None
        
        # 1. 휴가 신청 (Leave Application)
        leave_menu = db.query(Menu).filter(Menu.name == "휴가 신청").first()
        if not leave_menu:
            leave_menu = Menu(name="휴가 신청", url="/erp/attendance/leave", icon="CalendarIcon", parent_id=parent_id, sort_order=30)
            db.add(leave_menu)
            db.commit()
            db.refresh(leave_menu)
            print("Added '휴가 신청' menu.")
            
            roles = db.query(Role).all()
            for r in roles:
                rm = RoleMenu(role_id=r.id, menu_id=leave_menu.id, can_read=True, can_write=True)
                db.add(rm)
            db.commit()
            print("Assigned '휴가 신청' to all roles.")

        # 2. 휴가 결재 관리 (Leave Approvals)
        approval_menu = db.query(Menu).filter(Menu.name == "휴가 결재 관리").first()
        if not approval_menu:
            approval_menu = Menu(name="휴가 결재 관리", url="/erp/attendance/approvals", icon="CalendarCheck", parent_id=parent_id, sort_order=40)
            db.add(approval_menu)
            db.commit()
            db.refresh(approval_menu)
            print("Added '휴가 결재 관리' menu.")
            
            manager_roles = db.query(Role).filter(Role.name.in_(["master", "hr_manager", "manager"])).all()
            for r in manager_roles:
                rm = RoleMenu(role_id=r.id, menu_id=approval_menu.id, can_read=True, can_write=True)
                db.add(rm)
            db.commit()
            print("Assigned '휴가 결재 관리' to manager roles.")
            
    finally:
        db.close()

if __name__ == "__main__":
    add_leave_menus()
