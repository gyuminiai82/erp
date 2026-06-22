import os
import sys
from datetime import date, timedelta
import random

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../backend'))

from database import SessionLocal
import models

def seed_project_details():
    db = SessionLocal()
    try:
        projects = db.query(models.Project).all()
        if not projects:
            print("No projects found. Run seed_projects.py first.")
            return

        employees = db.query(models.Employee).all()
        if not employees:
            print("No employees found.")
            return
            
        today = date.today()

        for project in projects:
            # Seed WBS (Tasks)
            if not db.query(models.ProjectTask).filter_by(project_id=project.id).first():
                tasks = [
                    models.ProjectTask(
                        project_id=project.id,
                        name="요구사항 분석",
                        description="고객 요구사항 수집 및 분석",
                        assignee_id=random.choice(employees).id,
                        start_date=project.start_date,
                        end_date=project.start_date + timedelta(days=14) if project.start_date else today + timedelta(days=14),
                        status="DONE",
                        progress=100
                    ),
                    models.ProjectTask(
                        project_id=project.id,
                        name="시스템 설계",
                        description="아키텍처 및 DB 설계",
                        assignee_id=random.choice(employees).id,
                        start_date=project.start_date + timedelta(days=15) if project.start_date else today + timedelta(days=15),
                        end_date=project.start_date + timedelta(days=30) if project.start_date else today + timedelta(days=30),
                        status="IN_PROGRESS",
                        progress=60
                    ),
                    models.ProjectTask(
                        project_id=project.id,
                        name="개발 및 구현",
                        description="프론트엔드 및 백엔드 개발",
                        assignee_id=random.choice(employees).id,
                        start_date=project.start_date + timedelta(days=31) if project.start_date else today + timedelta(days=31),
                        end_date=project.start_date + timedelta(days=60) if project.start_date else today + timedelta(days=60),
                        status="TODO",
                        progress=0
                    )
                ]
                db.add_all(tasks)

            # Seed Resources
            if not db.query(models.ProjectResource).filter_by(project_id=project.id).first():
                resources = [
                    models.ProjectResource(
                        project_id=project.id,
                        employee_id=random.choice(employees).id,
                        role="PM",
                        start_date=project.start_date,
                        end_date=project.end_date,
                        participation_rate=1.0
                    ),
                    models.ProjectResource(
                        project_id=project.id,
                        employee_id=random.choice(employees).id,
                        role="개발자",
                        start_date=project.start_date,
                        end_date=project.end_date,
                        participation_rate=0.5
                    )
                ]
                db.add_all(resources)

            # Seed Budgets
            if not db.query(models.ProjectBudget).filter_by(project_id=project.id).first():
                budgets = [
                    models.ProjectBudget(
                        project_id=project.id,
                        category="인건비",
                        amount=50000000,
                        spent_amount=20000000,
                        remarks="내부 개발자 인건비"
                    ),
                    models.ProjectBudget(
                        project_id=project.id,
                        category="장비/라이선스",
                        amount=10000000,
                        spent_amount=3000000,
                        remarks="AWS 클라우드 및 S/W 구매"
                    )
                ]
                db.add_all(budgets)

            # Seed Issues
            if not db.query(models.ProjectIssue).filter_by(project_id=project.id).first():
                issues = [
                    models.ProjectIssue(
                        project_id=project.id,
                        title="기존 데이터 마이그레이션 이슈",
                        description="데이터 포맷 불일치로 마이그레이션 지연",
                        priority="HIGH",
                        status="OPEN",
                        reporter_id=random.choice(employees).id,
                        assignee_id=random.choice(employees).id,
                        due_date=today + timedelta(days=7)
                    ),
                    models.ProjectIssue(
                        project_id=project.id,
                        title="API 연동 테스트 오류",
                        description="결제 모듈 연동 시 타임아웃 발생",
                        priority="MEDIUM",
                        status="RESOLVED",
                        reporter_id=random.choice(employees).id,
                        assignee_id=random.choice(employees).id,
                        due_date=today - timedelta(days=2)
                    )
                ]
                db.add_all(issues)

            # Seed Documents
            if not db.query(models.ProjectDocument).filter_by(project_id=project.id).first():
                docs = [
                    models.ProjectDocument(
                        project_id=project.id,
                        title="요구사항 정의서 v1.0",
                        document_type="기획서",
                        file_url="/uploads/req_v1.0.pdf",
                        uploaded_by=random.choice(employees).id
                    ),
                    models.ProjectDocument(
                        project_id=project.id,
                        title="주간 업무 보고서",
                        document_type="회의록",
                        file_url="/uploads/weekly_report.pdf",
                        uploaded_by=random.choice(employees).id
                    )
                ]
                db.add_all(docs)

        db.commit()
        print("Successfully seeded project details.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding project details: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_project_details()
