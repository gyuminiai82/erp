import os
import sys
from datetime import date, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../backend'))

from database import SessionLocal
import models

def seed_projects():
    db = SessionLocal()
    try:
        # 1. Get or create some clients
        client1 = db.query(models.Client).filter(models.Client.client_name == '(주)미래테크').first()
        if not client1:
            client1 = models.Client(
                client_code='C2026-001',
                client_name='(주)미래테크',
                client_type='고객사',
                representative='김미래'
            )
            db.add(client1)
            
        client2 = db.query(models.Client).filter(models.Client.client_name == '(주)글로벌네트웍스').first()
        if not client2:
            client2 = models.Client(
                client_code='C2026-002',
                client_name='(주)글로벌네트웍스',
                client_type='고객사',
                representative='이글로'
            )
            db.add(client2)
            
        db.commit()

        # 2. Get some employees to act as managers
        manager1 = db.query(models.Employee).filter(models.Employee.name == '김철수').first()
        manager2 = db.query(models.Employee).filter(models.Employee.name == '관리자').first()
        if not manager1 and not manager2:
            manager1 = db.query(models.Employee).first()

        m1_id = manager1.id if manager1 else None
        m2_id = manager2.id if manager2 else m1_id

        # 3. Create dummy projects
        dummy_projects = [
            {
                "name": "차세대 ERP 시스템 구축",
                "client_id": client1.id,
                "manager_id": m2_id,
                "start_date": date(2026, 5, 1),
                "end_date": date(2026, 12, 31),
                "budget": 500000000,
                "status": "IN_PROGRESS"
            },
            {
                "name": "모바일 앱 UI/UX 리뉴얼",
                "client_id": client2.id,
                "manager_id": m1_id,
                "start_date": date(2026, 6, 15),
                "end_date": date(2026, 9, 30),
                "budget": 120000000,
                "status": "IN_PROGRESS"
            },
            {
                "name": "클라우드 인프라 마이그레이션",
                "client_id": client1.id,
                "manager_id": m2_id,
                "start_date": date(2026, 8, 1),
                "end_date": date(2026, 11, 30),
                "budget": 300000000,
                "status": "PLANNED"
            },
            {
                "name": "AI 기반 데이터 분석 플랫폼 도입",
                "client_id": client2.id,
                "manager_id": m1_id,
                "start_date": date(2026, 1, 15),
                "end_date": date(2026, 4, 30),
                "budget": 250000000,
                "status": "COMPLETED"
            },
            {
                "name": "사내 그룹웨어 유지보수",
                "client_id": client1.id,
                "manager_id": m1_id,
                "start_date": date(2026, 1, 1),
                "end_date": date(2026, 12, 31),
                "budget": 80000000,
                "status": "IN_PROGRESS"
            }
        ]

        added_count = 0
        for p_data in dummy_projects:
            existing = db.query(models.Project).filter(models.Project.name == p_data["name"]).first()
            if not existing:
                project = models.Project(**p_data)
                db.add(project)
                added_count += 1
                
        db.commit()
        print(f"성공적으로 {added_count}개의 프로젝트 더미데이터를 추가했습니다.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_projects()
