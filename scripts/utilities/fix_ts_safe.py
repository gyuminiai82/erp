import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    orig = content

    # ColumnDef<SomeType> -> ColumnDef
    content = re.sub(r'ColumnDef<[^>]+>', 'ColumnDef', content)
    
    # header: -> headerName:
    content = re.sub(r'\bheader\s*:', 'headerName:', content)
    
    # render: -> renderCell:
    content = re.sub(r'\brender\s*:', 'renderCell:', content)
    
    # flex: X -> remove
    content = re.sub(r'\bflex\s*:\s*\d+,?\s*', '', content)
    
    # width: '150px' -> width: 150
    content = re.sub(r'\bwidth\s*:\s*\'(\d+)px\'', r'width: \1', content)
    content = re.sub(r'\bwidth\s*:\s*\"(\d+)px\"', r'width: \1', content)
    # width: 'auto' -> remove
    content = re.sub(r'\bwidth\s*:\s*\'auto\'\s*,?', '', content)
    
    # In orders/page.tsx: error TS2322: Type 'number' is not assignable to type 'never'.
    content = content.replace("item[field as keyof OrderItem] = parseInt(value) || 0;", "(item as any)[field] = parseInt(value) || 0;")
    
    # In inventory/page.tsx
    content = content.replace("item[field as keyof InventoryItem] = value;", "(item as any)[field] = value;")
    content = content.replace("item[field as keyof OrderItem] = value;", "(item as any)[field] = value;")
    
    # In taxes/withholding/page.tsx: error TS2304: Cannot find name 'int'.
    content = re.sub(r'\bint\b', 'number', content)

    # In orders/page.tsx: error TS7006: Parameter 'val' implicitly has an 'any' type.
    content = content.replace("renderCell: (val) =>", "renderCell: (val: any) =>")

    if content != orig:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")

for root, dirs, files in os.walk('app/erp'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            fix_file(os.path.join(root, file))
print('Done fixing TS issues')
