from database import SessionLocal
from payrolls_api import generate_payrolls, PayrollGenerateRequest

db = SessionLocal()
req = PayrollGenerateRequest(payment_month="2026-06")
try:
    generate_payrolls(req, db, None)
except Exception as e:
    import traceback
    traceback.print_exc()
