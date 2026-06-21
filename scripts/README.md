# Scripts Directory

이 디렉토리는 ERP 애플리케이션 구동과 관련 없는 유틸리티 및 유지보수 스크립트들을 포함합니다.

## 📁 폴더 구조

### `/migrations`
데이터베이스 마이그레이션 및 스키마 변경 스크립트
- `migrate_common_code_groups.py` - 공통 코드 그룹 마이그레이션
- `drop_late_threshold.py` - 지각 임계값 칼럼 제거
- `alter_policy.py` - 정책 테이블 변경

**사용법:**
```powershell
cd scripts/migrations
python migrate_common_code_groups.py
```

### `/patches`
기존 데이터를 수정하는 패치 스크립트들 (16개)
- `patch_*.py` - 특정 모델/페이지 패치
- `patch_payrolls*.py` - 급여 관련 패치들
- `patch_employees.py` - 사원 정보 패치

**사용법:**
```powershell
cd scripts/patches
python patch_employees.py
```

### `/injections`
초기 데이터를 주입하는 스크립트들 (8개)
- `inject.py` - 기본 데이터 주입
- `inject_erp_*.py` - ERP 관련 데이터 주입
- `inject_system_settings.py` - 시스템 설정 주입

**사용법:**
```powershell
cd scripts/injections
python inject.py
```

### `/utilities`
데이터 조회, 추가, 수정 등 일반 유틸리티 스크립트들 (11개)
- `add_*.py` - 데이터 추가 스크립트
- `find_*.py` - 데이터 검색 스크립트
- `fix_*.py` - 데이터 수정 스크립트
- `remove_*.py` - 데이터 제거 스크립트
- `update_*.py` - 데이터 업데이트 스크립트
- `rename_*.py` - 이름 변경 스크립트

**사용법:**
```powershell
cd scripts/utilities
python add_role_permissions.py
```

---

## ⚠️ 주의사항

1. **백업**: 스크립트 실행 전 데이터베이스를 반드시 백업하세요.
2. **DB 연결**: 스크립트 실행 전 PostgreSQL이 실행 중인지 확인하세요.
3. **순서**: 마이그레이션은 다른 스크립트보다 먼저 실행해야 합니다.

```powershell
# PostgreSQL 상태 확인
docker-compose -f ../../docker-compose.dev.yml ps

# PostgreSQL 시작 (필요시)
docker-compose -f ../../docker-compose.dev.yml up -d
```

---

## 🔄 일반적인 사용 순서

1. **마이그레이션 적용**
   ```powershell
   cd migrations
   python migrate_common_code_groups.py
   ```

2. **초기 데이터 주입**
   ```powershell
   cd ../injections
   python inject.py
   ```

3. **필요한 패치 적용**
   ```powershell
   cd ../patches
   python patch_employees.py
   ```

4. **유틸리티로 데이터 검증**
   ```powershell
   cd ../utilities
   python find_dashboard.py
   ```

---

## 📊 파일 통계

| 카테고리 | 파일 수 | 설명 |
|---------|--------|------|
| migrations | 3 | 데이터베이스 마이그레이션 |
| patches | 16 | 기존 데이터 수정 |
| injections | 8 | 초기 데이터 주입 |
| utilities | 11 | 일반 유틸리티 |
| **합계** | **38** | 구동과 무관한 스크립트 |

---

## 🛠️ 스크립트 템플릿

새로운 유틸리티 스크립트를 추가할 때는 다음 템플릿을 사용하세요:

```python
#!/usr/bin/env python3
"""
스크립트 설명

Usage:
    python script_name.py
"""

import sys
import os

# 상위 디렉토리의 backend 모듈 import
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../backend'))

from database import SessionLocal
import models

def main():
    """메인 함수"""
    db = SessionLocal()
    try:
        # 스크립트 로직
        print("✅ 스크립트 완료")
    except Exception as e:
        print(f"❌ 오류: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
```

---

## 📞 문제 해결

### "No module named 'models'" 오류
```powershell
# scripts/utilities 폴더에서 실행 중인 경우
python -m sys.path.insert(0, '../../backend')
```

### 데이터베이스 연결 오류
```powershell
# PostgreSQL 재시작
docker-compose -f ../../docker-compose.dev.yml restart db
```

---

## 📝 참고

- 이 스크립트들은 **프로덕션 환경에서 주의**해서 사용하세요.
- 매 실행 전 **백업**을 권장합니다.
- 스크립트 수정 후 git commit 시 변경사항을 명확히 기록하세요.
