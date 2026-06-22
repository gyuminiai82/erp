import os
import re

base_dir = r"d:\erp\app"

# We will replace "등록" with "추가" carefully.
# Exclude list:
# "사업자등록", "주민등록", "법인등록"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # First, mask out the exceptions
    # We will temporarily replace them with placeholders
    exceptions = [
        ("사업자등록", "사업자[TEMP_REG]"),
        ("주민등록", "주민[TEMP_REG]"),
        ("법인등록", "법인[TEMP_REG]"),
        ("사업자 등록", "사업자 [TEMP_REG]"),
        ("주민 등록", "주민 [TEMP_REG]"),
        ("법인 등록", "법인 [TEMP_REG]"),
    ]

    for ex_old, ex_new in exceptions:
        content = content.replace(ex_old, ex_new)

    # Now replace "등록" with "추가"
    content = content.replace("등록", "추가")

    # Now restore the exceptions
    for ex_old, ex_new in exceptions:
        # Revert [TEMP_REG] back to 등록
        content = content.replace(ex_new, ex_old)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

print("Done!")
