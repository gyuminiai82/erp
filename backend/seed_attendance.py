import os
import sys
import random
from datetime import date, timedelta
from database import SessionLocal
import models

def seed_attendance():
    db = SessionLocal()
    try:
        emp = db.query(models.Employee).filter(models.Employee.name == '김철수').first()
        if not emp:
            print("김철수 사원을 찾을 수 없습니다.")
            return

        # 2026년 5월 출퇴근 기록 생성 (평일만)
        year = 2026
        month = 5
        start_date = date(year, month, 1)
        
        # 5월 날짜 수 구하기
        if month == 12:
            days_in_month = 31
        else:
            days_in_month = (date(year, month+1, 1) - timedelta(days=1)).day

        for day in range(1, days_in_month + 1):
            current_date = date(year, month, day)
            
            # 주말 (5: 토요일, 6: 일요일) 제외
            if current_date.weekday() >= 5:
                continue

            # 5월 5일 어린이날 제외
            if month == 5 and day == 5:
                continue
                
            # 휴가 1일 추가 (예: 5월 15일)
            if month == 5 and day == 15:
                # 이미 휴가가 있는지 확인
                existing_leave = db.query(models.LeaveRequest).filter(
                    models.LeaveRequest.employee_id == emp.id,
                    models.LeaveRequest.start_date <= current_date,
                    models.LeaveRequest.end_date >= current_date
                ).first()
                if not existing_leave:
                    leave = models.LeaveRequest(
                        employee_id=emp.id,
                        leave_type="연차",
                        start_date=current_date,
                        end_date=current_date,
                        reason="개인 사정",
                        status="승인"
                    )
                    db.add(leave)
                continue

            # 이미 출근 기록이 있는지 확인
            existing = db.query(models.Attendance).filter(
                models.Attendance.employee_id == emp.id,
                models.Attendance.work_date == current_date
            ).first()

            if not existing:
                # 10% 확률로 지각 (09:05 ~ 09:30 사이 출근)
                is_late = random.random() < 0.1
                
                if is_late:
                    in_hour = 9
                    in_minute = random.randint(5, 30)
                    status = "지각"
                else:
                    in_hour = 8
                    in_minute = random.randint(30, 55)
                    status = "정상"

                check_in_str = f"{in_hour:02d}:{in_minute:02d}"
                
                # 퇴근은 18:00 ~ 19:30 사이
                out_hour = 18
                out_minute = random.randint(0, 59)
                if random.random() < 0.2:
                    out_hour = 19
                    out_minute = random.randint(0, 30)

                check_out_str = f"{out_hour:02d}:{out_minute:02d}"

                att = models.Attendance(
                    employee_id=emp.id,
                    work_date=current_date,
                    check_in=check_in_str,
                    check_out=check_out_str,
                    status=status
                )
                db.add(att)

        db.commit()
        print(f"{emp.name} 사원의 2026년 5월 출퇴근 기록이 성공적으로 추가되었습니다!")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_attendance()
