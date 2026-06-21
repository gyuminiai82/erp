import json
import uuid

def generate_id():
    return str(uuid.uuid4())

def main():
    file_path = 'erp.vuerd.json'
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    canvas_data = data['canvas']
    tables = data['table']['tables']
    relationships = data['relationship']['relationships']
    
    # 1. Add journal_entries
    journal_entries_id = generate_id()
    journal_entries_table = {
        "id": journal_entries_id,
        "name": "journal_entries",
        "comment": "전표 마스터",
        "columns": [
            {
                "id": generate_id(),
                "name": "id",
                "comment": "PK",
                "dataType": "INT",
                "options": {"primaryKey": True, "notNull": True, "autoIncrement": True}
            },
            {
                "id": generate_id(),
                "name": "entry_date",
                "comment": "전표 일자",
                "dataType": "DATE",
                "options": {"notNull": True}
            },
            {
                "id": generate_id(),
                "name": "entry_type",
                "comment": "전표 유형 (대체, 입금, 출금)",
                "dataType": "VARCHAR",
                "options": {}
            },
            {
                "id": generate_id(),
                "name": "description",
                "comment": "적요",
                "dataType": "VARCHAR",
                "options": {}
            },
            {
                "id": generate_id(),
                "name": "status",
                "comment": "상태 (작성중, 승인요청, 승인완료)",
                "dataType": "VARCHAR",
                "options": {}
            },
            {
                "id": generate_id(),
                "name": "creator_id",
                "comment": "작성자 FK",
                "dataType": "INT",
                "options": {}
            },
            {
                "id": generate_id(),
                "name": "approver_id",
                "comment": "승인자 FK",
                "dataType": "INT",
                "options": {}
            },
            {
                "id": generate_id(),
                "name": "created_at",
                "comment": "생성일시",
                "dataType": "DATETIME",
                "options": {}
            },
            {
                "id": generate_id(),
                "name": "updated_at",
                "comment": "수정일시",
                "dataType": "DATETIME",
                "options": {}
            }
        ],
        "ui": {
            "active": False,
            "left": 100,
            "top": 100,
            "zIndex": 100,
            "widthName": 120,
            "widthComment": 120
        }
    }
    
    # 2. Add journal_entry_lines
    journal_entry_lines_id = generate_id()
    journal_entry_lines_table = {
        "id": journal_entry_lines_id,
        "name": "journal_entry_lines",
        "comment": "전표 라인",
        "columns": [
            {
                "id": generate_id(),
                "name": "id",
                "comment": "PK",
                "dataType": "INT",
                "options": {"primaryKey": True, "notNull": True, "autoIncrement": True}
            },
            {
                "id": generate_id(),
                "name": "journal_entry_id",
                "comment": "전표 마스터 FK",
                "dataType": "INT",
                "options": {"notNull": True}
            },
            {
                "id": generate_id(),
                "name": "account_code",
                "comment": "계정 코드",
                "dataType": "VARCHAR",
                "options": {}
            },
            {
                "id": generate_id(),
                "name": "account_name",
                "comment": "계정명",
                "dataType": "VARCHAR",
                "options": {}
            },
            {
                "id": generate_id(),
                "name": "debit",
                "comment": "차변 (Debit)",
                "dataType": "FLOAT",
                "options": {}
            },
            {
                "id": generate_id(),
                "name": "credit",
                "comment": "대변 (Credit)",
                "dataType": "FLOAT",
                "options": {}
            },
            {
                "id": generate_id(),
                "name": "description",
                "comment": "라인 적요",
                "dataType": "VARCHAR",
                "options": {}
            }
        ],
        "ui": {
            "active": False,
            "left": 400,
            "top": 100,
            "zIndex": 100,
            "widthName": 150,
            "widthComment": 120
        }
    }
    
    tables.extend([journal_entries_table, journal_entry_lines_table])
    
    # Find employees table to link FK
    employees_id = None
    for t in tables:
        if t['name'] == 'employees':
            employees_id = t['id']
            break
            
    # Relationships
    rel1 = {
        "id": generate_id(),
        "identification": False,
        "relationshipType": "ZeroOneN",
        "startRelationshipType": "Dash",
        "start": {
            "tableId": journal_entries_id,
            "columnIds": [journal_entries_table['columns'][0]['id']],
            "x": 400,
            "y": 100,
            "direction": "right"
        },
        "end": {
            "tableId": journal_entry_lines_id,
            "columnIds": [journal_entry_lines_table['columns'][1]['id']],
            "x": 400,
            "y": 100,
            "direction": "left"
        }
    }
    relationships.append(rel1)
    
    if employees_id:
        # Link employees to creator_id
        emp_pk = next((c['id'] for t in tables if t['id'] == employees_id for c in t['columns'] if c['name'] == 'id'), None)
        if emp_pk:
            rel2 = {
                "id": generate_id(),
                "identification": False,
                "relationshipType": "ZeroOneN",
                "startRelationshipType": "Dash",
                "start": {
                    "tableId": employees_id,
                    "columnIds": [emp_pk],
                    "x": 0, "y": 0, "direction": "bottom"
                },
                "end": {
                    "tableId": journal_entries_id,
                    "columnIds": [journal_entries_table['columns'][5]['id']], # creator_id
                    "x": 0, "y": 0, "direction": "top"
                }
            }
            relationships.append(rel2)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print("Injected journal entries to vuerd")

if __name__ == '__main__':
    main()
