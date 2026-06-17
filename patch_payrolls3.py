import re

def patch():
    try:
        with open('backend/payrolls_api.py', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(e)
        return

    # 1. Update PayrollBase
    base_str = """    employment_insurance: int = 0
    tardiness_deduction: int = 0
    payment_date: date"""
    new_base_str = """    employment_insurance: int = 0
    tardiness_deduction: int = 0
    calculation_basis: Optional[str] = None
    payment_date: date"""
    content = content.replace(base_str, new_base_str)

    # 2. Update PayrollUpdate
    update_str = """    employment_insurance: Optional[int] = None
    tardiness_deduction: Optional[int] = None
    payment_date: Optional[date] = None"""
    new_update_str = """    employment_insurance: Optional[int] = None
    tardiness_deduction: Optional[int] = None
    calculation_basis: Optional[str] = None
    payment_date: Optional[date] = None"""
    content = content.replace(update_str, new_update_str)

    # 3. Update get_my_payrolls and get_payrolls mapping
    get_my_str = """            employment_insurance=p.employment_insurance,
            tardiness_deduction=p.tardiness_deduction,
            net_pay=p.net_pay,"""
    new_get_my_str = """            employment_insurance=p.employment_insurance,
            tardiness_deduction=p.tardiness_deduction,
            calculation_basis=p.calculation_basis,
            net_pay=p.net_pay,"""
    content = content.replace(get_my_str, new_get_my_str)

    # 4. generate_payrolls calculation updates
    # Initialize basis_list
    init_str = """        hourly_wage = base / 209.0
        bonus_calc = 0.0
        tardy_minutes = 0.0
        tardy_deduction = 0"""
    new_init_str = """        hourly_wage = base / 209.0
        bonus_calc = 0.0
        tardy_minutes = 0.0
        tardy_deduction = 0
        basis_list = []"""
    content = content.replace(init_str, new_init_str)

    # Holiday bonus
    holi_str = """            if is_weekend:
                work_seconds = (att.check_out - att.check_in).total_seconds()
                work_hours = work_seconds / 3600.0
                if work_hours > 0:
                    if work_hours <= 8:
                        bonus_calc += work_hours * hourly_wage * holi_mult
                    else:
                        bonus_calc += 8 * hourly_wage * holi_mult
                        bonus_calc += (work_hours - 8) * hourly_wage * holi_over_mult"""
    new_holi_str = """            if is_weekend:
                work_seconds = (att.check_out - att.check_in).total_seconds()
                work_hours = work_seconds / 3600.0
                if work_hours > 0:
                    dt_str = att.work_date.strftime('%m-%d')
                    if work_hours <= 8:
                        amt = work_hours * hourly_wage * holi_mult
                        bonus_calc += amt
                        basis_list.append(f"[{dt_str}] 휴일근로 {work_hours:.1f}시간 (수당 {int(amt):,}원)")
                    else:
                        amt1 = 8 * hourly_wage * holi_mult
                        amt2 = (work_hours - 8) * hourly_wage * holi_over_mult
                        bonus_calc += (amt1 + amt2)
                        basis_list.append(f"[{dt_str}] 휴일근로 8시간 (수당 {int(amt1):,}원)")
                        basis_list.append(f"[{dt_str}] 휴일연장 {work_hours - 8:.1f}시간 (수당 {int(amt2):,}원)")"""
    content = content.replace(holi_str, new_holi_str)

    # Overtime bonus
    over_str = """                out_time = att.check_out.time()
                if out_time > work_end_time:
                    std_end_dt = datetime.datetime.combine(att.check_out.date(), work_end_time)
                    over_seconds = (att.check_out - std_end_dt).total_seconds()
                    if over_seconds > 0:
                        over_hours = over_seconds / 3600.0
                        bonus_calc += over_hours * hourly_wage * over_mult"""
    new_over_str = """                out_time = att.check_out.time()
                if out_time > work_end_time:
                    std_end_dt = datetime.datetime.combine(att.check_out.date(), work_end_time)
                    over_seconds = (att.check_out - std_end_dt).total_seconds()
                    if over_seconds > 0:
                        dt_str = att.work_date.strftime('%m-%d')
                        over_hours = over_seconds / 3600.0
                        amt = over_hours * hourly_wage * over_mult
                        bonus_calc += amt
                        basis_list.append(f"[{dt_str}] 연장근로 {over_hours:.1f}시간 (수당 {int(amt):,}원)")"""
    content = content.replace(over_str, new_over_str)

    # Tardiness basis
    tardy_str = """        if tardy_minutes > 0:
            if tardiness_penalty_type == 'DEDUCT_SALARY':
                tardy_deduction = int((tardy_minutes / 60.0) * hourly_wage)
            elif tardiness_penalty_type == 'DEDUCT_LEAVE':
                tardy_hours = tardy_minutes / 60.0
                leave_balance = db.query(LeaveBalance).filter(LeaveBalance.employee_id == emp.id, LeaveBalance.year == payment_year).first()
                if leave_balance and leave_balance.remaining_hours >= tardy_hours:
                    # 중복 차감 방지: 기존 급여 명세서가 없을 때만 연차 차감
                    if not existing:
                        leave_balance.remaining_hours -= tardy_hours
                        leave_balance.used_hours += tardy_hours
                else:
                    # 연차 부족 시 급여 차감으로 전환
                    tardy_deduction = int((tardy_minutes / 60.0) * hourly_wage)"""
    new_tardy_str = """        if tardy_minutes > 0:
            if tardiness_penalty_type == 'DEDUCT_SALARY':
                tardy_deduction = int((tardy_minutes / 60.0) * hourly_wage)
                basis_list.append(f"지각 누적 {int(tardy_minutes)}분 (차감액 {tardy_deduction:,}원)")
            elif tardiness_penalty_type == 'DEDUCT_LEAVE':
                tardy_hours = tardy_minutes / 60.0
                leave_balance = db.query(LeaveBalance).filter(LeaveBalance.employee_id == emp.id, LeaveBalance.year == payment_year).first()
                if leave_balance and leave_balance.remaining_hours >= tardy_hours:
                    # 중복 차감 방지: 기존 급여 명세서가 없을 때만 연차 차감
                    if not existing:
                        leave_balance.remaining_hours -= tardy_hours
                        leave_balance.used_hours += tardy_hours
                    basis_list.append(f"지각 누적 {int(tardy_minutes)}분 (연차 {tardy_hours:.1f}시간 자동차감)")
                else:
                    # 연차 부족 시 급여 차감으로 전환
                    tardy_deduction = int((tardy_minutes / 60.0) * hourly_wage)
                    basis_list.append(f"지각 누적 {int(tardy_minutes)}분 (연차부족 급여차감 {tardy_deduction:,}원)")"""
    content = content.replace(tardy_str, new_tardy_str)

    # Finally assignment
    assign_str = """        # 총 공제액 = 4대보험 + 지각 차감
        deductions = int((nps + nhis + ltci + ei) / 10) * 10 + tardy_deduction
        net_pay = total_salary - deductions
        
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
                net_pay=net_pay,
                payment_date=date.today()
            )"""
    new_assign_str = """        # 총 공제액 = 4대보험 + 지각 차감
        deductions = int((nps + nhis + ltci + ei) / 10) * 10 + tardy_deduction
        net_pay = total_salary - deductions
        
        calc_basis_str = "\\n".join(basis_list)
        
        if existing:
            existing.base_salary = base
            existing.bonus = bonus
            existing.deductions = deductions
            existing.national_pension = nps
            existing.health_insurance = nhis
            existing.long_term_care = ltci
            existing.employment_insurance = ei
            existing.tardiness_deduction = tardy_deduction
            existing.calculation_basis = calc_basis_str
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
                calculation_basis=calc_basis_str,
                net_pay=net_pay,
                payment_date=date.today()
            )"""
    content = content.replace(assign_str, new_assign_str)

    # Missing Optional import since we added calculation_basis: Optional[str]
    # But Optional is already imported at the top of the file `from typing import List, Optional`.
    with open('backend/payrolls_api.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched payrolls_api.py for calculation basis")

if __name__ == "__main__":
    patch()
