import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from database import SessionLocal
from models import Menu, RoleMenu

def remove_system_menu():
    db = SessionLocal()
    try:
        sys_menu = db.query(Menu).filter(Menu.name == "시스템 관리").first()
        if sys_menu:
            # Delete child menus
            child_menus = db.query(Menu).filter(Menu.parent_id == sys_menu.id).all()
            for child in child_menus:
                db.query(RoleMenu).filter(RoleMenu.menu_id == child.id).delete()
                db.delete(child)
            
            db.query(RoleMenu).filter(RoleMenu.menu_id == sys_menu.id).delete()
            db.delete(sys_menu)
            db.commit()
            print("System Management menu deleted successfully.")
        else:
            print("System Management menu not found.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    remove_system_menu()
