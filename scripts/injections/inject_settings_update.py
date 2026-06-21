import json
import uuid
import time

def make_id():
    return uuid.uuid4().hex

data = json.load(open('erp.vuerd.json', encoding='utf-8'))

# Find system_settings table
setting_tid = None
for t in data['collections']['tableEntities'].values():
    if t.get('name') == 'system_settings':
        setting_tid = t['id']
        break

if setting_tid:
    # Delete existing columns for this table
    old_col_ids = list(data['collections']['tableEntities'][setting_tid]['columnIds'])
    for cid in old_col_ids:
        if cid in data['collections']['tableColumnEntities']:
            del data['collections']['tableColumnEntities'][cid]
            
    # Create new columns
    cols = [
        {"name": "id", "type": "INT", "comment": "고유 ID", "pk": True, "options": 11},
        {"name": "emp_no_prefix", "type": "VARCHAR(255)", "comment": "사번 접두사", "pk": False, "options": 0},
        {"name": "emp_no_year_format", "type": "VARCHAR(255)", "comment": "연도 표기 형식", "pk": False, "options": 0},
        {"name": "emp_no_length", "type": "INT", "comment": "사번 길이", "pk": False, "options": 0},
    ]
    
    new_col_ids = []
    for c in cols:
        cid = make_id()
        new_col_ids.append(cid)
        data['collections']['tableColumnEntities'][cid] = {
            "id": cid,
            "tableId": setting_tid,
            "name": c['name'],
            "comment": c['comment'],
            "dataType": c['type'],
            "default": "",
            "options": c['options'],
            "ui": {"keys": 1 if c['pk'] else 0, "widthName": 60, "widthComment": 60, "widthDataType": 60, "widthDefault": 60},
            "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
        }
        
    data['collections']['tableEntities'][setting_tid]['columnIds'] = new_col_ids
    data['collections']['tableEntities'][setting_tid]['seqColumnIds'] = new_col_ids
    
    with open('erp.vuerd.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print("Updated system_settings in erp.vuerd.json")
