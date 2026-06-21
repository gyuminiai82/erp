import json
import uuid

def gen_id():
    return uuid.uuid4().hex

def run():
    with open('erp.vuerd.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. Create table
    table_id = gen_id()
    table_obj = {
        "id": table_id,
        "name": "leave_balances",
        "comment": "연차 관리",
        "columnIds": [],
        "seqColumnIds": [],
        "ui": {
            "x": 200,
            "y": 200,
            "zIndex": 2,
            "widthName": 93,
            "widthComment": 60,
            "color": ""
        },
        "meta": {
            "updateAt": 1718000000000,
            "createAt": 1718000000000
        }
    }

    # 2. Create columns
    cols = [
        {"name": "id", "comment": "ID", "type": "INT", "pk": True, "ai": True, "nn": True},
        {"name": "employee_id", "comment": "사원 ID", "type": "INT", "pk": False, "ai": False, "nn": True},
        {"name": "year", "comment": "기준 연도", "type": "INT", "pk": False, "ai": False, "nn": True},
        {"name": "total_days", "comment": "총 연차", "type": "FLOAT", "pk": False, "ai": False, "nn": False},
        {"name": "used_days", "comment": "사용 연차", "type": "FLOAT", "pk": False, "ai": False, "nn": False}
    ]

    for col in cols:
        col_id = gen_id()
        table_obj["columnIds"].append(col_id)
        table_obj["seqColumnIds"].append(col_id)
        
        col_obj = {
            "id": col_id,
            "tableId": table_id,
            "name": col["name"],
            "comment": col["comment"],
            "dataType": col["type"],
            "default": "",
            "options": {
                "autoIncrement": col["ai"],
                "primaryKey": col["pk"],
                "unique": False,
                "notNull": col["nn"]
            },
            "ui": {
                "keys": 0,
                "widthName": 60,
                "widthComment": 60,
                "widthDataType": 60,
                "widthDefault": 60
            },
            "meta": {
                "updateAt": 1718000000000,
                "createAt": 1718000000000
            }
        }
        data["collections"]["tableColumnEntities"][col_id] = col_obj

    # 3. Add table to collections and doc
    data["collections"]["tableEntities"][table_id] = table_obj
    data["doc"]["tableIds"].append(table_id)

    with open('erp.vuerd.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Injected leave_balances into vuerd.json")

if __name__ == "__main__":
    run()
