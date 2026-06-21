import json
import uuid
import time

def make_id(): return uuid.uuid4().hex

data = json.load(open('erp.vuerd.json', encoding='utf-8'))

def get_tid(name):
    for tid, t in data['collections']['tableEntities'].items():
        if t['name'] == name: return tid
    return None

def get_cid(tid, name):
    for cid, c in data['collections']['tableColumnEntities'].items():
        if c['tableId'] == tid and c['name'] == name: return cid
    return None

roles_tid = get_tid('roles')
roles_id_cid = get_cid(roles_tid, 'id')

menus_tid = get_tid('menus')
menus_id_cid = get_cid(menus_tid, 'id')
menus_parent_id_cid = get_cid(menus_tid, 'parent_id')

rm_tid = get_tid('role_menus')
rm_role_id_cid = get_cid(rm_tid, 'role_id')
rm_menu_id_cid = get_cid(rm_tid, 'menu_id')

relations = [
    {
        "id": make_id(),
        "identification": False,
        "relationshipType": "ZeroOneN",
        "startRelationshipType": "Ring",
        "start": {"tableId": menus_tid, "columnIds": [menus_id_cid], "x": 0, "y": 0, "direction": "top"},
        "end": {"tableId": menus_tid, "columnIds": [menus_parent_id_cid], "x": 0, "y": 0, "direction": "bottom"},
        "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
    },
    {
        "id": make_id(),
        "identification": True,
        "relationshipType": "ZeroOneN",
        "startRelationshipType": "Ring",
        "start": {"tableId": roles_tid, "columnIds": [roles_id_cid], "x": 0, "y": 0, "direction": "top"},
        "end": {"tableId": rm_tid, "columnIds": [rm_role_id_cid], "x": 0, "y": 0, "direction": "bottom"},
        "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
    },
    {
        "id": make_id(),
        "identification": True,
        "relationshipType": "ZeroOneN",
        "startRelationshipType": "Ring",
        "start": {"tableId": menus_tid, "columnIds": [menus_id_cid], "x": 0, "y": 0, "direction": "top"},
        "end": {"tableId": rm_tid, "columnIds": [rm_menu_id_cid], "x": 0, "y": 0, "direction": "bottom"},
        "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
    }
]

if 'relationshipEntities' not in data['collections']:
    data['collections']['relationshipEntities'] = {}

existing_relations = [r for r in data['collections']['relationshipEntities'].values()]
existing_ends = [r['end']['tableId'] for r in existing_relations]

already_has_rel = rm_tid in existing_ends

if not already_has_rel:
    for rel in relations:
        data['collections']['relationshipEntities'][rel['id']] = rel
        data['doc']['relationshipIds'].append(rel['id'])

    with open('erp.vuerd.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Injected relationships successfully!")
else:
    print("Relationships already exist.")
