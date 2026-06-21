import json
import uuid
import time

def make_id():
    return uuid.uuid4().hex

data = json.load(open('erp.vuerd.json', encoding='utf-8'))

# Helper to check if table exists
def table_exists(name):
    return any(t.get('name') == name for t in data['collections']['tableEntities'].values())

new_tables = []

if not table_exists("company_info"):
    new_tables.append({
        "name": "company_info",
        "comment": "회사 기본정보",
        "ui": {"x": 50, "y": 1000},
        "cols": [
            {"name": "id", "type": "INT", "comment": "ID", "pk": True, "options": 11},
            {"name": "name", "type": "VARCHAR(255)", "comment": "회사명", "pk": False, "options": 8},
            {"name": "registration_number", "type": "VARCHAR(255)", "comment": "사업자번호", "pk": False, "options": 0},
            {"name": "representative", "type": "VARCHAR(255)", "comment": "대표자명", "pk": False, "options": 0},
            {"name": "address", "type": "VARCHAR(255)", "comment": "주소", "pk": False, "options": 0},
            {"name": "contact_email", "type": "VARCHAR(255)", "comment": "대표 이메일", "pk": False, "options": 0},
            {"name": "contact_phone", "type": "VARCHAR(255)", "comment": "대표 전화", "pk": False, "options": 0},
            {"name": "logo_url", "type": "VARCHAR(255)", "comment": "로고 경로", "pk": False, "options": 0},
        ]
    })

if not table_exists("attendance_policies"):
    new_tables.append({
        "name": "attendance_policies",
        "comment": "근태 기준 정책",
        "ui": {"x": 300, "y": 1000},
        "cols": [
            {"name": "id", "type": "INT", "comment": "ID", "pk": True, "options": 11},
            {"name": "name", "type": "VARCHAR(255)", "comment": "정책명", "pk": False, "options": 8},
            {"name": "work_start_time", "type": "TIME", "comment": "출근시간", "pk": False, "options": 0},
            {"name": "work_end_time", "type": "TIME", "comment": "퇴근시간", "pk": False, "options": 0},
            {"name": "break_start_time", "type": "TIME", "comment": "휴게시작", "pk": False, "options": 0},
            {"name": "break_end_time", "type": "TIME", "comment": "휴게종료", "pk": False, "options": 0},
            {"name": "late_threshold_mins", "type": "INT", "comment": "지각 허용분", "pk": False, "options": 0},
            {"name": "is_default", "type": "BOOLEAN", "comment": "기본정책", "pk": False, "options": 0},
        ]
    })

positions_table_id = None
positions_id_col_id = None

if not table_exists("positions"):
    positions_table_id = make_id()
    positions_id_col_id = make_id()
    new_tables.append({
        "id": positions_table_id,
        "name": "positions",
        "comment": "직급 체계",
        "ui": {"x": 550, "y": 1000},
        "cols": [
            {"id": positions_id_col_id, "name": "id", "type": "INT", "comment": "ID", "pk": True, "options": 11},
            {"name": "name", "type": "VARCHAR(255)", "comment": "직급명", "pk": False, "options": 10},
            {"name": "level", "type": "INT", "comment": "레벨", "pk": False, "options": 0},
            {"name": "description", "type": "VARCHAR(255)", "comment": "설명", "pk": False, "options": 0},
        ]
    })
else:
    for t in data['collections']['tableEntities'].values():
        if t.get('name') == 'positions':
            positions_table_id = t['id']
            for cid in t['columnIds']:
                col = data['collections']['tableColumnEntities'][cid]
                if col['name'] == 'id':
                    positions_id_col_id = cid
                    break
            break

for tbl in new_tables:
    tid = tbl.get("id", make_id())
    if tbl["name"] == "positions":
        positions_table_id = tid
    col_ids = []
    for c in tbl["cols"]:
        cid = c.get("id", make_id())
        if tbl["name"] == "positions" and c["name"] == "id":
            positions_id_col_id = cid
            
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
        "name": tbl["name"],
        "comment": tbl["comment"],
        "columnIds": col_ids,
        "seqColumnIds": col_ids,
        "ui": {"x": tbl["ui"]["x"], "y": tbl["ui"]["y"], "zIndex": 2, "widthName": 60, "widthComment": 60, "color": ""},
        "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
    }
    data['doc']['tableIds'].append(tid)

emp_table_id = None
for t in data['collections']['tableEntities'].values():
    if t.get('name') == 'employees':
        emp_table_id = t['id']
        break

if emp_table_id and positions_table_id:
    emp_cols = [data['collections']['tableColumnEntities'][cid] for cid in data['collections']['tableEntities'][emp_table_id]['columnIds']]
    pos_col_id = None
    for c in emp_cols:
        if c.get('name') == 'position_id':
            pos_col_id = c['id']
            break
            
    if not pos_col_id:
        pos_col_id = make_id()
        data['collections']['tableColumnEntities'][pos_col_id] = {
            "id": pos_col_id,
            "tableId": emp_table_id,
            "name": "position_id",
            "comment": "직급 ID",
            "dataType": "INT",
            "default": "",
            "options": 0,
            "ui": {"keys": 2, "widthName": 60, "widthComment": 60, "widthDataType": 60, "widthDefault": 60},
            "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
        }
        data['collections']['tableEntities'][emp_table_id]['columnIds'].append(pos_col_id)
        data['collections']['tableEntities'][emp_table_id]['seqColumnIds'].append(pos_col_id)
        
    # Check if relation already exists
    rel_exists = False
    for r in data['collections']['relationshipEntities'].values():
        if r['start']['tableId'] == positions_table_id and r['end']['tableId'] == emp_table_id and pos_col_id in r['end']['columnIds']:
            rel_exists = True
            break
            
    if not rel_exists:
        rel_id = make_id()
        data['collections']['relationshipEntities'][rel_id] = {
            "id": rel_id,
            "identification": False,
            "relationshipType": "ZeroOneN",
            "startRelationshipType": "Dash",
            "start": {
                "tableId": positions_table_id,
                "columnIds": [positions_id_col_id],
                "x": 0, "y": 0, "direction": "top"
            },
            "end": {
                "tableId": emp_table_id,
                "columnIds": [pos_col_id],
                "x": 0, "y": 0, "direction": "bottom"
            },
            "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
        }
        if 'relationshipIds' not in data['doc']:
            data['doc']['relationshipIds'] = []
        data['doc']['relationshipIds'].append(rel_id)

with open('erp.vuerd.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Injected 3 tables and 1 relation successfully!")
