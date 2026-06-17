from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Employee, ApprovalDocument, ApprovalLine
from auth import get_current_user_info
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class ApproverInput(BaseModel):
    employee_id: int
    sequence_no: int

class DraftApprovalRequest(BaseModel):
    document_type: str
    title: str
    content: str
    approvers: List[ApproverInput]

@router.post("/draft")
def draft_approval(payload: DraftApprovalRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user_info)):
    # 1. 기안자 확인
    drafter = db.query(Employee).filter(Employee.email == current_user['sub']).first()
    if not drafter:
        raise HTTPException(status_code=404, detail="Drafter not found")

    # 2. 문서 생성
    new_doc = ApprovalDocument(
        drafter_id=drafter.id,
        document_type=payload.document_type,
        title=payload.title,
        content=payload.content,
        status="IN_PROGRESS"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    # 3. 결재선 생성
    for approver_input in payload.approvers:
        # Check if employee exists
        approver = db.query(Employee).filter(Employee.id == approver_input.employee_id).first()
        if not approver:
            continue # ignore invalid approvers
            
        new_line = ApprovalLine(
            document_id=new_doc.id,
            approver_id=approver_input.employee_id,
            sequence_no=approver_input.sequence_no,
            status="PENDING"
        )
        db.add(new_line)
        
    db.commit()
    
    return {"message": "기안이 성공적으로 상신되었습니다.", "document_id": new_doc.id}
