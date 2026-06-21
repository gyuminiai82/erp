import json
import uuid
import time

def make_id():
    return uuid.uuid4().hex

data = json.load(open('erp.vuerd.json', encoding='utf-8'))

if any(t.get('name') == 'system_settings' for t in data['collections']['tableEntities'].values()):
    print("Already added")
    exit(0)

table_id = make_id()
cols = [
    {"name": "id", "type": "INT", "comment": "설정 고유 ID", "pk": True, "options": 11},
    {"name": "key", "type": "VARCHAR(255)", "comment": "설정 키", "pk": False, "options": 2},
    {"name": "value", "type": "VARCHAR(255)", "comment": "설정 값", "pk": False, "options": 0},
    {"name": "description", "type": "VARCHAR(255)", "comment": "설명", "pk": False, "options": 0},
]

col_ids = []
for c in cols:
    cid = make_id()
    col_ids.append(cid)
    data['collections']['tableColumnEntities'][cid] = {
        "id": cid,
        "tableId": table_id,
        "name": c['name'],
        "comment": c['comment'],
        "dataType": c['type'],
        "default": "",
        "options": c['options'],
        "ui": {"keys": 1 if c['pk'] else 0, "widthName": 60, "widthComment": 60, "widthDataType": 60, "widthDefault": 60},
        "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
    }

data['collections']['tableEntities'][table_id] = {
    "id": table_id,
    "name": "system_settings",
    "comment": "시스템 환경설정",
    "columnIds": col_ids,
    "seqColumnIds": col_ids,
    "ui": {"x": 50, "y": 800, "zIndex": 2, "widthName": 60, "widthComment": 60, "color": ""},
    "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
}
data['doc']['tableIds'].append(table_id)

with open('erp.vuerd.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Injected system_settings into erp.vuerd.json successfully!")
