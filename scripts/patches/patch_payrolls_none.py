import re

def patch():
    try:
        with open('backend/payrolls_api.py', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(e)
        return

    # In get_my_payrolls
    old_my_str = """            deductions=p.deductions,
            national_pension=p.national_pension,
            health_insurance=p.health_insurance,
            long_term_care=p.long_term_care,
            employment_insurance=p.employment_insurance,
            tardiness_deduction=p.tardiness_deduction,
            calculation_basis=p.calculation_basis,"""
    new_my_str = """            deductions=p.deductions,
            national_pension=p.national_pension or 0,
            health_insurance=p.health_insurance or 0,
            long_term_care=p.long_term_care or 0,
            employment_insurance=p.employment_insurance or 0,
            tardiness_deduction=p.tardiness_deduction or 0,
            calculation_basis=p.calculation_basis,"""
    content = content.replace(old_my_str, new_my_str)

    # In get_payrolls
    old_all_str = """            deductions=p.deductions,
            national_pension=p.national_pension,
            health_insurance=p.health_insurance,
            long_term_care=p.long_term_care,
            employment_insurance=p.employment_insurance,
            tardiness_deduction=p.tardiness_deduction,
            calculation_basis=p.calculation_basis,"""
    new_all_str = """            deductions=p.deductions,
            national_pension=p.national_pension or 0,
            health_insurance=p.health_insurance or 0,
            long_term_care=p.long_term_care or 0,
            employment_insurance=p.employment_insurance or 0,
            tardiness_deduction=p.tardiness_deduction or 0,
            calculation_basis=p.calculation_basis,"""
    content = content.replace(old_all_str, new_all_str)

    # Also check if we have any other places (like create/update)?
    # create/update payload provides default 0, so it's fine.

    with open('backend/payrolls_api.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched payrolls_api.py for None values")

if __name__ == "__main__":
    patch()
