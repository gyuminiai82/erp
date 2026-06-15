from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Boolean, Time, func, Float, Text
from sqlalchemy.orm import relationship
from database import Base

class CommonCodeGroup(Base):
    __tablename__ = "common_code_groups"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True) # e.g. 'EMP_STATUS'
    name = Column(String) # e.g. '고용 상태'
    description = Column(String, nullable=True)

class CommonCode(Base):
    __tablename__ = "common_codes"

    id = Column(Integer, primary_key=True, index=True)
    group_code = Column(String, ForeignKey("common_code_groups.code"), index=True) # e.g. 'EMP_STATUS'
    code = Column(String, index=True) # e.g. '재직', '정규직'
    name = Column(String) # e.g. '재직', '정규직'
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    sort_order = Column(Integer, default=0)

    # Relationship (사원 목록)
    employees = relationship("Employee", foreign_keys="Employee.department_id", back_populates="department")
    # 부서장 관계는 파일 하단에서 정의

class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    level = Column(Integer, default=10)
    description = Column(String)
    sort_order = Column(Integer, default=0)

    employees = relationship("Employee", back_populates="position")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    emp_no = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String, nullable=True)
    hire_date = Column(Date)
    status = Column(String, default="재직") # 재직, 휴직, 퇴사 등
    is_active = Column(Boolean, default=True)
    must_change_password = Column(Boolean, default=True)
    base_salary = Column(Integer, default=0) # 기본급
    
    phone = Column(String, nullable=True)
    birth_date = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    address = Column(String, nullable=True)
    employment_type = Column(String, default="정규직")
    resident_num = Column(String, nullable=True)
    profile_image_url = Column(String, nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    
    department_id = Column(Integer, ForeignKey("departments.id"))
    position_id = Column(Integer, ForeignKey("positions.id"), nullable=True)

    department = relationship("Department", foreign_keys=[department_id], back_populates="employees")
    position = relationship("Position", back_populates="employees")
    
    attendances = relationship("Attendance", back_populates="employee")
    leave_requests = relationship("LeaveRequest", foreign_keys="LeaveRequest.employee_id", back_populates="employee")
    leave_approvals = relationship("LeaveRequest", foreign_keys="LeaveRequest.approver_id", back_populates="approver")
    
    payrolls = relationship("Payroll", back_populates="employee")
    roles = relationship("EmployeeRole", back_populates="employee")

class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    work_date = Column(Date)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    status = Column(String) # 정상, 지각, 조퇴, 결근 등

    employee = relationship("Employee", back_populates="attendances")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    start_date = Column(Date)
    end_date = Column(Date)
    leave_type = Column(String) # 연차, 반차, 병가 등
    status = Column(String, default="대기") # 대기, 승인, 반려
    reason = Column(String)
    approver_id = Column(Integer, ForeignKey("employees.id"), nullable=True)

    employee = relationship("Employee", foreign_keys=[employee_id], back_populates="leave_requests")
    approver = relationship("Employee", foreign_keys=[approver_id])

class Payroll(Base):
    __tablename__ = "payrolls"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    payment_month = Column(String) # YYYY-MM 형태
    base_salary = Column(Integer)
    bonus = Column(Integer, default=0)
    deductions = Column(Integer, default=0)
    net_pay = Column(Integer)
    payment_date = Column(Date)

    employee = relationship("Employee", back_populates="payrolls")

# Department -> Employee (부서장) 관계 명시
Department.manager = relationship("Employee", foreign_keys=[Department.manager_id])

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)
    sort_order = Column(Integer, default=0)

    permissions = relationship("RolePermission", back_populates="role")
    employees = relationship("EmployeeRole", back_populates="role")
    menus = relationship("RoleMenu", back_populates="role")

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)

    roles = relationship("RolePermission", back_populates="permission")

class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)
    permission_id = Column(Integer, ForeignKey("permissions.id"), primary_key=True)

    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="roles")

