import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

import sqlalchemy
from sqlalchemy.orm import sessionmaker
from models import Menu, Role, RoleMenu

engine = sqlalchemy.create_engine(os.getenv("DATABASE_URL", "postgresql://postgres:postgresql@localhost/erp"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def inject_menus():
    db = SessionLocal()
    try:
        # Clear existing menus
        db.query(RoleMenu).delete()
        db.query(Menu).delete()
        db.commit()

        menus_data = [
            {
                "name": "인사/조직 관리",
                "icon": "Users",
                "submenus": [
                    {"name": "사원 관리", "url": "/erp/employees", "roles": ["master", "hr_manager"]},
                    {"name": "부서/직급 관리", "url": "/erp/departments", "roles": ["master", "hr_manager"]},
                    {"name": "인사 발령", "url": "/erp/appointments", "roles": ["master", "hr_manager"]}
                ]
            },
            {
                "name": "근태/급여 관리",
                "icon": "Clock",
                "submenus": [
                    {"name": "전체 근태 현황", "url": "/erp/attendance/all", "roles": ["master", "hr_manager"]},
                    {"name": "내 근태 현황", "url": "/erp/attendance/my", "roles": ["master", "hr_manager", "dept_head", "employee"]},
                    {"name": "휴가 결재(관리자)", "url": "/erp/leaves/approvals", "roles": ["master", "hr_manager", "dept_head"]},
                    {"name": "휴가 신청(개인)", "url": "/erp/leaves/my", "roles": ["master", "hr_manager", "dept_head", "employee"]},
                    {"name": "급여 대장", "url": "/erp/payroll", "roles": ["master", "hr_manager"]},
                    {"name": "내 급여 명세서", "url": "/erp/payslips", "roles": ["master", "hr_manager", "dept_head", "employee"]}
                ]
            },
            {
                "name": "회계/재무 관리",
                "icon": "Calculator",
                "submenus": [
                    {"name": "전표 관리", "url": "/erp/vouchers", "roles": ["master"]},
                    {"name": "계정과목", "url": "/erp/accounts", "roles": ["master"]},
                    {"name": "자금 현황", "url": "/erp/funds", "roles": ["master"]},
                    {"name": "재무제표", "url": "/erp/statements", "roles": ["master"]}
                ]
            },
            {
                "name": "영업/물류 관리",
                "icon": "Truck",
                "submenus": [
                    {"name": "거래처 관리", "url": "/erp/clients", "roles": ["master"]},
                    {"name": "수주/발주 등록", "url": "/erp/orders", "roles": ["master"]},
                    {"name": "재고 현황", "url": "/erp/inventory", "roles": ["master"]}
                ]
            },
            {
                "name": "전자결재",
                "icon": "FileSignature",
                "submenus": [
                    {"name": "기안 작성", "url": "/erp/drafts", "roles": ["master", "hr_manager", "dept_head", "employee"]},
                    {"name": "결재함", "url": "/erp/approvals", "roles": ["master", "hr_manager", "dept_head"]}
                ]
            },
            {
                "name": "시스템 관리",
                "icon": "Settings",
                "submenus": [
                    {"name": "공통 코드 관리", "url": "/erp/system/common-codes", "roles": ["master"]}
                ]
            }
        ]

        all_roles = db.query(Role).all()
        role_map = {r.name: r for r in all_roles}

        sort_order = 10
        for parent_data in menus_data:
            parent_roles = set()
            for sub_data in parent_data["submenus"]:
                for r_name in sub_data["roles"]:
                    parent_roles.add(r_name)

            parent_menu = Menu(name=parent_data["name"], icon=parent_data["icon"], sort_order=sort_order)
            db.add(parent_menu)
            db.commit()
            db.refresh(parent_menu)
            sort_order += 10
            
            for r_name in parent_roles:
                if r_name in role_map:
                    db.add(RoleMenu(role_id=role_map[r_name].id, menu_id=parent_menu.id))

            sub_sort_order = 10
            for sub_data in parent_data["submenus"]:
                sub_menu = Menu(
                    name=sub_data["name"], 
                    url=sub_data["url"], 
                    parent_id=parent_menu.id,
                    sort_order=sub_sort_order
                )
                db.add(sub_menu)
                db.commit()
                db.refresh(sub_menu)
                sub_sort_order += 10
                
                for r_name in sub_data["roles"]:
                    if r_name in role_map:
                        db.add(RoleMenu(role_id=role_map[r_name].id, menu_id=sub_menu.id))
                    
        db.commit()
        print("Role-based ERP menus injected successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    inject_menus()
