import json
import uuid

def generate_id():
    return uuid.uuid4().hex

with open('erp.vuerd.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# common_code_groups table
group_table_id = generate_id()
col_g_id = generate_id()
col_g_code = generate_id()
col_g_name = generate_id()
col_g_desc = generate_id()

group_table = {
    "id": group_table_id,
    "name": "common_code_groups",
    "comment": "공통 코드 그룹",
    "columnIds": [col_g_id, col_g_code, col_g_name, col_g_desc],
    "seqColumnIds": [col_g_id, col_g_code, col_g_name, col_g_desc],
    "ui": {
        "x": 100,
        "y": 100,
        "zIndex": 2,
        "widthName": 120,
        "widthComment": 100,
        "color": ""
    },
    "meta": {
        "updateAt": 1781225924433,
        "createAt": 1781225924433
    }
}

data['collections']['tableEntities'][group_table_id] = group_table
data['doc']['tableIds'].append(group_table_id)

columns = [
    (col_g_id, "id", "INT", "PK", True, False, ""),
    (col_g_code, "code", "VARCHAR(100)", "그룹 코드", False, True, ""),
    (col_g_name, "name", "VARCHAR(255)", "그룹명", False, False, ""),
    (col_g_desc, "description", "TEXT", "설명", False, False, "")
]

for col_id, name, dt, comment, is_pk, is_unique, default in columns:
    data['collections']['tableColumnEntities'][col_id] = {
        "id": col_id,
        "tableId": group_table_id,
        "name": name,
        "comment": comment,
        "dataType": dt,
        "default": default,
        "options": {
            "autoIncrement": is_pk,
            "primaryKey": is_pk,
            "unique": is_unique,
            "notNull": is_pk or is_unique or name == "name"
        },
        "ui": {
            "keys": 0,
            "widthName": 60,
            "widthComment": 60,
            "widthDataType": 60,
            "widthDefault": 60
        },
        "meta": {"updateAt": 1781225924433, "createAt": 1781225924433}
    }

# common_codes table
code_table_id = generate_id()
col_c_id = generate_id()
col_c_gcode = generate_id()
col_c_code = generate_id()
col_c_name = generate_id()
col_c_sort = generate_id()
col_c_active = generate_id()

code_table = {
    "id": code_table_id,
    "name": "common_codes",
    "comment": "공통 코드",
    "columnIds": [col_c_id, col_c_gcode, col_c_code, col_c_name, col_c_sort, col_c_active],
    "seqColumnIds": [col_c_id, col_c_gcode, col_c_code, col_c_name, col_c_sort, col_c_active],
    "ui": {
        "x": 500,
        "y": 100,
        "zIndex": 2,
        "widthName": 120,
        "widthComment": 100,
        "color": ""
    },
    "meta": {
        "updateAt": 1781225924433,
        "createAt": 1781225924433
    }
}

data['collections']['tableEntities'][code_table_id] = code_table
data['doc']['tableIds'].append(code_table_id)

columns_code = [
    (col_c_id, "id", "INT", "PK", True, False, ""),
    (col_c_gcode, "group_code", "VARCHAR(100)", "그룹 코드", False, False, ""),
    (col_c_code, "code", "VARCHAR(100)", "코드 값", False, False, ""),
    (col_c_name, "name", "VARCHAR(255)", "이름", False, False, ""),
    (col_c_sort, "sort_order", "INT", "정렬", False, False, "0"),
    (col_c_active, "is_active", "BOOLEAN", "사용", False, False, "TRUE"),
]

for col_id, name, dt, comment, is_pk, is_unique, default in columns_code:
    data['collections']['tableColumnEntities'][col_id] = {
        "id": col_id,
        "tableId": code_table_id,
        "name": name,
        "comment": comment,
        "dataType": dt,
        "default": default,
        "options": {
            "autoIncrement": is_pk,
            "primaryKey": is_pk,
            "unique": is_unique,
            "notNull": is_pk or is_unique or name in ["group_code", "code", "name"]
        },
        "ui": {
            "keys": 0,
            "widthName": 60,
            "widthComment": 60,
            "widthDataType": 60,
            "widthDefault": 60
        },
        "meta": {"updateAt": 1781225924433, "createAt": 1781225924433}
    }

# relationship
rel_id = generate_id()
data['collections']['relationshipEntities'][rel_id] = {
    "id": rel_id,
    "identification": False,
    "relationshipType": "ZeroOneN",
    "startRelationshipType": "Dash",
    "start": {
        "tableId": group_table_id,
        "columnIds": [col_g_code],
        "x": 220,
        "y": 100,
        "direction": "right"
    },
    "end": {
        "tableId": code_table_id,
        "columnIds": [col_c_gcode],
        "x": 500,
        "y": 100,
        "direction": "left"
    },
    "meta": {"updateAt": 1781225924433, "createAt": 1781225924433}
}
data['doc']['relationshipIds'].append(rel_id)

with open('erp.vuerd.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("vuerd.json updated successfully")