class EmployeeRole(Base):
    __tablename__ = "employee_roles"

    employee_id = Column(Integer, ForeignKey("employees.id"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)

    employee = relationship("Employee", back_populates="roles")
    role = relationship("Role", back_populates="employees")

class SystemAdmin(Base):
    __tablename__ = "system_admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime)
    last_login = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

class Menu(Base):
    __tablename__ = "menus"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    url = Column(String, nullable=True)
    icon = Column(String, nullable=True)
    parent_id = Column(Integer, ForeignKey("menus.id"), nullable=True)
    sort_order = Column(Integer, default=0)

    roles = relationship("RoleMenu", back_populates="menu")
    parent = relationship("Menu", remote_side=[id], backref="children")

class RoleMenu(Base):
    __tablename__ = "role_menus"

    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)
    menu_id = Column(Integer, ForeignKey("menus.id"), primary_key=True)
    
    can_read = Column(Boolean, default=True)
    can_write = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)
    can_print = Column(Boolean, default=False)

    role = relationship("Role", back_populates="menus")
    menu = relationship("Menu", back_populates="roles")

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    emp_no_prefix = Column(String, default="EMP")
    emp_no_year_format = Column(String, default="YY")
    emp_no_length = Column(Integer, default=3)
    
    # 신규 추가: 세분화된 급여 및 보험료율 설정
    national_pension_rate = Column(Float, default=0.045)        # 국민연금 4.5%
    health_insurance_rate = Column(Float, default=0.03545)      # 건강보험 3.545%
    long_term_care_rate = Column(Float, default=0.1295)         # 장기요양보험 (건보료의 12.95%)
    employment_insurance_rate = Column(Float, default=0.009)    # 고용보험 0.9%
    overtime_multiplier = Column(Float, default=1.5)            # 초과근무 배수

class CompanyInfo(Base):
    __tablename__ = "company_info"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    registration_number = Column(String)
    representative = Column(String)
    address = Column(String)
    contact_email = Column(String)
    contact_phone = Column(String)
    logo_url = Column(String)

class AttendancePolicy(Base):
    __tablename__ = "attendance_policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    policy_type = Column(String, default="FIXED")
    work_start_time = Column(Time, nullable=True)
    work_end_time = Column(Time, nullable=True)
    break_start_time = Column(Time, nullable=True)
    break_end_time = Column(Time, nullable=True)
    break_time_mins = Column(Integer, default=60)
    core_time_start = Column(Time, nullable=True)
    core_time_end = Column(Time, nullable=True)
    required_work_hours = Column(Integer, default=8)
    is_default = Column(Boolean, default=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=func.now(), index=True)
    event_title = Column(String, index=True)
    event_desc = Column(String)
    
    # 기존 식별자
    user_email = Column(String, index=True, nullable=True)
    ip_address = Column(String, nullable=True)
    severity = Column(String, index=True, default="INFO")  # INFO, WARNING, HIGH, SYSTEM
    
    # 추가된 식별자 및 페이로드
    user_id = Column(Integer, nullable=True, index=True)
    emp_no = Column(String, nullable=True, index=True)
    user_name = Column(String, nullable=True)
    
    target_resource = Column(String, nullable=True, index=True)
    action_type = Column(String, nullable=True, index=True)
    payload = Column(Text, nullable=True)  # JSON 형태의 문자열 저장

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    type = Column(String) # 부서이동, 승진, 강등, 등
    before_dept_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    after_dept_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    before_pos_id = Column(Integer, ForeignKey("positions.id"), nullable=True)
    after_pos_id = Column(Integer, ForeignKey("positions.id"), nullable=True)
    appointment_date = Column(Date)
    status = Column(String, default="대기") # 대기, 승인, 반려
    memo = Column(String, nullable=True)

    employee = relationship("Employee", foreign_keys=[employee_id])
    before_dept = relationship("Department", foreign_keys=[before_dept_id])
    after_dept = relationship("Department", foreign_keys=[after_dept_id])
    before_pos = relationship("Position", foreign_keys=[before_pos_id])
    after_pos = relationship("Position", foreign_keys=[after_pos_id])

class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    year = Column(Integer, nullable=False)
    total_days = Column(Float, default=0.0)
    used_days = Column(Float, default=0.0)

    employee = relationship("Employee")
