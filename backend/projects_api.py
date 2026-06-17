from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel
import models
import database
from auth import get_current_user

router = APIRouter(
    prefix="/api/projects",
    tags=["Projects"]
)

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

@router.get("/", response_model=List[ProjectResponse])
def get_projects(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user=Depends(get_current_user)):
    projects = db.query(models.Project).order_by(models.Project.id.desc()).offset(skip).limit(limit).all()
    res = []
    for p in projects:
        data = {c.name: getattr(p, c.name) for c in models.Project.__table__.columns}
        data['client_name'] = p.client.name if p.client else None
        data['manager_name'] = p.manager.name if p.manager else None
        res.append(data)
    return res

@router.post("/", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(database.get_db), current_user=Depends(get_current_user)):
    db_project = models.Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    data = {c.name: getattr(db_project, c.name) for c in models.Project.__table__.columns}
    data['client_name'] = db_project.client.name if db_project.client else None
    data['manager_name'] = db_project.manager.name if db_project.manager else None
    return data

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, project: ProjectUpdate, db: Session = Depends(database.get_db), current_user=Depends(get_current_user)):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_project, key, value)
        
    db.commit()
    db.refresh(db_project)
    
    data = {c.name: getattr(db_project, c.name) for c in models.Project.__table__.columns}
    data['client_name'] = db_project.client.name if db_project.client else None
    data['manager_name'] = db_project.manager.name if db_project.manager else None
    return data

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(database.get_db), current_user=Depends(get_current_user)):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if used in JournalEntryLine
    used = db.query(models.JournalEntryLine).filter(models.JournalEntryLine.project_id == project_id).first()
    if used:
        raise HTTPException(status_code=400, detail="Cannot delete project because it is used in accounting entries")
        
    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted successfully"}
