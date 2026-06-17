from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from pydantic import BaseModel
from database import get_db
import models

router = APIRouter(prefix="/api/accounting/journals", tags=["Journals"])

class JournalEntryLineBase(BaseModel):
    account_code: str
    account_name: str
    debit: float = 0.0
    credit: float = 0.0
    description: Optional[str] = None
    department_id: Optional[int] = None
    client_id: Optional[int] = None
    project_id: Optional[int] = None

class JournalEntryCreate(BaseModel):
    entry_date: date
    entry_type: str = "대체"
    description: Optional[str] = None
    creator_id: Optional[int] = None
    lines: List[JournalEntryLineBase]

class JournalEntryUpdate(BaseModel):
    entry_date: Optional[date] = None
    entry_type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    lines: Optional[List[JournalEntryLineBase]] = None

@router.get("")
def get_journals(start_date: str = None, end_date: str = None, db: Session = Depends(get_db)):
    query = db.query(models.JournalEntry)
    if start_date:
        query = query.filter(models.JournalEntry.entry_date >= start_date)
    if end_date:
        query = query.filter(models.JournalEntry.entry_date <= end_date)
    
    entries = query.order_by(models.JournalEntry.entry_date.desc(), models.JournalEntry.id.desc()).all()
    
    result = []
    for entry in entries:
        total_debit = sum(line.debit for line in entry.lines)
        total_credit = sum(line.credit for line in entry.lines)
        creator_name = entry.creator.name if entry.creator else "-"
        approver_name = entry.approver.name if entry.approver else "-"
        
        result.append({
            "id": entry.id,
            "entry_date": entry.entry_date,
            "entry_type": entry.entry_type,
            "description": entry.description,
            "status": entry.status,
            "total_debit": total_debit,
            "total_credit": total_credit,
            "creator_name": creator_name,
            "approver_name": approver_name,
            "lines": [
                {
                    "id": line.id,
                    "account_code": line.account_code,
                    "account_name": line.account_name,
                    "debit": line.debit,
                    "credit": line.credit,
                    "description": line.description,
                    "department_id": line.department_id,
                    "client_id": line.client_id,
                    "project_id": line.project_id,
                    "department_name": line.department.name if line.department else None,
                    "client_name": line.client.name if line.client else None,
                    "project_name": line.project.name if line.project else None
                } for line in entry.lines
            ]
        })
    return result

@router.post("")
def create_journal(item: JournalEntryCreate, db: Session = Depends(get_db)):
    # 대차평균 검증
    total_debit = sum(line.debit for line in item.lines)
    total_credit = sum(line.credit for line in item.lines)
    
    if abs(total_debit - total_credit) > 0.01:
        raise HTTPException(status_code=400, detail="차변과 대변의 합계가 일치하지 않습니다.")

    db_entry = models.JournalEntry(
        entry_date=item.entry_date,
        entry_type=item.entry_type,
        description=item.description,
        creator_id=item.creator_id,
        status="작성중"
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)

    for line in item.lines:
        db_line = models.JournalEntryLine(
            journal_entry_id=db_entry.id,
            account_code=line.account_code,
            account_name=line.account_name,
            debit=line.debit,
            credit=line.credit,
            description=line.description,
            department_id=line.department_id,
            client_id=line.client_id,
            project_id=line.project_id
        )
        db.add(db_line)
    
    db.commit()
    return {"message": "전표가 성공적으로 생성되었습니다.", "id": db_entry.id}

@router.delete("/{entry_id}")
def delete_journal(entry_id: int, db: Session = Depends(get_db)):
    db_entry = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="전표를 찾을 수 없습니다.")
    
    db.delete(db_entry)
    db.commit()
    return {"message": "삭제되었습니다."}
