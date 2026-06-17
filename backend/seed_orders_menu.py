import sys
import os

sys.path.append(os.path.abspath('d:/001_portfolio/port_erp/backend'))

from database import SessionLocal
from models import Menu, Role, RoleMenu

db = SessionLocal()

parent_name = '영업/구매 관리'
parent_menu = db.query(Menu).filter(Menu.name == parent_name).first()
if not parent_menu:
    parent_menu = Menu(name=parent_name, icon='ShoppingCart', sort_order=40)
    db.add(parent_menu)
    db.commit()
    db.refresh(parent_menu)

orders_name = '수주/발주 등록'
orders_menu = db.query(Menu).filter(Menu.name == orders_name).first()

# Fix broken encoding ones
broken = db.query(Menu).filter(Menu.url == '/erp/orders').all()
for b in broken:
    if b.name != orders_name:
        b.name = orders_name
        db.commit()

if not db.query(Menu).filter(Menu.name == orders_name).first():
    orders_menu = Menu(name=orders_name, url='/erp/orders', parent_id=parent_menu.id, sort_order=10)
    db.add(orders_menu)
    db.commit()
    db.refresh(orders_menu)
else:
    orders_menu = db.query(Menu).filter(Menu.name == orders_name).first()

master_role = db.query(Role).filter(Role.name == 'master').first()
if master_role:
    if not db.query(RoleMenu).filter(RoleMenu.role_id == master_role.id, RoleMenu.menu_id == parent_menu.id).first():
        db.add(RoleMenu(role_id=master_role.id, menu_id=parent_menu.id))
    if not db.query(RoleMenu).filter(RoleMenu.role_id == master_role.id, RoleMenu.menu_id == orders_menu.id).first():
        db.add(RoleMenu(role_id=master_role.id, menu_id=orders_menu.id))
    db.commit()

print('Menu added correctly')
