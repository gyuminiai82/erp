import sqlalchemy
from sqlalchemy import text

engine = sqlalchemy.create_engine("postgresql://postgres:postgresql@localhost/erp")
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE attendance_policies ADD COLUMN policy_type VARCHAR DEFAULT 'FIXED'"))
        conn.execute(text("ALTER TABLE attendance_policies ADD COLUMN core_time_start TIME"))
        conn.execute(text("ALTER TABLE attendance_policies ADD COLUMN core_time_end TIME"))
        conn.execute(text("ALTER TABLE attendance_policies ADD COLUMN required_work_hours INTEGER DEFAULT 8"))
        conn.commit()
        print("Success")
    except Exception as e:
        print(f"Error: {e}")
