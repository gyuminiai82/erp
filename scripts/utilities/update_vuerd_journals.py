import json
import uuid

def generate_id():
    return uuid.uuid4().hex

with open('erp.vuerd.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# journal_entries table
je_table_id = generate_id()
col_je_id = generate_id()
col_je_date = generate_id()
col_je_type = generate_id()
col_je_desc = generate_id()
col_je_status = generate_id()
col_je_creator = generate_id()
col_je_approver = generate_id()

je_table = {
    "id": je_table_id,
    "name": "journal_entries",
    "comment": "전표 마스터",
    "columnIds": [col_je_id, col_je_date, col_je_type, col_je_desc, col_je_status, col_je_creator, col_je_approver],
    "seqColumnIds": [col_je_id, col_je_date, col_je_type, col_je_desc, col_je_status, col_je_creator, col_je_approver],
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

data['collections']['tableEntities'][je_table_id] = je_table
data['doc']['tableIds'].append(je_table_id)

columns_je = [
    (col_je_id, "id", "INT", "PK", True, False, ""),
    (col_je_date, "entry_date", "DATE", "전표일자", False, False, ""),
    (col_je_type, "entry_type", "VARCHAR(50)", "유형", False, False, ""),
    (col_je_desc, "description", "VARCHAR(255)", "적요", False, False, ""),
    (col_je_status, "status", "VARCHAR(50)", "상태", False, False, ""),
    (col_je_creator, "creator_id", "INT", "작성자", False, False, ""),
    (col_je_approver, "approver_id", "INT", "승인자", False, False, ""),
]

for col_id, name, dt, comment, is_pk, is_unique, default in columns_je:
    data['collections']['tableColumnEntities'][col_id] = {
        "id": col_id,
        "tableId": je_table_id,
        "name": name,
        "comment": comment,
        "dataType": dt,
        "default": default,
        "options": {
            "autoIncrement": is_pk,
            "primaryKey": is_pk,
            "unique": is_unique,
            "notNull": is_pk or name in ["entry_date"]
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

# journal_entry_lines table
jel_table_id = generate_id()
col_jel_id = generate_id()
col_jel_je_id = generate_id()
col_jel_acc_code = generate_id()
col_jel_acc_name = generate_id()
col_jel_debit = generate_id()
col_jel_credit = generate_id()
col_jel_desc = generate_id()

jel_table = {
    "id": jel_table_id,
    "name": "journal_entry_lines",
    "comment": "전표 라인",
    "columnIds": [col_jel_id, col_jel_je_id, col_jel_acc_code, col_jel_acc_name, col_jel_debit, col_jel_credit, col_jel_desc],
    "seqColumnIds": [col_jel_id, col_jel_je_id, col_jel_acc_code, col_jel_acc_name, col_jel_debit, col_jel_credit, col_jel_desc],
    "ui": {
        "x": 500,
        "y": 100,
        "zIndex": 2,
        "widthName": 150,
        "widthComment": 100,
        "color": ""
    },
    "meta": {
        "updateAt": 1781225924433,
        "createAt": 1781225924433
    }
}

data['collections']['tableEntities'][jel_table_id] = jel_table
data['doc']['tableIds'].append(jel_table_id)

columns_jel = [
    (col_jel_id, "id", "INT", "PK", True, False, ""),
    (col_jel_je_id, "journal_entry_id", "INT", "전표 마스터 FK", False, False, ""),
    (col_jel_acc_code, "account_code", "VARCHAR(50)", "계정 코드", False, False, ""),
    (col_jel_acc_name, "account_name", "VARCHAR(100)", "계정명", False, False, ""),
    (col_jel_debit, "debit", "FLOAT", "차변", False, False, ""),
    (col_jel_credit, "credit", "FLOAT", "대변", False, False, ""),
    (col_jel_desc, "description", "VARCHAR(255)", "적요", False, False, ""),
]

for col_id, name, dt, comment, is_pk, is_unique, default in columns_jel:
    data['collections']['tableColumnEntities'][col_id] = {
        "id": col_id,
        "tableId": jel_table_id,
        "name": name,
        "comment": comment,
        "dataType": dt,
        "default": default,
        "options": {
            "autoIncrement": is_pk,
            "primaryKey": is_pk,
            "unique": is_unique,
            "notNull": is_pk or name in ["journal_entry_id"]
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
        "tableId": je_table_id,
        "columnIds": [col_je_id],
        "x": 220,
        "y": 100,
        "direction": "right"
    },
    "end": {
        "tableId": jel_table_id,
        "columnIds": [col_jel_je_id],
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
