"use client";

import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldEllipsis, UserCheck, MoreVertical, Search, Check, Plus, X } from 'lucide-react';

const ROLE_OPTIONS = [
  { id: 'master', name: '사내 총괄 관리자', color: 'red', desc: '회사 내 모든 데이터 열람 및 총괄 관리' },
  { id: 'hr_manager', name: '인사 담당자', color: 'blue', desc: '사원 정보 및 근태/급여 관리' },
  { id: 'dept_head', name: '부서장', color: 'purple', desc: '소속 부서원 휴가 결재 및 열람' },
  { id: 'employee', name: '일반 사원', color: 'emerald', desc: '본인 정보 조회 및 휴가 신청' },
];

export default function RoleManagementPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  
  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({ emp_no: '', name: '', email: '', department_id: '', role_id: 'employee' });

  const fetchEmployees = () => {
    fetch("http://localhost:8000/api/employees")
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (isModalOpen) {
      fetch("http://localhost:8000/api/employees/next-emp-no")
        .then(res => res.json())
        .then(data => setNewEmp(prev => ({ ...prev, emp_no: data.next_emp_no })))
        .catch(err => console.error(err));
    }
  }, [isModalOpen]);

  useEffect(() => {
    fetchEmployees();
    fetch("http://localhost:8000/api/employees/departments")
      .then(res => res.json())
      .then(data => setDepartments(data))
      .catch(err => console.error(err));
  }, []);

  const getRoleInfo = (roleId: string) => {
    return ROLE_OPTIONS.find(r => r.id === roleId) || ROLE_OPTIONS[3];
  };

  const handleRoleChange = async (empId: number, newRoleId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/employees/${empId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: newRoleId })
      });
      if (res.ok) {
        setEmployees(employees.map(emp => 
          emp.id === empId ? { ...emp, role: newRoleId } : emp
        ));
      }
    } catch (err) {
      console.error(err);
    }
    setOpenDropdownId(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.emp_no || !newEmp.name || !newEmp.email) {
      alert("모든 필드를 입력해주세요.");
      return;
    }
    try {
      const res = await fetch("http://localhost:8000/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEmp,
          department_id: null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "등록 실패");
      
      alert(data.message + "\n초기 비밀번호는 1234로 설정되었습니다.");
      setIsModalOpen(false);
      setNewEmp({ emp_no: '', name: '', email: '', department_id: '', role_id: 'employee' });
      fetchEmployees();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getRoleBadgeColor = (color: string) => {
    switch(color) {
      case 'red': return 'bg-red-50 text-red-700 border-red-200';
      case 'blue': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'purple': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'emerald': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRoleIcon = (roleId: string, className = "w-4 h-4") => {
    switch(roleId) {
      case 'master': return <ShieldAlert className={className} />;
      case 'hr_manager': return <ShieldCheck className={className} />;
      case 'dept_head': return <Shield className={className} />;
      case 'employee': return <UserCheck className={className} />;
      default: return <ShieldEllipsis className={className} />;
    }
  };

  return (
    <div className="transition-opacity duration-500 ease-in-out opacity-100 pb-10">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">사용자 및 권한 할당</h1>
          <p className="text-sm text-gray-500 mt-1">사원을 신규 등록하거나, 시스템 접근 권한(Role)을 설정합니다.</p>
        </div>
      </div>

      {/* Warning/Info Box */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start">
        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-4">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-blue-900">보안 및 접근 제어 안내</h4>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            사원을 등록하면 자동으로 초기 비밀번호(1234)가 설정되며, 해당 사원은 최초 로그인 시 반드시 비밀번호를 변경해야 합니다.<br/>
            시스템 관리자는 보안 정책상 사원의 상세 개인정보(연봉, 등)를 열람할 수 없습니다. 상세 업무는 '인사 담당자' 권한으로 진행해 주십시오.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/30">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="사번, 이름, 부서 검색" 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] transition-all"
            />
          </div>
          <div className="flex w-full sm:w-auto justify-end">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#107C41] text-white text-sm font-medium rounded-lg hover:bg-[#0c5e31] transition-colors shadow-sm flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              신규 사원 등록
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-gray-100 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">사번</th>
                <th className="px-6 py-4">이름</th>
                <th className="px-6 py-4">소속 부서</th>
                <th className="px-6 py-4">현재 시스템 권한</th>
                <th className="px-6 py-4 text-center">권한 설정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.map((emp) => {
                const roleInfo = getRoleInfo(emp.role);
                const isDropdownOpen = openDropdownId === emp.id;
                
                return (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-600">{emp.emp_no}</td>
                    <td className="px-6 py-4 text-gray-900 font-semibold">{emp.name}</td>
                    <td className="px-6 py-4 text-gray-500">{emp.department}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(roleInfo.color)}`}>
                        {getRoleIcon(roleInfo.id, "w-3 h-3 mr-1.5")}
                        {roleInfo.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center relative">
                      <button 
                        onClick={() => setOpenDropdownId(isDropdownOpen ? null : emp.id)}
                        className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${isDropdownOpen ? 'border-gray-300 bg-gray-100 text-gray-900' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        변경
                        <MoreVertical className="w-3.5 h-3.5 ml-1 text-gray-400" />
                      </button>

                      {/* Role Change Dropdown */}
                      {isDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)}></div>
                          <div className="absolute right-6 top-12 mt-1 w-56 bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-200/50 z-20 overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                              권한 선택
                            </div>
                            <div className="p-1">
                              {ROLE_OPTIONS.map((role) => (
                                <button
                                  key={role.id}
                                  onClick={() => handleRoleChange(emp.id, role.id)}
                                  className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-start transition-colors ${emp.role === role.id ? 'bg-[#f0fdf4] text-[#107C41]' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                  <div className={`mt-0.5 mr-2 flex-shrink-0 ${emp.role === role.id ? 'text-[#107C41]' : 'text-gray-400'}`}>
                                    {emp.role === role.id ? <Check className="w-4 h-4" /> : getRoleIcon(role.id)}
                                  </div>
                                  <div>
                                    <div className="font-medium">{role.name}</div>
                                    <div className={`text-[10px] mt-0.5 ${emp.role === role.id ? 'text-[#107C41]/70' : 'text-gray-400'}`}>
                                      {role.desc}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 사원 등록 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">신규 사원 등록</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRegister} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사원 번호 (자동 채번)</label>
                <input 
                  type="text" readOnly
                  value={newEmp.emp_no}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-500 font-mono font-medium border border-gray-200 rounded-lg text-sm outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input 
                  type="text" required
                  placeholder="홍길동"
                  value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">회사 이메일</label>
                <input 
                  type="email" required
                  placeholder="hong@minstudio.com"
                  value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">접근 권한</label>
                <select 
                  required
                  value={newEmp.role_id} onChange={e => setNewEmp({...newEmp, role_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none transition-all bg-white"
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.id} value={r.id}>{r.name} - {r.desc}</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-2">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#107C41] rounded-lg hover:bg-[#0c5e31] shadow-sm shadow-green-600/20 transition-all"
                >
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
