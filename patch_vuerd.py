import json

def patch_vuerd():
    try:
        with open('erp.vuerd.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print("Error loading json:", e)
        return

    tables = data['canvas']['database']['tableIds']
    
    # We need to find the "employees" table and add the "attendance_policy_id" column.
    employees_table = None
    for table_id in tables:
        for t in data['table']['tables']:
            if t['id'] == table_id and t['name'] == 'employees':
                employees_table = t
                break
        if employees_table:
            break
            
    if not employees_table:
        print("Employees table not found.")
        return
        
    # Check if attendance_policy_id exists
    col_exists = any(c['name'] == 'attendance_policy_id' for c in employees_table['columns'])
    if not col_exists:
        import uuid
        new_col_id = str(uuid.uuid4())
        employees_table['columns'].append({
            "id": new_col_id,
            "name": "attendance_policy_id",
            "comment": "근태 기준 ID",
            "dataType": "INTEGER",
            "default": "",
            "option": {
                "autoIncrement": False,
                "primaryKey": False,
                "unique": False,
                "notNull": False
            },
            "ui": {
                "active": False,
                "pk": False,
                "fk": True,
                "pfk": False,
                "widthName": 130,
                "widthComment": 80,
                "widthDataType": 60,
                "widthDefault": 60
            }
        })
        print("Added attendance_policy_id to employees.")
    else:
        print("Column already exists.")

    with open('erp.vuerd.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("vuerd json patched successfully")

if __name__ == "__main__":
    patch_vuerd()
