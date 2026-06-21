# ✅ 로컬 개발환경 구성 완료

## 🎉 구성된 사항

### 1. 프론트엔드 (Next.js)
- ✅ Node.js v22.16.0
- ✅ npm 10.9.2
- ✅ 512개 패키지 설치 완료
- ✅ TypeScript + TailwindCSS 설정

### 2. 백엔드 (FastAPI)
- ✅ Python 3.14.6
- ✅ Python 가상환경 생성 완료
- ✅ FastAPI, SQLAlchemy, PostgreSQL 드라이버 등 설치 완료
- ✅ 핫 리로드 지원

### 3. 데이터베이스 (PostgreSQL)
- ✅ Docker 컨테이너 실행 중
- ✅ 포트: 5432
- ✅ 사용자: postgres
- ✅ 비밀번호: postgresql

### 4. 개발 환경 도구
- ✅ VS Code 설정 (.vscode/settings.json)
- ✅ 디버거 구성 (.vscode/launch.json)
- ✅ 권장 확장 프로그램 목록
- ✅ 빠른 시작 스크립트 (start-dev.ps1)

### 5. 문서
- ✅ 상세 개발 가이드 (LOCAL_DEVELOPMENT_GUIDE.md)

---

## 🚀 지금 바로 시작하기

### 가장 간단한 방법: 2개 터미널 열기

**PowerShell 터미널 1 - 프론트엔드:**
```powershell
cd d:\erp
npm run dev
```

**PowerShell 터미널 2 - 백엔드:**
```powershell
cd d:\erp\backend
venv\Scripts\activate
python -m uvicorn main:app --reload
```

---

## 📍 접속 주소

| 서비스 | URL | 설명 |
|--------|-----|------|
| 프론트엔드 | http://localhost:3000 | Next.js 애플리케이션 |
| 백엔드 API | http://localhost:8000 | FastAPI 서버 |
| API 문서 (Swagger) | http://localhost:8000/docs | API 인터랙티브 문서 |
| API 문서 (ReDoc) | http://localhost:8000/redoc | API 참고 문서 |
| 데이터베이스 | localhost:5432 | PostgreSQL |

---

## 🗂️ 주요 파일 구조

```
d:\erp/
├── app/                      # Next.js 프론트엔드
│   ├── page.tsx             # 메인 페이지
│   ├── layout.tsx           # 레이아웃
│   ├── admin/               # 관리자 페이지
│   ├── erp/                 # ERP 페이지
│   └── globals.css          # 글로벌 스타일
│
├── backend/                  # FastAPI 백엔드
│   ├── venv/                # Python 가상환경 ✓ 설정됨
│   ├── main.py              # FastAPI 애플리케이션
│   ├── models.py            # 데이터베이스 모델
│   ├── database.py          # 데이터베이스 연결 ✓ 설정됨
│   ├── requirements.txt      # 패키지 목록 ✓ 설치됨
│   └── *_api.py             # API 엔드포인트
│
├── components/              # React 컴포넌트
├── public/                  # 정적 파일
├── nginx/                   # Nginx 설정 (프로덕션용)
│
├── .vscode/                 # VS Code 설정 ✓ 구성됨
│   ├── settings.json        # Python/TypeScript 설정
│   ├── launch.json          # 디버거 설정
│   └── extensions.json      # 권장 확장 프로그램
│
├── docker-compose.dev.yml   # 개발용 PostgreSQL ✓ 생성됨
├── .env.local               # 환경 변수 ✓ 생성됨
├── start-dev.ps1            # 빠른 시작 스크립트 ✓ 생성됨
│
└── LOCAL_DEVELOPMENT_GUIDE.md # 상세 개발 가이드 ✓ 생성됨
```

---

## 🛠️ 유용한 명령어

### Python 가상환경
```powershell
# 활성화
cd d:\erp\backend
venv\Scripts\activate

# 비활성화
deactivate

# 새 패키지 설치
pip install <package-name>

# requirements.txt 업데이트
pip freeze > requirements.txt
```

### npm 명령어
```powershell
cd d:\erp

# 개발 서버
npm run dev

# 빌드
npm build

# 프로덕션 실행
npm start

# 린트 확인
npm run lint
```

### PostgreSQL 관리
```powershell
# 상태 확인
docker-compose -f docker-compose.dev.yml ps

# 시작
docker-compose -f docker-compose.dev.yml up -d

# 중지
docker-compose -f docker-compose.dev.yml stop

# 종료
docker-compose -f docker-compose.dev.yml down

# 로그 보기
docker-compose -f docker-compose.dev.yml logs -f db

# CLI 접속
docker-compose -f docker-compose.dev.yml exec db psql -U postgres -d erp
```

---

## 📚 다음 단계

1. **LOCAL_DEVELOPMENT_GUIDE.md** 읽기
   - 더 자세한 설정 및 트러블슈팅 가이드

2. **데이터베이스 초기화** (필요시)
   ```powershell
   cd d:\erp\backend
   venv\Scripts\activate
   python -m alembic upgrade head  # 마이그레이션 실행 (있을 경우)
   ```

3. **샘플 데이터 로드** (필요시)
   - `backend/seed_*.py` 파일 실행

4. **로그인 테스트**
   - 기본 사용자 생성 (create_admin.py 참고)

5. **API 엔드포인트 확인**
   - http://localhost:8000/docs 방문

---

## 🐛 문제 해결

### PostgreSQL 연결 안 됨
```powershell
# 컨테이너 재시작
docker-compose -f docker-compose.dev.yml restart db

# 또는 재생성
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### Python 모듈을 찾을 수 없음
```powershell
# 가상환경 재설치
cd d:\erp\backend
rmdir venv /s /q
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### npm 모듈 문제
```powershell
cd d:\erp
rm -r node_modules package-lock.json
npm install
```

### 포트 이미 사용 중
```powershell
# 다른 포트로 실행
npm run dev -- -p 3001
python -m uvicorn main:app --reload --port 8001
```

---

## ✨ 개발 팁

- **VS Code 디버거 사용**: F5 키로 FastAPI 백엔드 디버깅 가능
- **핫 리로드**: 파일 저장시 자동으로 변경사항 반영
- **API 문서**: http://localhost:8000/docs 에서 API 직접 테스트 가능
- **타입 안정성**: TypeScript와 Pylance로 타입 체크

---

## 📞 도움이 필요하신가요?

`LOCAL_DEVELOPMENT_GUIDE.md` 파일을 참고하세요!

---

**개발 환경 설정이 완료되었습니다! 행복한 코딩! 🎉**
