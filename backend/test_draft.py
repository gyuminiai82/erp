import requests

# We need a valid token to test, but wait, we can just use the DB to find what went wrong.
# If we just do it via DB, we can replicate the logic.
from database import SessionLocal
from models import Employee, ApprovalDocument, ApprovalLine

db = SessionLocal()
try:
    drafter = db.query(Employee).first()
    new_doc = ApprovalDocument(
        drafter_id=drafter.id,
        document_type="기안서",
        title="test",
        content="test content",
        status="IN_PROGRESS"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    print("Document created successfully", new_doc.id)
    
    new_line = ApprovalLine(
        document_id=new_doc.id,
        approver_id=drafter.id,
        sequence_no=1,
        status="PENDING"
    )
    db.add(new_line)
    db.commit()
    print("Line created successfully", new_line.id)
except Exception as e:
    print(f"Error: {type(e).__name__} - {str(e)}")
finally:
    db.close()
