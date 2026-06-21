import os
import re
from database import engine

def patch_models():
    try:
        with open('backend/models.py', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print("Failed to read models.py:", e)
        return

    # Patch Employee
    if 'dependents_count = Column' not in content:
        content = re.sub(
            r'(attendance_policy_id = Column\(Integer, ForeignKey\("attendance_policies\.id"\), nullable=True\))',
            r'\1\n    dependents_count = Column(Integer, default=1)',
            content
        )

    # Patch Payroll
    if 'income_tax = Column' not in content:
        content = re.sub(
            r'(tardiness_deduction = Column\(Integer, default=0\))',
            r'\1\n    income_tax = Column(Integer, default=0)\n    local_income_tax = Column(Integer, default=0)',
            content
        )

    with open('backend/models.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("models.py updated.")

def alter_db():
    with engine.begin() as conn:
        try:
            conn.execute("ALTER TABLE employees ADD COLUMN dependents_count INTEGER DEFAULT 1;")
            print("Added dependents_count to employees")
        except Exception as e:
            print("employees alter error:", e)
            
        try:
            conn.execute("ALTER TABLE payrolls ADD COLUMN income_tax INTEGER DEFAULT 0;")
            print("Added income_tax to payrolls")
        except Exception as e:
            print("payrolls alter error 1:", e)
            
        try:
            conn.execute("ALTER TABLE payrolls ADD COLUMN local_income_tax INTEGER DEFAULT 0;")
            print("Added local_income_tax to payrolls")
        except Exception as e:
            print("payrolls alter error 2:", e)

if __name__ == "__main__":
    patch_models()
    alter_db()
