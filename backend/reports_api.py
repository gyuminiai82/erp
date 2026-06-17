from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date

from database import get_db
from models import JournalEntry, JournalEntryLine, Account
import auth

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"]
)

@router.get("/funds")
def get_funds_status(db: Session = Depends(get_db), user: dict = Depends(auth.get_current_user)):
    """자금 현황 조회: 현금성 자산, 채권, 채무 잔액"""
    
    # 승인완료된 전표 라인 가져오기
    query = db.query(
        JournalEntryLine.account_code,
        JournalEntryLine.account_name,
        func.sum(JournalEntryLine.debit).label('total_debit'),
        func.sum(JournalEntryLine.credit).label('total_credit')
    ).join(
        JournalEntry, JournalEntry.id == JournalEntryLine.journal_entry_id
    ).filter(
        JournalEntry.status == "승인완료"
    ).group_by(
        JournalEntryLine.account_code, JournalEntryLine.account_name
    )
    
    lines = query.all()
    
    # 계정 분류 매핑 (코드 기준)
    cash_codes = ["101", "103"]
    receivable_codes = ["108", "110", "120"]
    payable_codes = ["251", "252", "253", "254", "260"]
    
    funds_data = {
        "cash_equivalents": {"total": 0, "details": []},
        "receivables": {"total": 0, "details": []},
        "payables": {"total": 0, "details": []}
    }
    
    for line in lines:
        code = line.account_code
        name = line.account_name
        # 자산: 차변 - 대변
        if code in cash_codes:
            balance = (line.total_debit or 0) - (line.total_credit or 0)
            funds_data["cash_equivalents"]["total"] += balance
            funds_data["cash_equivalents"]["details"].append({"code": code, "name": name, "balance": balance})
        elif code in receivable_codes:
            balance = (line.total_debit or 0) - (line.total_credit or 0)
            funds_data["receivables"]["total"] += balance
            funds_data["receivables"]["details"].append({"code": code, "name": name, "balance": balance})
        # 부채: 대변 - 차변
        elif code in payable_codes:
            balance = (line.total_credit or 0) - (line.total_debit or 0)
            funds_data["payables"]["total"] += balance
            funds_data["payables"]["details"].append({"code": code, "name": name, "balance": balance})
            
    return funds_data

@router.get("/statements")
def get_statements(
    type: str = Query(..., description="BS(재무상태표) 또는 IS(손익계산서)"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db), 
    user: dict = Depends(auth.get_current_user)
):
    """재무제표 조회 (재무상태표, 손익계산서)"""
    
    query = db.query(
        Account.type.label('account_type'),
        JournalEntryLine.account_code,
        JournalEntryLine.account_name,
        func.sum(JournalEntryLine.debit).label('total_debit'),
        func.sum(JournalEntryLine.credit).label('total_credit')
    ).join(
        Account, Account.code == JournalEntryLine.account_code
    ).join(
        JournalEntry, JournalEntry.id == JournalEntryLine.journal_entry_id
    ).filter(
        JournalEntry.status == "승인완료"
    )
    
    if start_date:
        query = query.filter(JournalEntry.entry_date >= start_date)
    if end_date:
        query = query.filter(JournalEntry.entry_date <= end_date)
        
    query = query.group_by(Account.type, JournalEntryLine.account_code, JournalEntryLine.account_name)
    lines = query.all()
    
    if type == 'BS':
        # 재무상태표: 자산, 부채, 자본
        bs_data = {
            "assets": {"total": 0, "items": []},
            "liabilities": {"total": 0, "items": []},
            "equity": {"total": 0, "items": []}
        }
        
        for line in lines:
            if line.account_type == "자산":
                bal = (line.total_debit or 0) - (line.total_credit or 0)
                bs_data["assets"]["items"].append({"code": line.account_code, "name": line.account_name, "balance": bal})
                bs_data["assets"]["total"] += bal
            elif line.account_type == "부채":
                bal = (line.total_credit or 0) - (line.total_debit or 0)
                bs_data["liabilities"]["items"].append({"code": line.account_code, "name": line.account_name, "balance": bal})
                bs_data["liabilities"]["total"] += bal
            elif line.account_type == "자본":
                bal = (line.total_credit or 0) - (line.total_debit or 0)
                bs_data["equity"]["items"].append({"code": line.account_code, "name": line.account_name, "balance": bal})
                bs_data["equity"]["total"] += bal
                
        # 당기순이익 계산 (수익 - 비용)을 자본에 추가
        net_income = 0
        for line in lines:
            if line.account_type == "수익":
                net_income += (line.total_credit or 0) - (line.total_debit or 0)
            elif line.account_type in ["비용", "제조원가", "판매비와관리비"]:
                net_income -= (line.total_debit or 0) - (line.total_credit or 0)
                
        if net_income != 0:
            bs_data["equity"]["items"].append({"code": "999", "name": "당기순이익", "balance": net_income})
            bs_data["equity"]["total"] += net_income
            
        return bs_data
        
    elif type == 'IS':
        # 손익계산서: 수익, 비용(매출원가, 판관비 등)
        is_data = {
            "revenues": {"total": 0, "items": []},
            "cogs": {"total": 0, "items": []}, # 매출원가 (제조원가)
            "sga": {"total": 0, "items": []},  # 판관비
            "non_op_income": {"total": 0, "items": []},
            "non_op_expenses": {"total": 0, "items": []},
        }
        
        for line in lines:
            if line.account_type == "수익":
                # 상품매출, 제품매출은 매출로, 이자수익 등은 영업외수익으로 처리 가능하나 단순화.
                bal = (line.total_credit or 0) - (line.total_debit or 0)
                if line.account_code.startswith("40") or line.account_code.startswith("41"):
                    is_data["revenues"]["items"].append({"code": line.account_code, "name": line.account_name, "balance": bal})
                    is_data["revenues"]["total"] += bal
                else:
                    is_data["non_op_income"]["items"].append({"code": line.account_code, "name": line.account_name, "balance": bal})
                    is_data["non_op_income"]["total"] += bal
            elif line.account_type == "제조원가":
                bal = (line.total_debit or 0) - (line.total_credit or 0)
                is_data["cogs"]["items"].append({"code": line.account_code, "name": line.account_name, "balance": bal})
                is_data["cogs"]["total"] += bal
            elif line.account_type == "판매비와관리비":
                bal = (line.total_debit or 0) - (line.total_credit or 0)
                is_data["sga"]["items"].append({"code": line.account_code, "name": line.account_name, "balance": bal})
                is_data["sga"]["total"] += bal
            elif line.account_type == "비용":
                bal = (line.total_debit or 0) - (line.total_credit or 0)
                is_data["non_op_expenses"]["items"].append({"code": line.account_code, "name": line.account_name, "balance": bal})
                is_data["non_op_expenses"]["total"] += bal
                
        # 요약 데이터 (매출총이익, 영업이익, 법인세차감전순이익, 당기순이익)
        gross_profit = is_data["revenues"]["total"] - is_data["cogs"]["total"]
        operating_profit = gross_profit - is_data["sga"]["total"]
        net_income = operating_profit + is_data["non_op_income"]["total"] - is_data["non_op_expenses"]["total"]
        
        is_data["summary"] = {
            "gross_profit": gross_profit,
            "operating_profit": operating_profit,
            "net_income": net_income
        }
        
        return is_data
        
    else:
        raise HTTPException(status_code=400, detail="유효하지 않은 리포트 타입입니다 (BS, IS).")
