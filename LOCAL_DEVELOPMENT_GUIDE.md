# 로컬 개발환경 구성 가이드

## 🚀 구성된 사항

프론트엔드 및 백엔드 개발을 위한 로컬 환경이 준비되었습니다.

### 설치된 도구
- ✅ Node.js v22.16.0
- ✅ npm 10.9.2
- ✅ Python 3.14.6
- ✅ Docker 29.5.3

### 설치된 의존성
- ✅ 프론트엔드 패키지 (Next.js, React, TailwindCSS 등)
- ✅ 백엔드 패키지 (FastAPI, SQLAlchemy, PostgreSQL 드라이버 등)
- ✅ PostgreSQL 데이터베이스 (Docker)

---

## 🎯 개발 서버 실행 방법

### 방법 1: 동시에 프론트엔드 + 백엔드 실행

**PowerShell에서 2개 터미널 열기:**

**터미널 1 - 프론트엔드:**
```powershell
cd d:\erp
npm run dev
```
→ 접속: http://localhost:3000

**터미널 2 - 백엔드:**
```powershell
cd d:\erp\backend
venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
→ API: http://localhost:8000
→ API Docs: http://localhost:8000/docs

### 방법 2: 프론트엔드만 실행

```powershell
cd d:\erp
npm run dev
```

### 방법 3: 백엔드만 실행

```powershell
cd d:\erp\backend
venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🗄️ 데이터베이스

### PostgreSQL 상태 확인
```powershell
docker-compose -f docker-compose.dev.yml ps
```

### PostgreSQL 시작
```powershell
cd d:\erp
docker-compose -f docker-compose.dev.yml up -d
```

### PostgreSQL 중지
```powershell
cd d:\erp
docker-compose -f docker-compose.dev.yml down
```

### PostgreSQL 접속 (CLI)
```powershell
docker-compose -f docker-compose.dev.yml exec db psql -U postgres -d erp
```

### 데이터베이스 연결 정보
- **Host**: localhost
- **Port**: 5432
- **Username**: postgres
- **Password**: postgresql
- **Database**: erp

---

## 🔧 환경 변수

### 프론트엔드 (.env.local)
현재 설정된 환경 변수:
```env
NODE_ENV=development
```

### 백엔드 환경 변수
Python을 실행할 때 자동으로 인식되는 변수들:
```env
DATABASE_URL=postgresql://postgres:postgresql@localhost:5432/erp
PYTHONUNBUFFERED=1
```

필요시 `backend/.env` 파일을 생성하여 환경 변수를 설정할 수 있습니다.

---

## 📝 Python 가상환경 활성화

### Windows (PowerShell)
```powershell
cd d:\erp\backend
venv\Scripts\activate
```

### Windows (Command Prompt)
```cmd
cd d:\erp\backend
venv\Scripts\activate.bat
```

### 가상환경 비활성화
```powershell
deactivate
```

---

## 📦 의존성 업데이트

### 프론트엔드 패키지 업데이트
```powershell
cd d:\erp
npm update
npm install <package-name>
```

### 백엔드 패키지 설치
```powershell
cd d:\erp\backend
venv\Scripts\activate
pip install -r requirements.txt
pip install <package-name>
```

새로운 패키지 설치 후 requirements.txt 업데이트:
```powershell
pip freeze > requirements.txt
```

---

## 🧪 개발 팁

### VS Code에서 Python 인터프리터 설정
1. VS Code 열기
2. Ctrl + Shift + P → "Python: Select Interpreter"
3. `.\backend\venv\Scripts\python.exe` 선택

### 핫 리로드
- **프론트엔드**: Next.js는 파일 변경시 자동 리로드됨
- **백엔드**: `--reload` 옵션으로 변경시 자동 리로드됨

### API 문서
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 빌드

프론트엔드 빌드:
```powershell
cd d:\erp
npm run build
```

---

## ⚠️ 트러블슈팅

### PostgreSQL 연결 오류
```
psycopg2.OperationalError: could not connect to server
```
**해결책:**
```powershell
# PostgreSQL이 실행 중인지 확인
docker-compose -f docker-compose.dev.yml ps

# 없으면 시작
docker-compose -f docker-compose.dev.yml up -d

# 대기 (healthcheck 완료될 때까지)
Start-Sleep -Seconds 5
```

### 포트 이미 사용 중
**프론트엔드 (3000 포트):**
```powershell
npm run dev -- -p 3001
```

**백엔드 (8000 포트):**
```powershell
python -m uvicorn main:app --reload --port 8001
```

### Node.js 모듈 오류
```powershell
cd d:\erp
rm -r node_modules
npm install
```

---

## 📚 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [SQLAlchemy 공식 문서](https://docs.sqlalchemy.org/)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)

---

## ✨ 다음 단계

1. 데이터베이스 마이그레이션 실행 (필요시)
2. 샘플 데이터 로드 (seed 파일 확인)
3. 로그인 테스트
4. API 엔드포인트 확인

---

**개발 환경 구성 완료! 🎉**
