from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel
import models
import database
from auth import get_current_user_info

router = APIRouter(
    prefix="/api/projects",
    tags=["Projects"]
)

# -----------------
# Project Base CRUD
# -----------------
class ProjectBase(BaseModel):
    name: str
    client_id: Optional[int] = None
    manager_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = 0.0
    status: Optional[str] = "PLANNED"

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    name: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    client_name: Optional[str] = None
    manager_name: Optional[str] = None

    class Config:
        orm_mode = True

@router.get("", response_model=List[ProjectResponse])
def get_projects(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user=Depends(get_current_user_info)):
    projects = db.query(models.Project).order_by(models.Project.id.desc()).offset(skip).limit(limit).all()
    res = []
    for p in projects:
        data = {c.name: getattr(p, c.name) for c in models.Project.__table__.columns}
        data['client_name'] = p.client.client_name if p.client else None
        data['manager_name'] = p.manager.name if p.manager else None
        res.append(data)
    return res

@router.post("", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(database.get_db), current_user=Depends(get_current_user_info)):
    db_project = models.Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    data = {c.name: getattr(db_project, c.name) for c in models.Project.__table__.columns}
    data['client_name'] = db_project.client.client_name if db_project.client else None
    data['manager_name'] = db_project.manager.name if db_project.manager else None
    return data

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, project: ProjectUpdate, db: Session = Depends(database.get_db), current_user=Depends(get_current_user_info)):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    update_data = project.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_project, key, value)
    db.commit()
    db.refresh(db_project)
    data = {c.name: getattr(db_project, c.name) for c in models.Project.__table__.columns}
    data['client_name'] = db_project.client.client_name if db_project.client else None
    data['manager_name'] = db_project.manager.name if db_project.manager else None
    return data

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(database.get_db), current_user=Depends(get_current_user_info)):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    used = db.query(models.JournalEntryLine).filter(models.JournalEntryLine.project_id == project_id).first()
    if used:
        raise HTTPException(status_code=400, detail="Cannot delete project because it is used in accounting entries")
    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted successfully"}


# -----------------
# 1. WBS Tasks
# -----------------
class TaskBase(BaseModel):
    name: str
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = "TODO"
    progress: Optional[int] = 0

@router.get("/{project_id}/tasks")
def get_tasks(project_id: int, db: Session = Depends(database.get_db)):
    tasks = db.query(models.ProjectTask).filter(models.ProjectTask.project_id == project_id).all()
    res = []
    for t in tasks:
        d = {c.name: getattr(t, c.name) for c in models.ProjectTask.__table__.columns}
        d['assignee_name'] = t.assignee.name if t.assignee else None
        res.append(d)
    return res

@router.post("/{project_id}/tasks")
def create_task(project_id: int, task: TaskBase, db: Session = Depends(database.get_db)):
    db_task = models.ProjectTask(project_id=project_id, **task.dict())
    db.add(db_task)
    db.commit()
    return {"message": "success"}

# -----------------
# 2. Resources (M/M)
# -----------------
class ResourceBase(BaseModel):
    employee_id: int
    role: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    participation_rate: Optional[float] = 1.0

@router.get("/{project_id}/resources")
def get_resources(project_id: int, db: Session = Depends(database.get_db)):
    res_list = db.query(models.ProjectResource).filter(models.ProjectResource.project_id == project_id).all()
    res = []
    for r in res_list:
        d = {c.name: getattr(r, c.name) for c in models.ProjectResource.__table__.columns}
        d['employee_name'] = r.employee.name if r.employee else None
        d['department_name'] = r.employee.department.name if r.employee and r.employee.department else None
        res.append(d)
    return res

@router.post("/{project_id}/resources")
def add_resource(project_id: int, resource: ResourceBase, db: Session = Depends(database.get_db)):
    db_res = models.ProjectResource(project_id=project_id, **resource.dict())
    db.add(db_res)
    db.commit()
    return {"message": "success"}

# -----------------
# 3. Budgets
# -----------------
class BudgetBase(BaseModel):
    category: str
    amount: float
    spent_amount: Optional[float] = 0.0
    remarks: Optional[str] = None

@router.get("/{project_id}/budgets")
def get_budgets(project_id: int, db: Session = Depends(database.get_db)):
    budgets = db.query(models.ProjectBudget).filter(models.ProjectBudget.project_id == project_id).all()
    return [{c.name: getattr(b, c.name) for c in models.ProjectBudget.__table__.columns} for b in budgets]

@router.post("/{project_id}/budgets")
def create_budget(project_id: int, budget: BudgetBase, db: Session = Depends(database.get_db)):
    db_budget = models.ProjectBudget(project_id=project_id, **budget.dict())
    db.add(db_budget)
    db.commit()
    return {"message": "success"}

# -----------------
# 4. Issues
# -----------------
class IssueBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "MEDIUM"
    status: Optional[str] = "OPEN"
    assignee_id: Optional[int] = None
    due_date: Optional[date] = None

@router.get("/{project_id}/issues")
def get_issues(project_id: int, db: Session = Depends(database.get_db)):
    issues = db.query(models.ProjectIssue).filter(models.ProjectIssue.project_id == project_id).all()
    res = []
    for i in issues:
        d = {c.name: getattr(i, c.name) for c in models.ProjectIssue.__table__.columns}
        d['reporter_name'] = i.reporter.name if i.reporter else None
        d['assignee_name'] = i.assignee.name if i.assignee else None
        res.append(d)
    return res

@router.post("/{project_id}/issues")
def create_issue(project_id: int, issue: IssueBase, db: Session = Depends(database.get_db), current_user=Depends(get_current_user_info)):
    me = db.query(models.Employee).filter(models.Employee.email == current_user['email']).first()
    db_issue = models.ProjectIssue(project_id=project_id, reporter_id=me.id if me else None, **issue.dict())
    db.add(db_issue)
    db.commit()
    return {"message": "success"}

# -----------------
# 5. Documents
# -----------------
class DocumentBase(BaseModel):
    title: str
    document_type: str
    file_url: Optional[str] = None

@router.get("/{project_id}/documents")
def get_documents(project_id: int, db: Session = Depends(database.get_db)):
    docs = db.query(models.ProjectDocument).filter(models.ProjectDocument.project_id == project_id).all()
    res = []
    for d in docs:
        x = {c.name: getattr(d, c.name) for c in models.ProjectDocument.__table__.columns}
        x['uploader_name'] = d.uploader.name if d.uploader else None
        res.append(x)
    return res

@router.post("/{project_id}/documents")
def create_document(project_id: int, doc: DocumentBase, db: Session = Depends(database.get_db), current_user=Depends(get_current_user_info)):
    me = db.query(models.Employee).filter(models.Employee.email == current_user['email']).first()
    db_doc = models.ProjectDocument(project_id=project_id, uploaded_by=me.id if me else None, **doc.dict())
    db.add(db_doc)
    db.commit()
    return {"message": "success"}
