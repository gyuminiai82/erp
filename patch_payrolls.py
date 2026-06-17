import re

def patch():
    try:
        with open('backend/payrolls_api.py', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(e)
        return

    # 1. Imports
    import_str = "from models import SystemSetting, Attendance, AttendancePolicy"
    new_import_str = "from models import SystemSetting, Attendance, AttendancePolicy, LeaveBalance"
    content = content.replace(import_str, new_import_str)

    # 2. Tardiness config
    tardiness_config_str = "    policy = db.query(AttendancePolicy).filter(AttendancePolicy.is_default == True).first()"
    new_tardiness_config_str = """    tardiness_penalty_type = getattr(setting, 'tardiness_penalty_type', 'NONE') if setting else 'NONE'
    tardiness_grace_period = getattr(setting, 'tardiness_grace_period', 0) if setting else 0
    
    default_policy = db.query(AttendancePolicy).filter(AttendancePolicy.is_default == True).first()"""
    content = content.replace(tardiness_config_str, new_tardiness_config_str)

    # 3. Inside employee loop - Policy selection and tardiness calculation initialization
    # We find where bonus_calc is initialized
    bonus_calc_str = """        bonus_calc = 0.0
        
        # 3. 근태 정보 조회하여 수당 계산"""
    
    new_bonus_calc_str = """        bonus_calc = 0.0
        tardy_minutes = 0.0
        tardy_deduction = 0
        
        # 사원 맞춤 근태 기준 조회
        emp_policy = None
        if getattr(emp, 'attendance_policy_id', None):
            emp_policy = db.query(AttendancePolicy).filter(AttendancePolicy.id == emp.attendance_policy_id).first()
        policy = emp_policy if emp_policy else default_policy
        
        work_start_time = policy.work_start_time if policy and policy.work_start_time else datetime.time(9, 0)
        work_end_time = policy.work_end_time if policy and policy.work_end_time else datetime.time(18, 0)
        
        # 3. 근태 정보 조회하여 수당 계산"""
    content = content.replace(bonus_calc_str, new_bonus_calc_str)

    # We need to remove the old work_end_time definition that was outside the loop
    old_work_end_time_str = "    work_end_time = policy.work_end_time if policy and policy.work_end_time else datetime.time(18, 0)"
    content = content.replace(old_work_end_time_str, "")

    # 4. Check in logic inside attendance loop
    check_in_str = """            else:
                out_time = att.check_out.time()"""
    new_check_in_str = """            else:
                in_time = att.check_in.time()
                std_start_dt = datetime.datetime.combine(att.check_in.date(), work_start_time)
                grace_td = datetime.timedelta(minutes=tardiness_grace_period)
                allowed_start_dt = std_start_dt + grace_td
                
                if att.check_in > allowed_start_dt:
                    # 지각 발생 (기준 시간 초과분 전체)
                    tardy_seconds = (att.check_in - std_start_dt).total_seconds()
                    tardy_minutes += tardy_seconds / 60.0
                    
                out_time = att.check_out.time()"""
    content = content.replace(check_in_str, new_check_in_str)

    # 5. Deduction calculation
    deduction_str = """        # 4대보험 공제 계산 (세전 총액 기준)
        nps = int(total_salary * nps_rate)
        nhis = int(total_salary * nhis_rate)
        ltci = int(nhis * ltci_rate)
        ei = int(total_salary * ei_rate)
        
        deductions = int((nps + nhis + ltci + ei) / 10) * 10
        net_pay = total_salary - deductions"""
    
    new_deduction_str = """        # 지각 차감 처리
        existing = db.query(Payroll).filter(Payroll.employee_id == emp.id, Payroll.payment_month == payload.payment_month).first()
        
        if tardy_minutes > 0:
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
                    tardy_deduction = int((tardy_minutes / 60.0) * hourly_wage)

        # 4대보험 공제 계산 (세전 총액 기준)
        nps = int(total_salary * nps_rate)
        nhis = int(total_salary * nhis_rate)
        ltci = int(nhis * ltci_rate)
        ei = int(total_salary * ei_rate)
        
        # 총 공제액 = 4대보험 + 지각 차감
        deductions = int((nps + nhis + ltci + ei) / 10) * 10 + tardy_deduction
        net_pay = total_salary - deductions"""
    content = content.replace(deduction_str, new_deduction_str)

    # 6. Check the existing block
    existing_str = """        existing = db.query(Payroll).filter(Payroll.employee_id == emp.id, Payroll.payment_month == payload.payment_month).first()
        if existing:"""
    # Wait, we already defined existing. So we need to remove it from here.
    content = content.replace(existing_str, "        if existing:")

    with open('backend/payrolls_api.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched payrolls_api.py")

if __name__ == "__main__":
    patch()
