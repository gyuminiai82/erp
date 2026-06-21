import json
import uuid
import time

def make_id():
    return uuid.uuid4().hex

data = json.load(open('erp.vuerd.json', encoding='utf-8'))

# Check if already added
if any(t.get('name') == 'menus' for t in data['collections']['tableEntities'].values()):
    print("Already added")
    exit(0)

menu_table_id = make_id()
menu_cols = [
    {"name": "id", "type": "INT", "comment": "메뉴 고유 ID", "pk": True, "options": 11},
    {"name": "name", "type": "VARCHAR(255)", "comment": "메뉴명", "pk": False, "options": 0},
    {"name": "url", "type": "VARCHAR(255)", "comment": "이동 경로", "pk": False, "options": 0},
    {"name": "icon", "type": "VARCHAR(100)", "comment": "아이콘 식별자", "pk": False, "options": 0},
    {"name": "parent_id", "type": "INT", "comment": "상위 메뉴 ID", "pk": False, "options": 0},
    {"name": "sort_order", "type": "INT", "comment": "정렬 순서", "pk": False, "options": 0},
]
menu_col_ids = []

for c in menu_cols:
    cid = make_id()
    menu_col_ids.append(cid)
    data['collections']['tableColumnEntities'][cid] = {
        "id": cid,
        "tableId": menu_table_id,
        "name": c['name'],
        "comment": c['comment'],
        "dataType": c['type'],
        "default": "",
        "options": c['options'],
        "ui": {"keys": 1 if c['pk'] else 0, "widthName": 60, "widthComment": 60, "widthDataType": 60, "widthDefault": 60},
        "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
    }

data['collections']['tableEntities'][menu_table_id] = {
    "id": menu_table_id,
    "name": "menus",
    "comment": "메뉴 (동적 사이드바)",
    "columnIds": menu_col_ids,
    "seqColumnIds": menu_col_ids,
    "ui": {"x": 500, "y": 800, "zIndex": 2, "widthName": 60, "widthComment": 60, "color": ""},
    "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
}
data['doc']['tableIds'].append(menu_table_id)

rm_table_id = make_id()
rm_cols = [
    {"name": "role_id", "type": "INT", "comment": "권한 ID", "pk": True, "options": 3},
    {"name": "menu_id", "type": "INT", "comment": "메뉴 ID", "pk": True, "options": 3},
]
rm_col_ids = []
for c in rm_cols:
    cid = make_id()
    rm_col_ids.append(cid)
    data['collections']['tableColumnEntities'][cid] = {
        "id": cid,
        "tableId": rm_table_id,
        "name": c['name'],
        "comment": c['comment'],
        "dataType": c['type'],
        "default": "",
        "options": c['options'],
        "ui": {"keys": 1, "widthName": 60, "widthComment": 60, "widthDataType": 60, "widthDefault": 60},
        "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
    }

data['collections']['tableEntities'][rm_table_id] = {
    "id": rm_table_id,
    "name": "role_menus",
    "comment": "권한별 메뉴 매핑",
    "columnIds": rm_col_ids,
    "seqColumnIds": rm_col_ids,
    "ui": {"x": 800, "y": 800, "zIndex": 2, "widthName": 60, "widthComment": 60, "color": ""},
    "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
}
data['doc']['tableIds'].append(rm_table_id)

with open('erp.vuerd.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Injected tables into erp.vuerd.json successfully!")

sql_append = """

CREATE TABLE menus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL COMMENT '메뉴명',
    url VARCHAR(255) COMMENT '이동 경로',
    icon VARCHAR(100) COMMENT '아이콘 식별자',
    parent_id INT COMMENT '상위 메뉴 ID',
    sort_order INT DEFAULT 0 COMMENT '정렬 순서',
    FOREIGN KEY (parent_id) REFERENCES menus(id)
);

CREATE TABLE role_menus (
    role_id INT NOT NULL COMMENT '권한 ID',
    menu_id INT NOT NULL COMMENT '메뉴 ID',
    PRIMARY KEY (role_id, menu_id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (menu_id) REFERENCES menus(id)
);
"""

with open('schema.sql', 'a', encoding='utf-8') as f:
    f.write(sql_append)

print("Appended schema to schema.sql successfully!")
