# 구동과 무관한 Python 파일 정리 완료

## ✅ 정리 결과

루트 디렉토리의 **39개 Python 파일**이 모두 `scripts/` 폴더로 정리되었습니다.

### 📊 정리 통계

| 카테고리 | 파일 수 | 설명 |
|---------|--------|------|
| **migrations** | 3 | DB 마이그레이션 스크립트 |
| **patches** | 16 | 기존 데이터 패치 스크립트 |
| **injections** | 8 | 초기 데이터 주입 스크립트 |
| **utilities** | 11 | 일반 유틸리티 스크립트 |
| **README.md** | 1 | 사용 가이드 |
| **합계** | **39** | - |

---

## 📁 정리된 구조

```
d:\erp/
├── scripts/                          ✨ 새로 생성됨
│   ├── README.md                    📖 사용 가이드
│   ├── migrations/                  (3개)
│   │   ├── migrate_common_code_groups.py
│   │   ├── drop_late_threshold.py
│   │   └── alter_policy.py
│   ├── patches/                     (16개)
│   │   ├── patch_approval_models.py
│   │   ├── patch_employees.py
│   │   ├── patch_payrolls*.py
│   │   └── ...
│   ├── injections/                  (8개)
│   │   ├── inject.py
│   │   ├── inject_erp_menus.py
│   │   ├── inject_system_settings.py
│   │   └── ...
│   └── utilities/                   (11개)
│       ├── add_*.py
│       ├── find_*.py
│       ├── fix_*.py
│       └── ...
│
├── app/                             (프론트엔드)
├── backend/                         (백엔드 - 구동 필수)
├── components/                      (프론트엔드)
├── public/                          (정적 자산)
└── ... (구동에 필요한 파일들만)
```

---

## 🚀 개발 환경에 미치는 영향

### ✅ 개선 사항
- 루트 디렉토리가 깔끔해졌습니다
- 구동에 필요한 파일들만 루트에 남았습니다
- 유지보수 스크립트들이 체계적으로 정리되었습니다
- 프로젝트 구조가 명확해졌습니다

### ⚠️ 주의사항
- 기존 스크립트들을 실행할 때는 **경로를 변경**해야 합니다
- 자동화된 CI/CD 파이프라인이 있다면 **경로 업데이트**가 필요합니다

---

## 🔄 스크립트 실행 방법

### 이전 (이제 불가)
```powershell
cd d:\erp
python patch_employees.py  ❌ 파일을 찾을 수 없음
```

### 현재 (변경된 방법)
```powershell
cd d:\erp\scripts\patches
python patch_employees.py  ✅ 정상 실행
```

### 또는
```powershell
cd d:\erp
python scripts/patches/patch_employees.py  ✅ 정상 실행
```

---

## 📋 루트 디렉토리 현황

### 남은 구동 관련 파일들
```
d:\erp/
├── app/                             (프론트엔드 앱)
├── backend/                         (백엔드 API)
├── components/                      (UI 컴포넌트)
├── nginx/                           (프로덕션 설정)
├── public/                          (정적 자산)
├── .vscode/                         (개발 환경 설정)
├── .env.local                       (환경 변수)
├── docker-compose.dev.yml           (개발 DB)
├── docker-compose.prod.yml          (프로덕션)
├── Dockerfile                       (프론트엔드 이미지)
├── next.config.ts                   (Next.js 설정)
├── package.json                     (프론트엔드 의존성)
├── tsconfig.json                    (TypeScript 설정)
├── eslint.config.mjs                (린트 설정)
├── postcss.config.mjs               (PostCSS 설정)
├── schema.sql                       (DB 스키마)
├── README.md                        (프로젝트 README)
├── LOCAL_DEVELOPMENT_GUIDE.md       (개발 가이드)
└── SETUP_COMPLETE.md                (설정 완료)

✅ Python 파일: 0개 (모두 scripts/로 이동됨)
```

---

## 🛠️ 유용한 명령어

### 특정 스크립트 실행
```powershell
# 방법 1: scripts 폴더로 이동 후 실행
cd d:\erp\scripts\utilities
python add_role_permissions.py

# 방법 2: 루트에서 경로 지정
cd d:\erp
python scripts/patches/patch_employees.py

# 방법 3: 절대 경로 사용
python d:\erp\scripts\migrations\migrate_common_code_groups.py
```

### 카테고리별 스크립트 목록 보기
```powershell
# 마이그레이션 스크립트
ls d:\erp\scripts\migrations\

# 패치 스크립트
ls d:\erp\scripts\patches\

# 주입 스크립트
ls d:\erp\scripts\injections\

# 유틸리티 스크립트
ls d:\erp\scripts\utilities\
```

---

## 📖 다음 단계

1. **scripts/README.md 검토**
   ```powershell
   notepad d:\erp\scripts\README.md
   ```

2. **CI/CD 파이프라인 업데이트** (있을 경우)
   - GitHub Actions, GitLab CI 등의 스크립트 경로 변경

3. **팀원 알림**
   - 스크립트 실행 경로가 변경되었음을 공유

4. **자동화 스크립트 업데이트** (있을 경우)
   - Cron job, scheduled tasks 등의 경로 변경

---

## 📚 참고 문서

- [scripts/README.md](scripts/README.md) - 상세 사용 가이드
- [LOCAL_DEVELOPMENT_GUIDE.md](LOCAL_DEVELOPMENT_GUIDE.md) - 개발 환경 설정
- [SETUP_COMPLETE.md](SETUP_COMPLETE.md) - 초기 설정 완료 가이드

---

**파일 정리가 완료되었습니다! 프로젝트 구조가 깔끔해졌습니다. 🎉**
