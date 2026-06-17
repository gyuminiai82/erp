from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import List

from database import get_db
import models
import auth

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db), user: dict = Depends(auth.get_current_user_info)):
    
    # 1. 결재 대기 건수 (내가 결재자인 문서 중 PENDING 상태)
    pending_approvals = db.query(models.ApprovalLine).filter(
        models.ApprovalLine.approver_id == user["id"],
        models.ApprovalLine.status == "PENDING"
    ).count()
    
    # 2. 오늘 근태 현황
    today = date.today().isoformat()
    # 임시로 가장 최근 출퇴근 데이터가 있는 날짜를 찾기 위해 (시드 데이터가 2026-05 기준일 수 있으므로)
    latest_attendance = db.query(models.Attendance).order_by(models.Attendance.work_date.desc()).first()
    target_date = latest_attendance.work_date if latest_attendance else today
    
    present_count = db.query(models.Attendance).filter(
        models.Attendance.work_date == target_date,
        models.Attendance.status.in_(["정상", "지각"])
    ).count()
    
    total_employees = db.query(models.Employee).filter(
        models.Employee.status == "재직"
    ).count()
    
    # 3. 안전재고 미달 품목 (현재 재고 <= 안전 재고)
    low_stock_items = db.query(models.Item).filter(
        models.Item.current_stock <= models.Item.safety_stock
    ).limit(5).all()
    
    # 4. 최근 수주 내역 (영업 - SO)
    recent_orders = db.query(models.Order).filter(
        models.Order.order_type == "SO"
    ).order_by(models.Order.order_date.desc()).limit(5).all()
    
    return {
        "pending_approvals": pending_approvals,
        "attendance": {
            "target_date": str(target_date),
            "present": present_count,
            "total": total_employees
        },
        "low_stock_items": [
            {
                "id": item.id,
                "item_code": item.item_code,
                "item_name": item.item_name,
                "current_stock": item.current_stock,
                "safety_stock": item.safety_stock,
                "unit": item.unit
            }
            for item in low_stock_items
        ],
        "recent_orders": [
            {
                "id": order.id,
                "order_no": order.order_no,
                "client_name": order.client.client_name if order.client else "알 수 없음",
                "total_amount": order.total_amount,
                "status": order.status,
                "order_date": str(order.order_date)
            }
            for order in recent_orders
        ]
    }
