from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, SessionLocal, get_db
import json
import asyncio
from typing import List, Optional
import auth
import employees
import roles
import menus
import settings
import company_api
import attendance_policies_api
import attendances_api
import system_admins_api
import departments_api
import positions_api
import appointments_api
import audit_logs_api
import leaves_api
import payrolls_api
import items_api
import work_orders_api
import accounts_api
import journals_api
import approvals_api
import reports_api
import projects_api
import clients_api
import orders_api
import models
from database import engine, SessionLocal
import psutil
import os
from pydantic import BaseModel

app = FastAPI(title="Minstudio ERP Backend API")

# 프론트엔드 도메인 허용
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth 라우터 등록
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(roles.router)
app.include_router(menus.router)
app.include_router(settings.router)
app.include_router(company_api.router)
app.include_router(attendance_policies_api.router)
app.include_router(attendances_api.router)
app.include_router(system_admins_api.router)
app.include_router(departments_api.router)
app.include_router(positions_api.router)
app.include_router(appointments_api.router)
app.include_router(audit_logs_api.router)
app.include_router(leaves_api.router)
app.include_router(payrolls_api.router)
app.include_router(items_api.router)
app.include_router(work_orders_api.router)
app.include_router(journals_api.router)
app.include_router(accounts_api.router)
app.include_router(reports_api.router)
app.include_router(clients_api.router)
app.include_router(orders_api.router)
app.include_router(projects_api.router)
app.include_router(approvals_api.router, prefix="/api/approvals", tags=["approvals"])

models.Base.metadata.create_all(bind=engine)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        await self.broadcast_sessions()

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_sessions(self):
        count = len(self.active_connections)
        message = json.dumps({"type": "active_sessions", "count": count})
        for connection in self.active_connections.copy():
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

async def broadcast_metrics_task():
    while True:
        try:
            if manager.active_connections:
                import psutil
                vm = psutil.virtual_memory()
                ram_used = round(vm.used / (1024 ** 3), 1)
                ram_total = round(vm.total / (1024 ** 3), 1)
                try:
                    disk_path = psutil.disk_partitions()[0].mountpoint
                    disk = psutil.disk_usage(disk_path)
                    disk_percent = disk.percent
                except:
                    disk_percent = 0
                
                metrics = {
                    "type": "system_metrics",
                    "data": {
                        "cpu_percent": psutil.cpu_percent(interval=None),
                        "ram_used_gb": ram_used,
                        "ram_total_gb": ram_total,
                        "ram_percent": vm.percent,
                        "disk_percent": disk_percent
                    }
                }
                message = json.dumps(metrics)
                for connection in manager.active_connections.copy():
                    try:
                        await connection.send_text(message)
                    except Exception:
                        pass
        except Exception:
            pass
        await asyncio.sleep(1)

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast_sessions()
    except Exception:
        manager.disconnect(websocket)
        await manager.broadcast_sessions()

@app.on_event("startup")
async def start_background_tasks():
    # --- Auto Migrate DB Columns ---
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        with engine.begin() as conn:
            for table_name, table in models.Base.metadata.tables.items():
                if not inspector.has_table(table_name):
                    continue
                existing_columns = [col['name'] for col in inspector.get_columns(table_name)]
                for column in table.columns:
                    if column.name not in existing_columns:
                        col_type = column.type.compile(engine.dialect)
                        query = f"ALTER TABLE {table_name} ADD COLUMN {column.name} {col_type}"
                        print(f"Auto-migrating: {query}")
                        conn.execute(text(query))
    except Exception as e:
        print(f"Auto-migration error: {e}")
    # -------------------------------

    asyncio.create_task(broadcast_metrics_task())

@app.get("/api/departments")
def get_departments(db: Session = Depends(get_db)):
    departments = db.query(models.Department).all()
    return [{"id": d.id, "name": d.name} for d in departments]

@app.get("/api/positions")
def get_positions(db: Session = Depends(get_db)):
    positions = db.query(models.Position).order_by(models.Position.level).all()
    return [{"id": p.id, "name": p.name} for p in positions]

class CommonCodeGroupCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None

class CommonCodeGroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

@app.get("/api/common-code-groups")
def get_common_code_groups(db: Session = Depends(get_db)):
    groups = db.query(models.CommonCodeGroup).order_by(models.CommonCodeGroup.code).all()
    return [{"id": g.id, "code": g.code, "name": g.name, "description": g.description} for g in groups]

