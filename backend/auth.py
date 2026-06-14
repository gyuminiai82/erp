import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

import models
from database import get_db

# 보안을 위한 비밀키 설정 (실제 운영 환경에서는 환경 변수 .env 로 분리해야 합니다)
SECRET_KEY = "minstudio_super_secret_erp_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1일 유지

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # client_id를 통해 admin인지 user인지 구분 (프론트에서 전달)
    role_requested = form_data.client_id or "admin"
    
    if role_requested == "admin":
        user = db.query(models.SystemAdmin).filter(models.SystemAdmin.email == form_data.username).first()
        role = "admin"
    else:
        user = db.query(models.Employee).filter(models.Employee.email == form_data.username).first()
        role = "user"

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if role == "user" and user.status != "재직":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="재직 중인 사원만 로그인할 수 있습니다.",
        )
    
    # 3. 토큰 발급
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": role}, expires_delta=access_token_expires
    )
    must_change = getattr(user, 'must_change_password', False)
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": role,
        "must_change_password": must_change
    }

class ChangePasswordRequest(BaseModel):
    email: str
    old_password: str
    new_password: str

@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.Employee).filter(models.Employee.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    if not verify_password(payload.old_password, user.password_hash):
        raise HTTPException(status_code=401, detail="현재 비밀번호가 일치하지 않습니다.")
        
    user.password_hash = get_password_hash(payload.new_password)
    user.must_change_password = False
    db.commit()
    return {"message": "비밀번호가 성공적으로 변경되었습니다."}

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

@router.get("/me")
def get_current_user_info(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if role == "admin":
            return {"name": "System Admin", "email": email, "role_name": "시스템 관리자", "role_code": "admin"}
        else:
            user = db.query(models.Employee).filter(models.Employee.email == email).first()
            if user:
                role_record = db.query(models.EmployeeRole).filter(models.EmployeeRole.employee_id == user.id).first()
                role_code = role_record.role.name if role_record and role_record.role else "employee"
                role_desc = role_record.role.description if role_record and role_record.role else "일반 사원"
                return {"name": user.name, "email": user.email, "role_name": role_desc, "role_code": role_code}
            return {"name": "Unknown", "email": email, "role_name": "Unknown", "role_code": "unknown"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
