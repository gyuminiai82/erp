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
    project_id: Optional[int] = None
    is_draft: bool = False
    approvers: List[ApproverInput]

@router.post("/draft")
def draft_approval(payload: DraftApprovalRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user_info)):
    # 1. 기안자 확인
    drafter = db.query(Employee).filter(Employee.email == current_user['email']).first()
    if not drafter:
        raise HTTPException(status_code=404, detail="Drafter not found")

    # 2. 문서 생성
    new_doc = ApprovalDocument(
        drafter_id=drafter.id,
        document_type=payload.document_type,
        title=payload.title,
        content=payload.content,
        project_id=payload.project_id,
        status="DRAFT" if payload.is_draft else "IN_PROGRESS"
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

from sqlalchemy.orm import joinedload

@router.get("/inbox")
def get_inbox(db: Session = Depends(get_db), current_user = Depends(get_current_user_info)):
    me = db.query(Employee).filter(Employee.email == current_user['email']).first()
    if not me:
        raise HTTPException(status_code=404, detail="User not found")
        
    lines = db.query(ApprovalLine).options(joinedload(ApprovalLine.document).joinedload(ApprovalDocument.drafter)).filter(
        ApprovalLine.approver_id == me.id,
    ).all()

    result = []
    for line in lines:
        doc = line.document
        if not doc or doc.status != "IN_PROGRESS":
            continue
            
        all_lines = db.query(ApprovalLine).filter(ApprovalLine.document_id == doc.id).order_by(ApprovalLine.sequence_no).all()
        my_turn = False
        for l in all_lines:
            if l.status == "PENDING":
                if l.id == line.id:
                    my_turn = True
                break
            elif l.status == "REJECTED":
                break
                
        if my_turn:
            result.append({
                "id": doc.id,
                "title": doc.title,
                "document_type": doc.document_type,
                "drafter_name": doc.drafter.name if doc.drafter else "Unknown",
                "status": doc.status,
                "created_at": doc.created_at
            })
            
    return result

@router.get("/outbox")
def get_outbox(db: Session = Depends(get_db), current_user = Depends(get_current_user_info)):
    me = db.query(Employee).filter(Employee.email == current_user['email']).first()
    if not me:
        raise HTTPException(status_code=404, detail="User not found")
        
    docs = db.query(ApprovalDocument).filter(ApprovalDocument.drafter_id == me.id).order_by(ApprovalDocument.created_at.desc()).all()
    
    return [
        {
            "id": doc.id,
            "title": doc.title,
            "document_type": doc.document_type,
            "drafter_name": me.name,
            "status": doc.status,
            "created_at": doc.created_at
        } for doc in docs
    ]

@router.get("/{document_id}")
def get_document(document_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user_info)):
    doc = db.query(ApprovalDocument).options(joinedload(ApprovalDocument.drafter)).filter(ApprovalDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    lines = db.query(ApprovalLine).options(joinedload(ApprovalLine.approver)).filter(ApprovalLine.document_id == document_id).order_by(ApprovalLine.sequence_no).all()
    
    return {
        "id": doc.id,
        "title": doc.title,
        "content": doc.content,
        "document_type": doc.document_type,
        "status": doc.status,
        "drafter_name": doc.drafter.name if doc.drafter else "Unknown",
        "drafter_dept": doc.drafter.department.name if doc.drafter and doc.drafter.department else "부서없음",
        "created_at": doc.created_at,
        "approval_lines": [
            {
                "id": l.id,
                "approver_name": l.approver.name if l.approver else "Unknown",
                "sequence_no": l.sequence_no,
                "status": l.status,
                "comment": l.comment,
                "acted_at": l.acted_at
            } for l in lines
        ]
    }

class ApprovalActionRequest(BaseModel):
    comment: Optional[str] = None

@router.post("/{document_id}/approve")
def approve_document(document_id: int, payload: ApprovalActionRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user_info)):
    me = db.query(Employee).filter(Employee.email == current_user['email']).first()
    doc = db.query(ApprovalDocument).filter(ApprovalDocument.id == document_id).first()
    if not doc or doc.status != "IN_PROGRESS":
        raise HTTPException(status_code=400, detail="Invalid document or state")
        
    lines = db.query(ApprovalLine).filter(ApprovalLine.document_id == document_id).order_by(ApprovalLine.sequence_no).all()
    
    my_line = None
    for l in lines:
        if l.status == "PENDING":
            if l.approver_id == me.id:
                my_line = l
            break
            
    if not my_line:
        raise HTTPException(status_code=403, detail="Not your turn to approve")
        
    my_line.status = "APPROVED"
    my_line.comment = payload.comment
    my_line.acted_at = datetime.utcnow()
    
    if my_line.id == lines[-1].id:
        doc.status = "APPROVED"
        
    db.commit()
    return {"message": "승인 처리되었습니다."}

@router.post("/{document_id}/reject")
def reject_document(document_id: int, payload: ApprovalActionRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user_info)):
    me = db.query(Employee).filter(Employee.email == current_user['email']).first()
    doc = db.query(ApprovalDocument).filter(ApprovalDocument.id == document_id).first()
    if not doc or doc.status != "IN_PROGRESS":
        raise HTTPException(status_code=400, detail="Invalid document or state")
        
    lines = db.query(ApprovalLine).filter(ApprovalLine.document_id == document_id).order_by(ApprovalLine.sequence_no).all()
    
    my_line = None
    for l in lines:
        if l.status == "PENDING":
            if l.approver_id == me.id:
                my_line = l
            break
            
    if not my_line:
        raise HTTPException(status_code=403, detail="Not your turn to reject")
        
    my_line.status = "REJECTED"
    my_line.comment = payload.comment
    my_line.acted_at = datetime.utcnow()
    
    doc.status = "REJECTED"
    
    db.commit()
    return {"message": "반려 처리되었습니다."}
