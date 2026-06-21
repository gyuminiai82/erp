import json
import uuid
import time

def make_id(): return uuid.uuid4().hex

data = json.load(open('erp.vuerd.json', encoding='utf-8'))

# Clean up broken string relations
rels_to_delete = []
for rid, r in list(data['collections']['relationshipEntities'].items()):
    if isinstance(r.get('relationshipType'), str):
        del data['collections']['relationshipEntities'][rid]
        if rid in data['doc']['relationshipIds']:
            data['doc']['relationshipIds'].remove(rid)

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
        "relationshipType": 4,
        "startRelationshipType": 1,
        "start": {"tableId": menus_tid, "columnIds": [menus_id_cid], "x": 0, "y": 0, "direction": 2},
        "end": {"tableId": menus_tid, "columnIds": [menus_parent_id_cid], "x": 0, "y": 0, "direction": 1},
        "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
    },
    {
        "id": make_id(),
        "identification": True,
        "relationshipType": 4,
        "startRelationshipType": 1,
        "start": {"tableId": roles_tid, "columnIds": [roles_id_cid], "x": 0, "y": 0, "direction": 2},
        "end": {"tableId": rm_tid, "columnIds": [rm_role_id_cid], "x": 0, "y": 0, "direction": 1},
        "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
    },
    {
        "id": make_id(),
        "identification": True,
        "relationshipType": 4,
        "startRelationshipType": 1,
        "start": {"tableId": menus_tid, "columnIds": [menus_id_cid], "x": 0, "y": 0, "direction": 2},
        "end": {"tableId": rm_tid, "columnIds": [rm_menu_id_cid], "x": 0, "y": 0, "direction": 1},
        "meta": {"updateAt": int(time.time()*1000), "createAt": int(time.time()*1000)}
    }
]

existing_relations = list(data['collections']['relationshipEntities'].values())
existing_ends = [r['end']['tableId'] for r in existing_relations]

already_has_rel = rm_tid in existing_ends

if not already_has_rel:
    for rel in relations:
        data['collections']['relationshipEntities'][rel['id']] = rel
        data['doc']['relationshipIds'].append(rel['id'])

    with open('erp.vuerd.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Fixed relationships successfully!")
else:
    print("Relationships already exist.")
