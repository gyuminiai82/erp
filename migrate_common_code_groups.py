import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database import SessionLocal, engine, Base
from backend.models import CommonCodeGroup, CommonCode
from sqlalchemy import text

def migrate():
    # Create the new table
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Get distinct group_codes from common_codes
        distinct_groups = db.query(CommonCode.group_code).distinct().all()
        
        for group in distinct_groups:
            group_code = group[0]
            if not group_code:
                continue
            
            # Check if it already exists
            existing = db.query(CommonCodeGroup).filter(CommonCodeGroup.code == group_code).first()
            if not existing:
                # Create a new CommonCodeGroup
                # We'll just use the code as the name for now
                new_group = CommonCodeGroup(code=group_code, name=group_code, description=f"Migrated group for {group_code}")
                db.add(new_group)
        
        db.commit()
        print("Migration successful.")
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
