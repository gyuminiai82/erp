import os
import sys

# 현재 디렉토리 기준 백엔드 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

def seed_data():
    db = SessionLocal()
    try:
        # 기존 BOM 및 Item 데이터 모두 삭제 (초기화)
        db.query(models.BOM).delete()
        db.query(models.Item).delete()
        db.flush()

        # 1. 자전거 전문 생산 업체 아이템 데이터 정의
        items_data = [
            # ----- 완제품 (Bicycles) -----
            {"item_code": "EB-CITY-01", "item_name": "어반 e-바이크 (City E-Bike)", "item_type": "완제품", "unit": "EA", "standard": "20인치 도심형 접이식 전기자전거"},
            {"item_code": "BK-MTB-01", "item_name": "산악용 자전거 (MTB Pro)", "item_type": "완제품", "unit": "EA", "standard": "27.5인치 풀 서스펜션 산악자전거"},
            {"item_code": "BK-ROAD-01", "item_name": "로드 자전거 (Aero Carbon)", "item_type": "완제품", "unit": "EA", "standard": "700C 초경량 에어로 로드자전거"},

            # ----- 반제품 (Sub-assemblies) -----
            # 어반 e-바이크 반제품
            {"item_code": "SA-FR-CITY", "item_name": "시티 프레임 어셈블리", "item_type": "반제품", "unit": "EA", "standard": "알루미늄 접이식 프레임 조립체"},
            {"item_code": "SA-WT-20", "item_name": "20인치 바퀴 어셈블리", "item_type": "반제품", "unit": "EA", "standard": "20인치 타이어+휠 조립체"},
            {"item_code": "SA-E-DRIVE", "item_name": "전기 구동 어셈블리", "item_type": "반제품", "unit": "EA", "standard": "36V 250W 모터 및 컨트롤러 조립체"},
            
            # 산악자전거(MTB) 반제품
            {"item_code": "SA-FR-MTB", "item_name": "MTB 프레임 어셈블리", "item_type": "반제품", "unit": "EA", "standard": "알루미늄 프레임 + 리어 샥 조립체"},
            {"item_code": "SA-WT-275", "item_name": "27.5인치 바퀴 어셈블리", "item_type": "반제품", "unit": "EA", "standard": "27.5인치 오프로드 타이어+휠 조립체"},
            {"item_code": "SA-SUS-FRONT", "item_name": "프론트 서스펜션 포크", "item_type": "반제품", "unit": "EA", "standard": "120mm 트래블 에어 샥"},

            # 로드 자전거 반제품
            {"item_code": "SA-FR-ROAD", "item_name": "카본 프레임 어셈블리", "item_type": "반제품", "unit": "EA", "standard": "에어로 다이나믹 풀 카본 프레임"},
            {"item_code": "SA-WT-700C", "item_name": "700C 카본 휠 어셈블리", "item_type": "반제품", "unit": "EA", "standard": "700x25C 타이어+카본 림 조립체"},
            {"item_code": "SA-DRIVE-ROAD", "item_name": "구동계 세트", "item_type": "반제품", "unit": "SET", "standard": "22단 레이싱용 기어/크랭크 조립체"},

            # ----- 원자재 (Raw Materials) -----
            # 프레임/차체 부품
            {"item_code": "RM-AL-TUBE", "item_name": "알루미늄 6061 튜브", "item_type": "원자재", "unit": "M", "standard": "프레임 용접용 알루미늄 합금 파이프"},
            {"item_code": "RM-CB-FIBER", "item_name": "카본 파이버 시트", "item_type": "원자재", "unit": "M2", "standard": "T800 등급 카본 원단"},
            {"item_code": "RM-SHOCK-REAR", "item_name": "리어 샥 업소버", "item_type": "원자재", "unit": "EA", "standard": "코일 스프링 리어 샥"},
            
            # 구동/제동 부품
            {"item_code": "RM-GEAR-11", "item_name": "11단 뒷드레일러", "item_type": "원자재", "unit": "EA", "standard": "11스피드 변속기"},
            {"item_code": "RM-GEAR-22", "item_name": "22단 레이싱 구동계 부품", "item_type": "원자재", "unit": "EA", "standard": "앞2단, 뒤11단 레이싱 스펙"},
            {"item_code": "RM-BRK-DISC", "item_name": "유압식 디스크 브레이크", "item_type": "원자재", "unit": "SET", "standard": "MTB/E-Bike 공용 유압 브레이크 캘리퍼"},
            {"item_code": "RM-BRK-RIM", "item_name": "캘리퍼 림 브레이크", "item_type": "원자재", "unit": "SET", "standard": "로드 자전거용 경량 브레이크"},
            {"item_code": "RM-CHAIN", "item_name": "자전거 체인", "item_type": "원자재", "unit": "EA", "standard": "방청 코팅 체인"},
            {"item_code": "RM-SADDLE", "item_name": "자전거 안장", "item_type": "원자재", "unit": "EA", "standard": "인체공학적 안장"},

            # 바퀴 부품
            {"item_code": "RM-TIRE-20", "item_name": "20인치 타이어", "item_type": "원자재", "unit": "EA", "standard": "20 x 1.95 도심형"},
            {"item_code": "RM-RIM-20", "item_name": "20인치 알루미늄 림", "item_type": "원자재", "unit": "EA", "standard": "20인치 36홀"},
            {"item_code": "RM-TIRE-275", "item_name": "27.5인치 MTB 타이어", "item_type": "원자재", "unit": "EA", "standard": "27.5 x 2.10 오프로드형"},
            {"item_code": "RM-RIM-275", "item_name": "27.5인치 알루미늄 림", "item_type": "원자재", "unit": "EA", "standard": "27.5인치 더블월 림"},
            {"item_code": "RM-TIRE-700", "item_name": "700C 로드 타이어", "item_type": "원자재", "unit": "EA", "standard": "700 x 25C 슬릭 타이어"},
            {"item_code": "RM-RIM-700", "item_name": "700C 카본 림", "item_type": "원자재", "unit": "EA", "standard": "50mm 하이림"},

            # 전기 부품 (E-Bike 전용)
            {"item_code": "RM-MOTOR-250", "item_name": "250W BLDC 허브 모터", "item_type": "원자재", "unit": "EA", "standard": "36V 250W 후륜구동형"},
            {"item_code": "RM-BAT-CELL", "item_name": "18650 리튬이온 셀", "item_type": "원자재", "unit": "EA", "standard": "3.7V 3500mAh"},
            {"item_code": "RM-CTRL-36V", "item_name": "36V 모터 컨트롤러", "item_type": "원자재", "unit": "EA", "standard": "전기자전거용 통합 제어보드"},

            # 포장/부자재
            {"item_code": "CM-BOX-BIKE", "item_name": "자전거 포장용 대형 박스", "item_type": "원자재", "unit": "EA", "standard": "골판지 완충 포장재 포함"},
            {"item_code": "CM-MANUAL", "item_name": "사용자 매뉴얼", "item_type": "원자재", "unit": "EA", "standard": "조립 및 안전 수칙 안내서"},
            {"item_code": "CM-SCREW-SET", "item_name": "표준 나사/볼트 세트", "item_type": "원자재", "unit": "SET", "standard": "M4, M5 육각볼트 세트"},
        ]

        item_objs = {}
        for data in items_data:
            existing = db.query(models.Item).filter_by(item_code=data["item_code"]).first()
            if not existing:
                new_item = models.Item(**data)
                db.add(new_item)
                db.flush() # DB에 반영하여 ID를 가져옴
                item_objs[data["item_code"]] = new_item
            else:
                # 데이터 업데이트 (옵션)
                for key, value in data.items():
                    setattr(existing, key, value)
                db.flush()
                item_objs[data["item_code"]] = existing

        # 2. BOM 데이터 정의 (자전거 계층 구조)
        boms_data = [
            # ----- EB-CITY-01 (어반 e-바이크) BOM -----
            ("EB-CITY-01", "SA-FR-CITY", 1.0),
            ("EB-CITY-01", "SA-WT-20", 2.0), # 앞/뒷바퀴
            ("EB-CITY-01", "SA-E-DRIVE", 1.0),
            ("EB-CITY-01", "RM-BRK-DISC", 2.0), # 앞뒤 디스크 브레이크
            ("EB-CITY-01", "RM-CHAIN", 1.0),
            ("EB-CITY-01", "RM-SADDLE", 1.0),
            ("EB-CITY-01", "CM-BOX-BIKE", 1.0),
            ("EB-CITY-01", "CM-MANUAL", 1.0),
            
            # EB-CITY 하위 반제품
            ("SA-FR-CITY", "RM-AL-TUBE", 2.5), # 2.5미터 소요
            ("SA-FR-CITY", "CM-SCREW-SET", 1.0),
            ("SA-WT-20", "RM-TIRE-20", 1.0),
            ("SA-WT-20", "RM-RIM-20", 1.0),
            ("SA-E-DRIVE", "RM-MOTOR-250", 1.0),
            ("SA-E-DRIVE", "RM-CTRL-36V", 1.0),
            ("SA-E-DRIVE", "RM-BAT-CELL", 40.0), # 배터리 팩 조립용 40셀

            # ----- BK-MTB-01 (산악용 자전거) BOM -----
            ("BK-MTB-01", "SA-FR-MTB", 1.0),
            ("BK-MTB-01", "SA-WT-275", 2.0),
            ("BK-MTB-01", "SA-SUS-FRONT", 1.0),
            ("BK-MTB-01", "RM-GEAR-11", 1.0),
            ("BK-MTB-01", "RM-BRK-DISC", 2.0),
            ("BK-MTB-01", "RM-CHAIN", 1.0),
            ("BK-MTB-01", "RM-SADDLE", 1.0),
            ("BK-MTB-01", "CM-BOX-BIKE", 1.0),
            ("BK-MTB-01", "CM-MANUAL", 1.0),
            
            # BK-MTB-01 하위 반제품
            ("SA-FR-MTB", "RM-AL-TUBE", 3.0),
            ("SA-FR-MTB", "RM-SHOCK-REAR", 1.0),
            ("SA-FR-MTB", "CM-SCREW-SET", 2.0),
            ("SA-WT-275", "RM-TIRE-275", 1.0),
            ("SA-WT-275", "RM-RIM-275", 1.0),

            # ----- BK-ROAD-01 (로드 자전거) BOM -----
            ("BK-ROAD-01", "SA-FR-ROAD", 1.0),
            ("BK-ROAD-01", "SA-WT-700C", 2.0),
            ("BK-ROAD-01", "SA-DRIVE-ROAD", 1.0),
            ("BK-ROAD-01", "RM-BRK-RIM", 2.0),
            ("BK-ROAD-01", "RM-CHAIN", 1.0),
            ("BK-ROAD-01", "RM-SADDLE", 1.0),
            ("BK-ROAD-01", "CM-BOX-BIKE", 1.0),
            ("BK-ROAD-01", "CM-MANUAL", 1.0),
            
            # BK-ROAD-01 하위 반제품
            ("SA-FR-ROAD", "RM-CB-FIBER", 4.0), # 카본 시트 4헤베
            ("SA-WT-700C", "RM-TIRE-700", 1.0),
            ("SA-WT-700C", "RM-RIM-700", 1.0),
            ("SA-DRIVE-ROAD", "RM-GEAR-22", 1.0),
        ]

        # 기존 BOM 데이터 정리는 위에서 했으므로 생략
        for parent_code, child_code, qty in boms_data:
            if parent_code in item_objs and child_code in item_objs:
                p_id = item_objs[parent_code].id
                c_id = item_objs[child_code].id
                
                new_bom = models.BOM(parent_item_id=p_id, child_item_id=c_id, quantity=qty)
                db.add(new_bom)

        db.commit()
        print("자전거 전문 생산 업체의 품목(약 30종) 및 BOM 트리가 성공적으로 등록 및 업데이트되었습니다!")

    except Exception as e:
        db.rollback()
        print(f"오류 발생: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
