import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

import sqlalchemy
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from models import Menu, RoleMenu

engine = sqlalchemy.create_engine("postgresql://postgres:postgresql@localhost/erp")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def remove_system_settings_menu():
    db = SessionLocal()
    try:
        # Find '시스템 설정' menu
        sys_menu = db.query(Menu).filter(Menu.name == "시스템 설정").first()
        if sys_menu:
            # Find submenus
            sub_menus = db.query(Menu).filter(Menu.parent_id == sys_menu.id).all()
            sub_menu_ids = [m.id for m in sub_menus]
            
            # Delete RoleMenu mappings for submenus and parent
            all_ids_to_delete = sub_menu_ids + [sys_menu.id]
            db.query(RoleMenu).filter(RoleMenu.menu_id.in_(all_ids_to_delete)).delete(synchronize_session=False)
            
            # Delete submenus
            db.query(Menu).filter(Menu.id.in_(sub_menu_ids)).delete(synchronize_session=False)
            
            # Delete parent
            db.delete(sys_menu)
            
            db.commit()
            print("System Settings menu removed successfully!")
        else:
            print("System Settings menu not found.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    remove_system_settings_menu()
