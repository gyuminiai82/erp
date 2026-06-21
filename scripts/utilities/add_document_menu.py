import psycopg2

try:
    conn = psycopg2.connect("postgresql://postgres:postgresql@localhost/erp")
    c = conn.cursor()
    
    # Check if menu already exists
    c.execute("SELECT id FROM menus WHERE url = '/erp/documents'")
    result = c.fetchone()
    if not result:
        # Get parent_id for "인사/조직 관리" (id 262)
        c.execute("SELECT id FROM menus WHERE name LIKE '%인사/조직%' LIMIT 1")
        parent_result = c.fetchone()
        parent_id = parent_result[0] if parent_result else 262
        
        # Get next available menu id (or just let the sequence handle it, but wait, id might not be serial in standard way, it's safer to use default if sequence is set up. Let's try INSERT without ID)
        c.execute("INSERT INTO menus (name, url, icon, parent_id, sort_order) VALUES ('증명서 발급 관리', '/erp/documents', 'FileText', %s, 100) RETURNING id", (parent_id,))
        new_menu_id = c.fetchone()[0]
        
        # Assign permission to admin (role_id 1)
        c.execute("INSERT INTO role_menus (role_id, menu_id, can_read, can_write, can_delete) VALUES (1, %s, true, true, true)", (new_menu_id,))
        
        # Also assign to HR manager or other roles if they exist. Let's just assign to all roles with can_read=true
        c.execute("SELECT id FROM roles WHERE id != 1")
        roles = c.fetchall()
        for role in roles:
            try:
                c.execute("INSERT INTO role_menus (role_id, menu_id, can_read, can_write, can_delete) VALUES (%s, %s, true, false, false)", (role[0], new_menu_id))
            except:
                pass
                
        conn.commit()
        print("Menu '증명서 발급 관리' added successfully.")
    else:
        print("Menu already exists.")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals() and conn:
        conn.close()
