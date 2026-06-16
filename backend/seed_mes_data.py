import os
import sys

# 현재 디렉토리 기준 백엔드 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models
from datetime import datetime

def seed_data():
    db = SessionLocal()
    try:
        # 1. 아이템 데이터 정의
        items_data = [
            {"item_code": "DR-X1", "item_name": "스마트 드론 X1", "item_type": "완제품", "unit": "EA", "standard": "고급형 촬영용 드론"},
            {"item_code": "DR-SA-FC", "item_name": "비행 제어 모듈 어셈블리", "item_type": "반제품", "unit": "EA", "standard": "자동항법, 자세제어 모듈"},
            {"item_code": "DR-SA-MT", "item_name": "모터 암 어셈블리", "item_type": "반제품", "unit": "EA", "standard": "접이식 카본 암대 및 모터"},
            {"item_code": "RM-MT-01", "item_name": "고출력 BLDC 모터", "item_type": "원자재", "unit": "EA", "standard": "2204 2300KV"},
            {"item_code": "RM-FR-01", "item_name": "카본 프레임", "item_type": "원자재", "unit": "EA", "standard": "X자 250mm 프레임"},
            {"item_code": "RM-BT-01", "item_name": "리튬 폴리머 배터리", "item_type": "원자재", "unit": "EA", "standard": "5000mAh 4S"},
            {"item_code": "RM-SN-01", "item_name": "4K 카메라 센서 모듈", "item_type": "원자재", "unit": "EA", "standard": "4K 60fps, 짐벌 일체형"},
            {"item_code": "RM-PCB-01", "item_name": "메인보드 PCB", "item_type": "원자재", "unit": "EA", "standard": "F4 비행제어기"},
        ]

        item_objs = {}
        for data in items_data:
            existing = db.query(models.Item).filter_by(item_code=data["item_code"]).first()
            if not existing:
                new_item = models.Item(**data)
                db.add(new_item)
                db.flush() # id 가져오기 위해
                item_objs[data["item_code"]] = new_item
            else:
                item_objs[data["item_code"]] = existing

        # 2. BOM 데이터 정의
        # 스마트 드론(DR-X1) = FC어셈블리(1) + 모터암어셈블리(4) + 배터리(1) + 카메라(1) + 프레임(1)
        # FC어셈블리(DR-SA-FC) = 메인보드(1)
        # 모터암어셈블리(DR-SA-MT) = BLDC모터(1)

        boms_data = [
            ("DR-X1", "DR-SA-FC", 1.0),
            ("DR-X1", "DR-SA-MT", 4.0),
            ("DR-X1", "RM-BT-01", 1.0),
            ("DR-X1", "RM-SN-01", 1.0),
            ("DR-X1", "RM-FR-01", 1.0),
            ("DR-SA-FC", "RM-PCB-01", 1.0),
            ("DR-SA-MT", "RM-MT-01", 1.0),
        ]

        for parent_code, child_code, qty in boms_data:
            if parent_code in item_objs and child_code in item_objs:
                p_id = item_objs[parent_code].id
                c_id = item_objs[child_code].id
                
                existing_bom = db.query(models.BOM).filter_by(parent_item_id=p_id, child_item_id=c_id).first()
                if not existing_bom:
                    new_bom = models.BOM(parent_item_id=p_id, child_item_id=c_id, quantity=qty)
                    db.add(new_bom)

        db.commit()
        print("포트폴리오용 MES 품목 및 BOM 기초 데이터가 성공적으로 등록되었습니다!")

    except Exception as e:
        db.rollback()
        print(f"오류 발생: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
