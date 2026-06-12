import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

import sqlalchemy
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from models import Menu, Role, RoleMenu

engine = sqlalchemy.create_engine("postgresql://postgres:postgresql@localhost/erp")
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
                    {"name": "사원 관리", "url": "/employees"},
                    {"name": "부서 관리", "url": "/departments"},
                    {"name": "인사 발령", "url": "/appointments"}
                ]
            },
            {
                "name": "근태/급여 관리",
                "icon": "Clock",
                "submenus": [
                    {"name": "근태 현황", "url": "/attendance"},
                    {"name": "휴가 결재", "url": "/leaves"},
                    {"name": "급여 대장", "url": "/payroll"},
                    {"name": "개인 급여 명세", "url": "/payslips"}
                ]
            },
            {
                "name": "회계/재무 관리",
                "icon": "Calculator",
                "submenus": [
                    {"name": "전표 관리", "url": "/vouchers"},
                    {"name": "계정과목", "url": "/accounts"},
                    {"name": "자금 현황", "url": "/funds"},
                    {"name": "재무제표", "url": "/statements"}
                ]
            },
            {
                "name": "영업/물류 관리",
                "icon": "Truck",
                "submenus": [
                    {"name": "거래처 관리", "url": "/clients"},
                    {"name": "수주/발주 등록", "url": "/orders"},
                    {"name": "재고 현황", "url": "/inventory"}
                ]
            },
            {
                "name": "전자결재",
                "icon": "FileSignature",
                "submenus": [
                    {"name": "기안 작성", "url": "/drafts"},
                    {"name": "결재함", "url": "/approvals"}
                ]
            },
            {
                "name": "시스템 설정",
                "icon": "Settings",
                "submenus": [
                    {"name": "기본 환경설정", "url": "/settings/basic"},
                    {"name": "사용자 및 권한", "url": "/settings/users"},
                    {"name": "시스템 로그", "url": "/settings/logs"}
                ]
            }
        ]

        admin_role = db.query(Role).filter(Role.name == "admin").first()

        sort_order = 10
        for parent_data in menus_data:
            parent_menu = Menu(name=parent_data["name"], icon=parent_data["icon"], sort_order=sort_order)
            db.add(parent_menu)
            db.commit()
            db.refresh(parent_menu)
            sort_order += 10
            
            if admin_role:
                db.add(RoleMenu(role_id=admin_role.id, menu_id=parent_menu.id))

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
                
                if admin_role:
                    db.add(RoleMenu(role_id=admin_role.id, menu_id=sub_menu.id))
                    
        db.commit()
        print("Standard ERP menus injected successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    inject_menus()
