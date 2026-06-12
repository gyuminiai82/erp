import sqlalchemy
from sqlalchemy import text

engine = sqlalchemy.create_engine("postgresql://postgres:postgresql@localhost/erp")
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE attendance_policies DROP COLUMN late_threshold_mins"))
        conn.commit()
        print("Success")
    except Exception as e:
        print(f"Error: {e}")
