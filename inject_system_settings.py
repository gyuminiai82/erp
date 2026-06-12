import json
import uuid
import time

def make_id():
    return uuid.uuid4().hex

data = json.load(open('erp.vuerd.json', encoding='utf-8'))

def table_exists(name):
    return any(t.get('name') == name for t in data['collections']['tableEntities'].values())

if not table_exists("system_settings"):
    tid = make_id()
    
    cols = [
        {"name": "id", "type": "INT", "comment": "고유 ID", "pk": True, "options": 11},
        {"name": "emp_no_prefix", "type": "VARCHAR(255)", "comment": "사번 접두사", "pk": False, "options": 0},
        {"name": "emp_no_year_format", "type": "VARCHAR(255)", "comment": "연도 표기 형식", "pk": False, "options": 0},
        {"name": "emp_no_length", "type": "INT", "comment": "사번 길이", "pk": False, "options": 0},
    ]
    
    col_ids = []
    for c in cols:
        cid = make_id()
        col_ids.append(cid)
        data['collections']['tableColumnEntities'][cid] = {
            "id": cid,
            "tableId": tid,
            "name": c['name'],
            "comment": c['comment'],
            "dataType": c['type'],
            "default": "",
            "options": c['options'],
            "ui": {"keys": 1 if c['pk'] else 0, "widthName": 60, "widthComment": 60, "widthDataType": 60, "widthDefault": 60},
            "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
        }
    
    data['collections']['tableEntities'][tid] = {
        "id": tid,
        "name": "system_settings",
        "comment": "시스템 환경설정",
        "columnIds": col_ids,
        "seqColumnIds": col_ids,
        "ui": {"x": 800, "y": 1000, "zIndex": 2, "widthName": 60, "widthComment": 60, "color": ""},
        "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
    }
    data['doc']['tableIds'].append(tid)

    with open('erp.vuerd.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print("Added system_settings to erp.vuerd.json")
else:
    print("system_settings already exists")
