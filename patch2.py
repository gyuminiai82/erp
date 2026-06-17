import re

def patch():
    try:
        with open('backend/employees.py', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(e)
        return

    # Add attendance_policy_id to EmployeeCreateRequest
    if 'attendance_policy_id' not in content.split('class EmployeeCreateRequest')[1].split('class ')[0]:
        content = content.replace(
            'base_salary: Optional[int] = None',
            'base_salary: Optional[int] = None\n    attendance_policy_id: Optional[int] = None',
            1  # only first occurrence which is in EmployeeCreateRequest
        )

    # In create_employee
    create_str = '''        base_salary=payload.base_salary'''
    new_create_str = create_str + ''',\n        attendance_policy_id=payload.attendance_policy_id'''
    if 'attendance_policy_id=payload.attendance_policy_id' not in content:
        content = content.replace(create_str, new_create_str)

    with open('backend/employees.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("employees.py patched successfully 2")

if __name__ == "__main__":
    patch()
