import sqlalchemy
from sqlalchemy import text

engine = sqlalchemy.create_engine("postgresql://postgres:postgresql@localhost/erp")
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE role_menus ADD COLUMN can_read BOOLEAN DEFAULT TRUE"))
        conn.execute(text("ALTER TABLE role_menus ADD COLUMN can_write BOOLEAN DEFAULT FALSE"))
        conn.execute(text("ALTER TABLE role_menus ADD COLUMN can_delete BOOLEAN DEFAULT FALSE"))
        conn.execute(text("ALTER TABLE role_menus ADD COLUMN can_print BOOLEAN DEFAULT FALSE"))
        conn.commit()
        print("Success: Added detailed permission columns to role_menus.")
    except Exception as e:
        print(f"Error: {e}")
