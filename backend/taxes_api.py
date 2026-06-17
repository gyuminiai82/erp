from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date
from pydantic import BaseModel

from database import get_db
from models import Payroll
from auth import get_current_user_info

router = APIRouter(
    prefix="/api/taxes",
    tags=["taxes"],
)

class WithholdingSummary(BaseModel):
    payment_month: str
    total_employees: int
    total_gross_pay: int
    total_income_tax: int
    total_local_income_tax: int

@router.get("/withholding", response_model=WithholdingSummary)
def get_withholding_summary(month: str, db: Session = Depends(get_db), current_user = Depends(get_current_user_info)):
    payrolls = db.query(Payroll).filter(Payroll.payment_month == month).all()
    
    total_employees = len(payrolls)
    total_gross_pay = sum((p.base_salary or 0) + (p.bonus or 0) for p in payrolls)
    total_income_tax = sum((p.income_tax or 0) for p in payrolls)
    total_local_income_tax = sum((p.local_income_tax or 0) for p in payrolls)
    
    return WithholdingSummary(
        payment_month=month,
        total_employees=total_employees,
        total_gross_pay=total_gross_pay,
        total_income_tax=total_income_tax,
        total_local_income_tax=total_local_income_tax
    )
