import re
import sys

def patch():
    try:
        with open('backend/employees.py', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(e)
        return

    # Add attendance_policy_id to schemas
    schema_replacements = [
        (r'(role: Optional\[str\] = None)', r'\1\n    attendance_policy_id: Optional[int] = None'),
        (r'(base_salary: Optional\[int\] = None\n    hire_date: Optional\[str\] = None)', r'\1\n    attendance_policy_id: Optional[int] = None'),
        (r'(status: Optional\[str\] = "재직")', r'\1\n    attendance_policy_id: Optional[int] = None'),
        (r'(base_salary: Optional\[int\] = None)', r'\1\n    attendance_policy_id: Optional[int] = None')
    ]
    
    # We will just do a simple replace
    content = content.replace(
        'role: Optional[str] = None',
        'role: Optional[str] = None\n    attendance_policy_id: Optional[int] = None'
    )
    # The above matches in EmployeeUpdateRequest and EmployeeInlineCreateRequest
    
    content = content.replace(
        'status: Optional[str] = "재직"',
        'status: Optional[str] = "재직"\n    attendance_policy_id: Optional[int] = None'
    ) # Matches EmployeeBulkCreateItem

    # We also need to add attendance_policy_id to the dictionary in get_employees
    result_dict = '''            "address": emp.address,
            "employment_type": emp.employment_type,
            "resident_num": crypto.decrypt_data(emp.resident_num),
            "profile_image_url": emp.profile_image_url,
            "base_salary": emp.base_salary'''
            
    new_result_dict = '''            "address": emp.address,
            "employment_type": emp.employment_type,
            "resident_num": crypto.decrypt_data(emp.resident_num),
            "profile_image_url": emp.profile_image_url,
            "base_salary": emp.base_salary,
            "attendance_policy_id": emp.attendance_policy_id'''
    
    content = content.replace(result_dict, new_result_dict)

    # In bulk update
    update_str = '''        if emp.base_salary is not None:
            db_emp.base_salary = emp.base_salary'''
    new_update_str = update_str + '''\n        if emp.attendance_policy_id is not None:
            db_emp.attendance_policy_id = emp.attendance_policy_id'''
    content = content.replace(update_str, new_update_str)

    # In bulk create
    create_str = '''            base_salary=emp.base_salary'''
    new_create_str = create_str + ''',\n            attendance_policy_id=emp.attendance_policy_id'''
    content = content.replace(create_str, new_create_str)

    with open('backend/employees.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("employees.py patched successfully")

if __name__ == "__main__":
    patch()
