CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    manager_id INT,
    COMMENT ON TABLE departments IS '부서';
    COMMENT ON COLUMN departments.name IS '부서명';
    COMMENT ON COLUMN departments.manager_id IS '부서장 ID'
);

CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    level INT NOT NULL,
    COMMENT ON TABLE positions IS '직급';
    COMMENT ON COLUMN positions.title IS '직급명';
    COMMENT ON COLUMN positions.level IS '직급 레벨'
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    emp_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    hire_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT '재직',
    department_id INT REFERENCES departments(id),
    position_id INT REFERENCES positions(id),
    deleted_at TIMESTAMP NULL,
    COMMENT ON TABLE employees IS '사원';
    COMMENT ON COLUMN employees.emp_no IS '사번';
    COMMENT ON COLUMN employees.name IS '이름';
    COMMENT ON COLUMN employees.email IS '이메일';
    COMMENT ON COLUMN employees.password_hash IS '비밀번호';
    COMMENT ON COLUMN employees.hire_date IS '입사일';
    COMMENT ON COLUMN employees.status IS '상태';
    COMMENT ON COLUMN employees.department_id IS '부서 ID';
    COMMENT ON COLUMN employees.position_id IS '직급 ID';
    COMMENT ON COLUMN employees.deleted_at IS '삭제 일시 (Soft Delete)'
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


CREATE TABLE menus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL COMMENT '메뉴명',
    url VARCHAR(255) COMMENT '이동 경로',
    icon VARCHAR(100) COMMENT '아이콘 식별자',
    parent_id INT COMMENT '상위 메뉴 ID',
    sort_order INT DEFAULT 0 COMMENT '정렬 순서',
    FOREIGN KEY (parent_id) REFERENCES menus(id)


CREATE TABLE menus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL COMMENT '메뉴명',
    url VARCHAR(255) COMMENT '이동 경로',
    icon VARCHAR(100) COMMENT '아이콘 식별자',
    parent_id INT COMMENT '상위 메뉴 ID',
    sort_order INT DEFAULT 0 COMMENT '정렬 순서',
    FOREIGN KEY (parent_id) REFERENCES menus(id)
);

CREATE TABLE role_menus (
    role_id INT NOT NULL COMMENT '권한 ID',
    menu_id INT NOT NULL COMMENT '메뉴 ID',
    PRIMARY KEY (role_id, menu_id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (menu_id) REFERENCES menus(id)
);

CREATE TABLE common_code_groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(100) UNIQUE NOT NULL COMMENT '그룹 코드',
    name VARCHAR(255) NOT NULL COMMENT '그룹명',
    description TEXT COMMENT '설명'
);

CREATE TABLE common_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_code VARCHAR(100) NOT NULL COMMENT '그룹 코드',
    code VARCHAR(100) NOT NULL COMMENT '코드 값',
    name VARCHAR(255) NOT NULL COMMENT '이름(라벨)',
    sort_order INT DEFAULT 0 COMMENT '정렬 순서',
    is_active BOOLEAN DEFAULT TRUE COMMENT '사용 여부',
    FOREIGN KEY (group_code) REFERENCES common_code_groups(code)
);
