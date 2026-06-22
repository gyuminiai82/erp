import os
import glob

base_dir = r"d:\erp\app"
target_class = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    import re
    # We want to find any div with className containing "fixed inset-0"
    # and replace its classes.
    # Note: We must be careful not to break other classes or nested tags.
    # Pattern to match className="fixed inset-0 [something]"
    pattern = r'className="fixed inset-0 [^"]*"'
    
    def replacer(match):
        m = match.group(0)
        # Only replace if it's a modal overlay (contains bg-black)
        if "bg-black" in m:
            return f'className="{target_class}"'
        return m

    new_content = re.sub(pattern, replacer, content)

    if new_content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

print("Done!")
