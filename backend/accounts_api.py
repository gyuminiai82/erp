from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import json
from datetime import datetime

import models
from database import get_db
from auth import get_current_employee

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])

class AccountBase(BaseModel):
    code: str
    name: str
    type: str
    description: Optional[str] = None
    is_active: bool = True

class AccountCreate(AccountBase):
    pass

class AccountSchema(AccountBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.get("", response_model=List[AccountSchema])
def get_accounts(db: Session = Depends(get_db)):
    return db.query(models.Account).order_by(models.Account.code.asc()).all()

@router.post("", response_model=AccountSchema)
def create_account(data: AccountCreate, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    existing = db.query(models.Account).filter(models.Account.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 계정코드입니다.")

    db_account = models.Account(
        code=data.code,
        name=data.name,
        type=data.type,
        description=data.description,
        is_active=data.is_active
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)

    try:
        audit = models.AuditLog(
            event_title="계정과목 추가", 
            event_desc=f"새 계정과목 '{data.code} ({data.name})'을(를) 추가했습니다.", 
            user_name=current_user.name, 
            user_email=current_user.email, 
            payload=json.dumps({"code": data.code, "name": data.name})
        )
        db.add(audit); db.commit()
    except Exception:
        db.rollback()

    return db_account

@router.put("/{account_id}", response_model=AccountSchema)
def update_account(account_id: int, data: AccountCreate, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    db_account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="계정과목을 찾을 수 없습니다.")

    if data.code != db_account.code:
        existing = db.query(models.Account).filter(models.Account.code == data.code).first()
        if existing:
            raise HTTPException(status_code=400, detail="이미 존재하는 계정코드입니다.")

    db_account.code = data.code
    db_account.name = data.name
    db_account.type = data.type
    db_account.description = data.description
    db_account.is_active = data.is_active
    db.commit()
    db.refresh(db_account)

    try:
        audit = models.AuditLog(
            event_title="계정과목 수정", 
            event_desc=f"계정과목 '{data.code}' 정보를 수정했습니다.", 
            user_name=current_user.name, 
            user_email=current_user.email, 
            payload=json.dumps({"id": account_id, "code": data.code})
        )
        db.add(audit); db.commit()
    except Exception:
        db.rollback()

    return db_account

@router.delete("/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):
    db_account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="계정과목을 찾을 수 없습니다.")

    # 사용 중인지 확인은 나중에 필요한 경우 추가 (예: JournalEntryLine 등)
    # 현재는 단순 삭제만 허용

    db.delete(db_account)
    db.commit()

    try:
        audit = models.AuditLog(
            event_title="계정과목 삭제", 
            event_desc=f"계정과목 ID {account_id}을(를) 삭제했습니다.", 
            user_name=current_user.name, 
            user_email=current_user.email, 
            payload=json.dumps({"id": account_id})
        )
        db.add(audit); db.commit()
    except Exception:
        db.rollback()

    return {"detail": "삭제되었습니다."}
