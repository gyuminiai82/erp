import re

def patch():
    try:
        with open('backend/payrolls_api.py', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(e)
        return

    # 1. Update PayrollBase
    base_str = """    bonus: int = 0
    deductions: int = 0
    payment_date: date"""
    new_base_str = """    bonus: int = 0
    deductions: int = 0
    national_pension: int = 0
    health_insurance: int = 0
    long_term_care: int = 0
    employment_insurance: int = 0
    tardiness_deduction: int = 0
    payment_date: date"""
    content = content.replace(base_str, new_base_str)

    # 2. Update PayrollUpdate
    update_str = """    bonus: Optional[int] = None
    deductions: Optional[int] = None
    payment_date: Optional[date] = None"""
    new_update_str = """    bonus: Optional[int] = None
    deductions: Optional[int] = None
    national_pension: Optional[int] = None
    health_insurance: Optional[int] = None
    long_term_care: Optional[int] = None
    employment_insurance: Optional[int] = None
    tardiness_deduction: Optional[int] = None
    payment_date: Optional[date] = None"""
    content = content.replace(update_str, new_update_str)

    # 3. Update get_my_payrolls response mapping
    get_my_str = """            base_salary=p.base_salary,
            bonus=p.bonus,
            deductions=p.deductions,"""
    new_get_my_str = """            base_salary=p.base_salary,
            bonus=p.bonus,
            deductions=p.deductions,
            national_pension=p.national_pension,
            health_insurance=p.health_insurance,
            long_term_care=p.long_term_care,
            employment_insurance=p.employment_insurance,
            tardiness_deduction=p.tardiness_deduction,"""
    # Replace all occurrences for both get_payrolls and get_my_payrolls
    content = content.replace(get_my_str, new_get_my_str)

    # 4. generate_payrolls assignment
    gen_str = """        existing = db.query(Payroll).filter(Payroll.employee_id == emp.id, Payroll.payment_month == payload.payment_month).first()
        if existing:
            existing.base_salary = base
            existing.bonus = bonus
            existing.deductions = deductions
            existing.net_pay = net_pay
        else:
            new_payroll = Payroll(
                employee_id=emp.id,
                payment_month=payload.payment_month,
                base_salary=base,
                bonus=bonus,
                deductions=deductions,
                net_pay=net_pay,"""
    new_gen_str = """        existing = db.query(Payroll).filter(Payroll.employee_id == emp.id, Payroll.payment_month == payload.payment_month).first()
        if existing:
            existing.base_salary = base
            existing.bonus = bonus
            existing.deductions = deductions
            existing.national_pension = nps
            existing.health_insurance = nhis
            existing.long_term_care = ltci
            existing.employment_insurance = ei
            existing.tardiness_deduction = tardy_deduction
            existing.net_pay = net_pay
        else:
            new_payroll = Payroll(
                employee_id=emp.id,
                payment_month=payload.payment_month,
                base_salary=base,
                bonus=bonus,
                deductions=deductions,
                national_pension=nps,
                health_insurance=nhis,
                long_term_care=ltci,
                employment_insurance=ei,
                tardiness_deduction=tardy_deduction,
                net_pay=net_pay,"""
    content = content.replace(gen_str, new_gen_str)

    with open('backend/payrolls_api.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched payrolls_api.py")

if __name__ == "__main__":
    patch()