@app.post("/api/common-code-groups")
def create_common_code_group(item: CommonCodeGroupCreate, db: Session = Depends(get_db)):
    db_item = models.CommonCodeGroup(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return {"id": db_item.id, "code": db_item.code, "name": db_item.name, "description": db_item.description}

@app.put("/api/common-code-groups/{group_id}")
def update_common_code_group(group_id: int, item: CommonCodeGroupUpdate, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    db_item = db.query(models.CommonCodeGroup).filter(models.CommonCodeGroup.id == group_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Group not found")
    
    update_data = item.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
        
    db.commit()
    db.refresh(db_item)
    return {"id": db_item.id, "code": db_item.code, "name": db_item.name, "description": db_item.description}

@app.delete("/api/common-code-groups/{group_id}")
def delete_common_code_group(group_id: int, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    db_item = db.query(models.CommonCodeGroup).filter(models.CommonCodeGroup.id == group_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Group not found")
        
    # Check if there are codes under this group
    codes_count = db.query(models.CommonCode).filter(models.CommonCode.group_code == db_item.code).count()
    if codes_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete group with existing codes")
        
    db.delete(db_item)
    db.commit()
    return {"message": "Deleted successfully"}

@app.get("/api/common-codes")
def get_common_codes(group: str = None, db: Session = Depends(get_db)):
    query = db.query(models.CommonCode)
    if group:
        query = query.filter(models.CommonCode.group_code == group)
    codes = query.order_by(models.CommonCode.group_code, models.CommonCode.sort_order).all()
    return [{"id": c.id, "code": c.code, "name": c.name, "group_code": c.group_code, "sort_order": c.sort_order, "is_active": c.is_active} for c in codes]

class CommonCodeCreate(BaseModel):
    group_code: str
    code: str
    name: str
    sort_order: int = 0
    is_active: bool = True

from typing import Optional

class CommonCodeUpdate(BaseModel):
    group_code: Optional[str] = None
    code: Optional[str] = None
    name: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

@app.post("/api/common-codes")
def create_common_code(item: CommonCodeCreate, db: Session = Depends(get_db)):
    db_item = models.CommonCode(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return {"id": db_item.id, "code": db_item.code, "name": db_item.name, "group_code": db_item.group_code, "sort_order": db_item.sort_order, "is_active": db_item.is_active}

@app.put("/api/common-codes/{code_id}")
def update_common_code(code_id: int, item: CommonCodeUpdate, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    db_item = db.query(models.CommonCode).filter(models.CommonCode.id == code_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Code not found")
    
    update_data = item.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
        
    db.commit()
    db.refresh(db_item)
    return {"id": db_item.id, "code": db_item.code, "name": db_item.name, "group_code": db_item.group_code, "sort_order": db_item.sort_order, "is_active": db_item.is_active}

class CommonCodeReorderItem(BaseModel):
    id: int
    sort_order: int

@app.put("/api/common-codes/reorder/batch")
def reorder_common_codes(items: List[CommonCodeReorderItem], db: Session = Depends(get_db)):
    for item in items:
        db.query(models.CommonCode).filter(models.CommonCode.id == item.id).update({"sort_order": item.sort_order})
    db.commit()
    return {"message": "순서가 성공적으로 변경되었습니다."}

@app.delete("/api/common-codes/{code_id}")
def delete_common_code(code_id: int, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    db_item = db.query(models.CommonCode).filter(models.CommonCode.id == code_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Code not found")
        
    db.delete(db_item)
    db.commit()
    return {"message": "Deleted successfully"}

@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    if db.query(models.Role).count() == 0:
        roles = [
            models.Role(name="admin", description="시스템 관리자"),
            models.Role(name="hr_manager", description="인사 담당자"),
            models.Role(name="dept_head", description="부서장"),
            models.Role(name="employee", description="일반 사원"),
        ]
        db.add_all(roles)
        db.commit()

        dept_dev = models.Department(name="개발본부")
        dept_hr = models.Department(name="인사팀")
        db.add_all([dept_dev, dept_hr])
        db.commit()

        emp1 = models.Employee(emp_no="EMP23001", name="김철수", department_id=dept_dev.id)
        emp2 = models.Employee(emp_no="EMP21045", name="이영희", department_id=dept_hr.id)
        emp3 = models.Employee(emp_no="EMP19002", name="박지민", department_id=dept_dev.id)
        emp4 = models.Employee(emp_no="EMP15001", name="관리자", department_id=dept_dev.id)
        db.add_all([emp1, emp2, emp3, emp4])
        db.commit()

        db.add_all([
            models.EmployeeRole(employee_id=emp1.id, role_id=roles[3].id),
            models.EmployeeRole(employee_id=emp2.id, role_id=roles[1].id),
            models.EmployeeRole(employee_id=emp3.id, role_id=roles[2].id),
            models.EmployeeRole(employee_id=emp4.id, role_id=roles[0].id),
        ])
        db.commit()
        
    if db.query(models.Menu).count() == 0:
        menus_seed = [
            models.Menu(name="내 대시보드", url="/erp", icon="LayoutDashboard", sort_order=1),
            models.Menu(name="인사 관리", url="/erp/employees", icon="Users", sort_order=2),
            models.Menu(name="근태 현황", url="/erp/attendances", icon="Clock", sort_order=3),
            models.Menu(name="휴가 신청", url="/erp/leaves", icon="Calendar", sort_order=4),
            models.Menu(name="급여 명세서", url="/erp/payrolls", icon="FileText", sort_order=5)
        ]
        db.add_all(menus_seed)
        db.commit()

        # admin 권한 말고, employee 권한에 메뉴 매핑
        employee_role = db.query(models.Role).filter(models.Role.name == "employee").first()
        if employee_role:
            db.add_all([models.RoleMenu(role_id=employee_role.id, menu_id=m.id) for m in menus_seed])
            db.commit()
            
    db.close()

@app.get("/api/hello")
def read_root():
    return {"message": "Hello from Python FastAPI Backend!"}

@app.get("/api/system/metrics")
def get_system_metrics():
    # RAM conversion to GB
    vm = psutil.virtual_memory()
    ram_used = round(vm.used / (1024 ** 3), 1)
    ram_total = round(vm.total / (1024 ** 3), 1)
    
    # Disk usage for the system drive
    try:
        disk_path = psutil.disk_partitions()[0].mountpoint
        disk = psutil.disk_usage(disk_path)
        disk_percent = disk.percent
    except:
        disk_percent = 0

    return {
        "cpu_percent": psutil.cpu_percent(interval=None),
        "ram_used_gb": ram_used,
        "ram_total_gb": ram_total,
        "ram_percent": vm.percent,
        "disk_percent": disk_percent
    }

