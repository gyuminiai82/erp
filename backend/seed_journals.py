import os
import sys
from datetime import date, timedelta

# 현재 디렉토리 기준 백엔드 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

def seed_journals():
    db = SessionLocal()
    try:
        # 기존 더미 데이터 삭제 (초기화 방지용)
        db.query(models.JournalEntry).delete()
        db.commit()

        # Admin 유저 찾기 (작성자용)
        admin_user = db.query(models.Employee).first()
        admin_id = admin_user.id if admin_user else None

        today = date.today()

        dummy_entries = [
            {
                "entry_date": today - timedelta(days=10),
                "entry_type": "입금",
                "description": "법인 설립 초기 자본금 납입",
                "status": "승인완료",
                "lines": [
                    {"account_code": "103", "account_name": "보통예금", "debit": 50000000.0, "credit": 0.0, "description": "신한은행 자본금 계좌 입금"},
                    {"account_code": "301", "account_name": "자본금", "debit": 0.0, "credit": 50000000.0, "description": "초기 자본금 발행"}
                ]
            },
            {
                "entry_date": today - timedelta(days=5),
                "entry_type": "출금",
                "description": "6월분 사무실 임차료 지급",
                "status": "승인완료",
                "lines": [
                    {"account_code": "819", "account_name": "지급임차료", "debit": 2000000.0, "credit": 0.0, "description": "강남 오피스 임대료"},
                    {"account_code": "103", "account_name": "보통예금", "debit": 0.0, "credit": 2000000.0, "description": "신한은행 출금"}
                ]
            },
            {
                "entry_date": today - timedelta(days=2),
                "entry_type": "대체",
                "description": "ABC마트 상품 납품 매출 인식",
                "status": "작성중",
                "lines": [
                    {"account_code": "108", "account_name": "외상매출금", "debit": 15000000.0, "credit": 0.0, "description": "납품 완료 (미수금)"},
                    {"account_code": "401", "account_name": "상품매출", "debit": 0.0, "credit": 15000000.0, "description": "스마트폰 조립품 납품 건"}
                ]
            },
            {
                "entry_date": today,
                "entry_type": "출금",
                "description": "개발팀 회식대 결제",
                "status": "작성중",
                "lines": [
                    {"account_code": "811", "account_name": "복리후생비", "debit": 350000.0, "credit": 0.0, "description": "강남 고기집 회식"},
                    {"account_code": "253", "account_name": "미지급금", "debit": 0.0, "credit": 350000.0, "description": "법인카드 결제 (결제일 도래 전)"}
                ]
            }
        ]

        for entry_data in dummy_entries:
            lines_data = entry_data.pop("lines")
            new_entry = models.JournalEntry(
                **entry_data,
                creator_id=admin_id,
                approver_id=admin_id if entry_data["status"] == "승인완료" else None
            )
            db.add(new_entry)
            db.commit()
            db.refresh(new_entry)

            for line_data in lines_data:
                new_line = models.JournalEntryLine(
                    journal_entry_id=new_entry.id,
                    **line_data
                )
                db.add(new_line)
            
        db.commit()
        print("더미 전표 데이터가 성공적으로 주입되었습니다!")

    except Exception as e:
        print(f"Error seeding journals: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_journals()
