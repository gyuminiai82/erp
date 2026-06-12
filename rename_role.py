import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

import sqlalchemy
from sqlalchemy.orm import sessionmaker
from models import Role

engine = sqlalchemy.create_engine("postgresql://postgres:postgresql@localhost/erp")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def rename_role():
    db = SessionLocal()
    try:
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if admin_role:
            admin_role.name = "master"
            admin_role.description = "사내 총괄 관리자"
            db.commit()
            print("Role renamed successfully!")
        else:
            print("Role 'admin' not found.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    rename_role()
