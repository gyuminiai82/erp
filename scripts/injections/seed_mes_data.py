import os
import sys

# 현재 디렉토리 기준 백엔드 경로 추가
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../backend'))

from database import SessionLocal
import models

def seed_data():
    db = SessionLocal()
    try:
        # 기존 BOM, WorkOrder 및 Item 데이터 모두 삭제 (초기화)
        db.query(models.BOM).delete()
        db.query(models.WorkOrder).delete()
        db.query(models.Item).delete()
        db.flush()

        # 1. 스마트폰 기판 조립(SMT) 아이템 데이터 정의
        items_data = [
            # ----- 완제품 -----
            {"item_code": "SP-S26-MAIN", "item_name": "Galaxy S26 Main PCBA", "item_type": "완제품", "unit": "EA", "standard": "S26 메인보드 완제품", "standard_cost": 250000, "safety_stock": 500, "current_stock": 1200, "lead_time": 2, "is_lot_tracked": True, "location": "완제품 창고 A동"},
            {"item_code": "SP-S26-SUB", "item_name": "Galaxy S26 Sub PCBA", "item_type": "완제품", "unit": "EA", "standard": "S26 서브보드(충전단자 포함)", "standard_cost": 85000, "safety_stock": 1000, "current_stock": 3500, "lead_time": 2, "is_lot_tracked": True, "location": "완제품 창고 A동"},

            # ----- 반제품 (SMT 실장 완료 기판) -----
            {"item_code": "SA-MAIN-SMT", "item_name": "Main SMT Assy", "item_type": "반제품", "unit": "EA", "standard": "표면실장 완료된 메인 기판", "standard_cost": 180000, "safety_stock": 1000, "current_stock": 800, "lead_time": 1, "is_lot_tracked": True, "location": "제공품(WIP) 대기열"},
            {"item_code": "SA-SUB-SMT", "item_name": "Sub SMT Assy", "item_type": "반제품", "unit": "EA", "standard": "표면실장 완료된 서브 기판", "standard_cost": 50000, "safety_stock": 2000, "current_stock": 1500, "lead_time": 1, "is_lot_tracked": True, "location": "제공품(WIP) 대기열"},

            # ----- 원자재 (IC, 칩 부품 등) -----
            {"item_code": "RM-AP-8GEN4", "item_name": "Snapdragon 8 Gen 4 (AP)", "item_type": "원자재", "unit": "EA", "standard": "퀄컴 모바일 AP", "standard_cost": 120000, "safety_stock": 5000, "current_stock": 15000, "lead_time": 30, "is_lot_tracked": True, "location": "항온항습 자재창고"},
            {"item_code": "RM-RAM-LPDDR5X", "item_name": "LPDDR5X 12GB RAM", "item_type": "원자재", "unit": "EA", "standard": "모바일용 D램", "standard_cost": 45000, "safety_stock": 5000, "current_stock": 12000, "lead_time": 14, "is_lot_tracked": True, "location": "항온항습 자재창고"},
            {"item_code": "RM-NAND-UFS4", "item_name": "UFS 4.0 256GB NAND", "item_type": "원자재", "unit": "EA", "standard": "모바일 스토리지", "standard_cost": 55000, "safety_stock": 3000, "current_stock": 8000, "lead_time": 14, "is_lot_tracked": True, "location": "항온항습 자재창고"},
            {"item_code": "RM-MLCC-1005", "item_name": "MLCC 1005 (10uF)", "item_type": "원자재", "unit": "REEL", "standard": "적층세라믹콘덴서 10000EA/Reel", "standard_cost": 150000, "safety_stock": 50, "current_stock": 120, "lead_time": 7, "is_lot_tracked": False, "location": "일반 자재창고 B열"},
            {"item_code": "RM-MLCC-0603", "item_name": "MLCC 0603 (1uF)", "item_type": "원자재", "unit": "REEL", "standard": "적층세라믹콘덴서 10000EA/Reel", "standard_cost": 80000, "safety_stock": 100, "current_stock": 250, "lead_time": 7, "is_lot_tracked": False, "location": "일반 자재창고 B열"},
            {"item_code": "RM-PCB-MAIN", "item_name": "Main Bare PCB", "item_type": "원자재", "unit": "EA", "standard": "HDI 12층 메인 보드", "standard_cost": 15000, "safety_stock": 2000, "current_stock": 5000, "lead_time": 21, "is_lot_tracked": True, "location": "일반 자재창고 A열"},
            {"item_code": "RM-PCB-SUB", "item_name": "Sub Bare PCB", "item_type": "원자재", "unit": "EA", "standard": "HDI 8층 서브 보드", "standard_cost": 5000, "safety_stock": 5000, "current_stock": 12000, "lead_time": 14, "is_lot_tracked": True, "location": "일반 자재창고 A열"},
            {"item_code": "RM-PMIC", "item_name": "Power Management IC", "item_type": "원자재", "unit": "EA", "standard": "전력 관리 칩", "standard_cost": 8000, "safety_stock": 5000, "current_stock": 18000, "lead_time": 14, "is_lot_tracked": True, "location": "항온항습 자재창고"},
            
            # 부자재
            {"item_code": "CM-SOLDER-PASTE", "item_name": "SAC305 솔더 페이스트", "item_type": "원자재", "unit": "KG", "standard": "무연납 (Type 4)", "standard_cost": 120000, "safety_stock": 10, "current_stock": 35, "lead_time": 5, "is_lot_tracked": True, "location": "냉장 보관소"},
            {"item_code": "CM-SHIELD-CAN", "item_name": "EMI 차폐용 쉴드 캔", "item_type": "원자재", "unit": "EA", "standard": "Main AP용 노이즈 차폐 커버", "standard_cost": 1500, "safety_stock": 10000, "current_stock": 25000, "lead_time": 10, "is_lot_tracked": False, "location": "일반 자재창고 C열"},
            {"item_code": "CM-UNDERFILL", "item_name": "언더필 에폭시 수지", "item_type": "원자재", "unit": "L", "standard": "BGA 보강용 접착제", "standard_cost": 45000, "safety_stock": 5, "current_stock": 12, "lead_time": 7, "is_lot_tracked": True, "location": "냉장 보관소"},
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
                for key, value in data.items():
                    setattr(existing, key, value)
                db.flush()
                item_objs[data["item_code"]] = existing

        # 2. BOM 데이터 정의
        boms_data = [
            # ----- SP-S26-MAIN (Main PCBA 완제품) -----
            ("SP-S26-MAIN", "SA-MAIN-SMT", 1.0),
            ("SP-S26-MAIN", "CM-SHIELD-CAN", 3.0), # 차폐 캔 3개 조립
            ("SP-S26-MAIN", "CM-UNDERFILL", 0.005), # 5ml 사용
            
            # SA-MAIN-SMT 하위 자재 (SMT 실장용)
            ("SA-MAIN-SMT", "RM-PCB-MAIN", 1.0),
            ("SA-MAIN-SMT", "RM-AP-8GEN4", 1.0),
            ("SA-MAIN-SMT", "RM-RAM-LPDDR5X", 1.0),
            ("SA-MAIN-SMT", "RM-NAND-UFS4", 1.0),
            ("SA-MAIN-SMT", "RM-PMIC", 2.0),
            ("SA-MAIN-SMT", "RM-MLCC-1005", 0.02), # 릴 단위(10000개)에서 200개 사용 = 0.02
            ("SA-MAIN-SMT", "RM-MLCC-0603", 0.015), # 150개 사용 = 0.015
            ("SA-MAIN-SMT", "CM-SOLDER-PASTE", 0.002), # 2g 사용

            # ----- SP-S26-SUB (Sub PCBA 완제품) -----
            ("SP-S26-SUB", "SA-SUB-SMT", 1.0),
            ("SP-S26-SUB", "CM-SHIELD-CAN", 1.0),
            
            # SA-SUB-SMT 하위 자재
            ("SA-SUB-SMT", "RM-PCB-SUB", 1.0),
            ("SA-SUB-SMT", "RM-MLCC-1005", 0.005), # 50개 사용
            ("SA-SUB-SMT", "RM-MLCC-0603", 0.008), # 80개 사용
            ("SA-SUB-SMT", "CM-SOLDER-PASTE", 0.001), # 1g 사용
        ]

        for parent_code, child_code, qty in boms_data:
            if parent_code in item_objs and child_code in item_objs:
                p_id = item_objs[parent_code].id
                c_id = item_objs[child_code].id
                
                existing_bom = db.query(models.BOM).filter_by(parent_item_id=p_id, child_item_id=c_id).first()
                if not existing_bom:
                    new_bom = models.BOM(parent_item_id=p_id, child_item_id=c_id, quantity=qty)
                    db.add(new_bom)
                else:
                    existing_bom.quantity = qty

        # 3. Work Order (작업 지시서) 더미 데이터
        orders_data = [
            {"order_no": "WO-2606-001", "item_code": "SP-S26-MAIN", "planned_quantity": 1000, "produced_quantity": 350, "status": "IN_PROGRESS"},
            {"order_no": "WO-2606-002", "item_code": "SP-S26-SUB", "planned_quantity": 2000, "produced_quantity": 2000, "status": "COMPLETED"},
            {"order_no": "WO-2606-003", "item_code": "SA-MAIN-SMT", "planned_quantity": 1500, "produced_quantity": 0, "status": "PENDING"},
        ]
        
        manager = db.query(models.Employee).first()
        manager_id = manager.id if manager else None

        for data in orders_data:
            existing = db.query(models.WorkOrder).filter_by(order_no=data["order_no"]).first()
            item = item_objs.get(data["item_code"])
            if item:
                if not existing:
                    new_wo = models.WorkOrder(
                        order_no=data["order_no"],
                        item_id=item.id,
                        planned_quantity=data["planned_quantity"],
                        produced_quantity=data["produced_quantity"],
                        status=data["status"],
                        manager_id=manager_id
                    )
                    db.add(new_wo)

        db.commit()
        print("✅ 스마트폰 조립(SMT) 도메인 품목(Item), BOM, 작업지시(WorkOrder) 더미 데이터 생성 및 교체가 완료되었습니다.")

    except Exception as e:
        db.rollback()
        print(f"오류 발생: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("초기 품목 데이터베이스 세팅(SMT 전환)을 시작합니다...")
    seed_data()
