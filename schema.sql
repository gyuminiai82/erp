CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL COMMENT '부서명',
    manager_id INT COMMENT '부서장 ID'
);

CREATE TABLE positions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL COMMENT '직급명',
    level INT NOT NULL COMMENT '직급 레벨'
);

CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    emp_no VARCHAR(50) UNIQUE NOT NULL COMMENT '사번',
    name VARCHAR(100) NOT NULL COMMENT '이름',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT '이메일',
    password_hash VARCHAR(255) NOT NULL COMMENT '비밀번호',
    hire_date DATE NOT NULL COMMENT '입사일',
    status VARCHAR(50) DEFAULT '재직' COMMENT '상태',
    department_id INT COMMENT '부서 ID',
    position_id INT COMMENT '직급 ID',
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (position_id) REFERENCES positions(id)
);

ALTER TABLE departments ADD FOREIGN KEY (manager_id) REFERENCES employees(id);

CREATE TABLE attendances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL COMMENT '사원 ID',
    work_date DATE NOT NULL COMMENT '근무일자',
    check_in DATETIME COMMENT '출근시간',
    check_out DATETIME COMMENT '퇴근시간',
    status VARCHAR(50) COMMENT '상태',
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE leave_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL COMMENT '사원 ID',
    start_date DATE NOT NULL COMMENT '휴가 시작일',
    end_date DATE NOT NULL COMMENT '휴가 종료일',
    leave_type VARCHAR(50) NOT NULL COMMENT '휴가 종류',
    status VARCHAR(50) DEFAULT '대기' COMMENT '결재 상태',
    reason TEXT COMMENT '사유',
    approver_id INT COMMENT '결재자 ID',
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (approver_id) REFERENCES employees(id)
);

CREATE TABLE payrolls (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL COMMENT '사원 ID',
    payment_month VARCHAR(7) NOT NULL COMMENT '지급월(YYYY-MM)',
    base_salary INT NOT NULL COMMENT '기본급',
    bonus INT DEFAULT 0 COMMENT '상여금',
    deductions INT DEFAULT 0 COMMENT '공제액',
    net_pay INT NOT NULL COMMENT '실수령액',
    payment_date DATE NOT NULL COMMENT '지급일',
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL COMMENT '역할명',
    description TEXT COMMENT '역할 설명'
);

CREATE TABLE permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL COMMENT '권한명',
    description TEXT COMMENT '권한 설명'
);

CREATE TABLE role_permissions (
    role_id INT NOT NULL COMMENT '역할 ID',
    permission_id INT NOT NULL COMMENT '권한 ID',
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

CREATE TABLE employee_roles (
    employee_id INT NOT NULL COMMENT '사원 ID',
    role_id INT NOT NULL COMMENT '역할 ID',
    PRIMARY KEY (employee_id, role_id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE system_admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL COMMENT '관리자 아이디',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT '관리자 이메일',
    password_hash VARCHAR(255) NOT NULL COMMENT '비밀번호',
    created_at DATETIME COMMENT '생성일자',
    last_login DATETIME COMMENT '최근 로그인',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부'
);
