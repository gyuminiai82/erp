import sqlite3
conn = sqlite3.connect('erp.db')
cursor = conn.cursor()
cursor.execute("SELECT * FROM common_codes WHERE group_code='LEAVE_TYPE'")
print(cursor.fetchall())
