import re

def patch():
    try:
        with open('app/erp/employees/page.tsx', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print("Error opening file:", e)
        return

    # 1. Add attendancePolicies state
    state_str = "const [empStatuses, setEmpStatuses] = useState<any[]>([]);"
    new_state_str = state_str + "\n  const [attendancePolicies, setAttendancePolicies] = useState<any[]>([]);"
    if 'setAttendancePolicies' not in content:
        content = content.replace(state_str, new_state_str)

    # 2. Update fetchData
    fetch_str = '''        fetch("/api/common-codes?group=EMP_STATUS")'''
    new_fetch_str = fetch_str + ''',\n        fetch("/api/attendance-policies")'''
    if 'fetch("/api/attendance-policies")' not in content:
        content = content.replace(fetch_str, new_fetch_str)
        
    promise_str = '''const [empRes, deptRes, posRes, typeRes, statusRes] = await Promise.all(['''
    new_promise_str = '''const [empRes, deptRes, posRes, typeRes, statusRes, policyRes] = await Promise.all(['''
    content = content.replace(promise_str, new_promise_str)

    res_check = '''if (statusRes.ok) setEmpStatuses(await statusRes.json());'''
    new_res_check = res_check + '''\n      if (policyRes && policyRes.ok) setAttendancePolicies(await policyRes.json());'''
    content = content.replace(res_check, new_res_check)

    # 3. Add to newEmpData
    emp_data_str = '''status: '재직', hire_date: '''''
    new_emp_data_str = '''status: '재직', hire_date: '', attendance_policy_id: '''''
    content = content.replace(emp_data_str, new_emp_data_str)
    
    emp_data_str2 = '''status: '재직', hire_date: new Date().toISOString().split('T')[0]'''
    new_emp_data_str2 = '''status: '재직', hire_date: new Date().toISOString().split('T')[0], attendance_policy_id: '''''
    content = content.replace(emp_data_str2, new_emp_data_str2)

    # 4. Add column
    col_str = '''    { 
      field: 'employment_type','''
    
    # We will add attendance_policy column before employment_type
    new_col_str = '''    { 
      field: 'attendance_policy_id', 
      headerName: '근태 기준', 
      width: 150, 
      editable: true,
      editType: 'select',
      options: attendancePolicies.map(p => ({ label: p.name, value: p.id })),
      renderCell: (v) => attendancePolicies.find(p => p.id === v)?.name || '기본 설정'
    },
    { 
      field: 'employment_type','''
    
    if 'attendance_policy_id' not in content.split('columns: ColumnDef[]')[1]:
        content = content.replace(col_str, new_col_str)

    # 5. Add to modal UI
    modal_ui_str = '''<div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">시스템 권한 <span className="text-red-500">*</span></label>
                    <select
                      value={newEmpData.role}
                      onChange={e => setNewEmpData({...newEmpData, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#107C41]"
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>'''
                  
    new_modal_ui_str = modal_ui_str + '''
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">근태 기준</label>
                    <select
                      value={newEmpData.attendance_policy_id}
                      onChange={e => setNewEmpData({...newEmpData, attendance_policy_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#107C41]"
                    >
                      <option value="">기본 설정</option>
                      {attendancePolicies.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>'''
                  
    if '근태 기준' not in content.split('신규 사원 등록')[1]:
        content = content.replace(modal_ui_str, new_modal_ui_str)

    with open('app/erp/employees/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("page.tsx patched successfully")

if __name__ == "__main__":
    patch()
