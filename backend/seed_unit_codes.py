import os
import sys

# 현재 디렉토리 기준 백엔드 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

def seed_units():
    db = SessionLocal()
    try:
        # 1. ITEM_UNIT 그룹 생성
        group_code = "ITEM_UNIT"
        group = db.query(models.CommonCodeGroup).filter(models.CommonCodeGroup.code == group_code).first()
        if not group:
            group = models.CommonCodeGroup(code=group_code, name="품목 단위", description="품목의 관리 단위 (EA, KG 등)")
            db.add(group)
            db.commit()
            print("ITEM_UNIT 그룹이 생성되었습니다.")
        
        # 2. 단위 코드 추가
        units = [
            ("EA", "개 (EA)", 1),
            ("SET", "세트 (SET)", 2),
            ("BOX", "박스 (BOX)", 3),
            ("REEL", "릴 (REEL)", 4),
            ("KG", "킬로그램 (KG)", 5),
            ("L", "리터 (L)", 6),
            ("M", "미터 (M)", 7),
        ]
        
        for code, name, sort_order in units:
            existing = db.query(models.CommonCode).filter(
                models.CommonCode.group_code == group_code,
                models.CommonCode.code == code
            ).first()
            if not existing:
                new_code = models.CommonCode(
                    group_code=group_code,
                    code=code,
                    name=name,
                    sort_order=sort_order,
                    is_active=True
                )
                db.add(new_code)
        
        db.commit()
        print("단위 코드가 성공적으로 추가되었습니다.")
    
    except Exception as e:
        print(f"Error seeding unit codes: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_units()
