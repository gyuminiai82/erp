"use client";

import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, XCircle, ArrowRightLeft, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useDialog } from "@/components/providers/DialogProvider";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert, showConfirm } = useDialog();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: '',
    type: '부서이동',
    after_dept_id: '',
    after_pos_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    memo: ''
  });

  const fetchData = async () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token')) : '';
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [appRes, empRes, deptRes, posRes] = await Promise.all([
        fetch("/api/appointments", { headers }),
        fetch("/api/employees", { headers }),
        fetch("/api/departments", { headers }),
        fetch("/api/positions", { headers })
      ]);
      
      if (appRes.ok) setAppointments(await appRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (posRes.ok) setPositions(await posRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token')) : '';
    const headers = { Authorization: `Bearer ${token}` };
    if (!form.employee_id) return showAlert("발령 대상 사원을 선택해주세요.", { type: "warning" });
    if (!form.type) return showAlert("발령 유형을 선택해주세요.", { type: "warning" });
    if (!form.appointment_date) return showAlert("발령 일자를 입력해주세요.", { type: "warning" });

    const employee = employees.find(e => e.id === Number(form.employee_id));
    if (!employee) return showAlert("유효하지 않은 사원입니다.", { type: "error" });

    const payload = {
      employee_id: Number(form.employee_id),
      type: form.type,
      before_dept_id: employee.department_id || null,
      after_dept_id: form.after_dept_id ? Number(form.after_dept_id) : employee.department_id,
      before_pos_id: employee.position_id || null,
      after_pos_id: form.after_pos_id ? Number(form.after_pos_id) : employee.position_id,
      appointment_date: form.appointment_date,
      memo: form.memo
    };

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setForm({
          employee_id: '',
          type: '부서이동',
          after_dept_id: '',
          after_pos_id: '',
          appointment_date: new Date().toISOString().split('T')[0],
          memo: ''
        });
        fetchData();
      } else {
        const data = await res.json();
        await showAlert(data.detail || "추가 실패", { type: "error" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProcess = async (id: number, status: string) => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token')) : '';
    const headers = { Authorization: `Bearer ${token}` };
    const confirmed = await showConfirm(`이 발령을 ${status} 처리하시겠습니까?`, { type: "info" });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        await showAlert(data.detail || "처리 실패", { type: "error" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token')) : '';
    const headers = { Authorization: `Bearer ${token}` };
    const confirmed = await showConfirm("정말 이 발령 기록을 삭제하시겠습니까?", { type: "error" });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        await showAlert(data.detail || "삭제 실패", { type: "error" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-gray-500 text-center">인사 발령 데이터를 불러오는 중...</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">인사 발령 관리</h1>
          <p className="text-gray-500">직원의 부서 이동 및 승진, 직급 변경 등을 발령하고 이력을 관리합니다.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          신규 발령 작성
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <th className="py-3 px-6 font-semibold w-32 whitespace-nowrap">발령일자</th>
              <th className="py-3 px-6 font-semibold whitespace-nowrap">대상자</th>
              <th className="py-3 px-6 font-semibold whitespace-nowrap">발령 구분</th>
              <th className="py-3 px-6 font-semibold min-w-[200px]">변경 내역</th>
              <th className="py-3 px-6 font-semibold w-24 text-center whitespace-nowrap">상태</th>
              <th className="py-3 px-6 font-semibold text-center whitespace-nowrap">결재</th>
              <th className="py-3 px-6 font-semibold text-center w-16 whitespace-nowrap">관리</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {appointments.map((app) => (
              <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-gray-500">{app.appointment_date}</td>
                <td className="py-4 px-6 font-medium text-gray-900">
                  {app.employee_name} <span className="text-gray-400 text-xs ml-1">({app.employee_no})</span>
                </td>
                <td className="py-4 px-6 text-gray-600">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 font-medium text-xs">
                    {app.type}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="text-gray-600 flex flex-col space-y-1">
                    {app.before_dept_id !== app.after_dept_id && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400 w-8">부서</span>
                        <span className="text-gray-500 line-through">{app.before_dept_name || '소속없음'}</span>
                        <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                        <span className="text-blue-600 font-medium">{app.after_dept_name || '소속없음'}</span>
                      </div>
                    )}
                    {app.before_pos_id !== app.after_pos_id && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400 w-8">직급</span>
                        <span className="text-gray-500 line-through">{app.before_pos_name || '직급없음'}</span>
                        <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                        <span className="text-blue-600 font-medium">{app.after_pos_name || '직급없음'}</span>
                      </div>
                    )}
                    {app.before_dept_id === app.after_dept_id && app.before_pos_id === app.after_pos_id && (
                      <span className="text-gray-400 italic text-xs">변경 없음</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                    app.status === '승인' ? 'bg-green-100 text-green-700' : 
                    app.status === '대기' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-700'
                  }`}>
                    {app.status}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center space-x-2">
                    {app.status === '대기' ? (
                      <>
                        <button onClick={() => handleProcess(app.id, '승인')} className="text-gray-400 hover:text-green-600 p-1" title="승인">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleProcess(app.id, '반려')} className="text-gray-400 hover:text-yellow-600 p-1" title="반려">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center">
                    {app.status !== '승인' ? (
                      <button onClick={() => handleDelete(app.id)} className="text-gray-400 hover:text-red-600 p-1" title="삭제">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-gray-500">추가된 발령 내역이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">신규 인사 발령 작성</h3>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">대상 사원 <span className="text-red-500">*</span></label>
                <select 
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  value={form.employee_id}
                  onChange={e => {
                    const empId = e.target.value;
                    const emp = employees.find(emp => emp.id === Number(empId));
                    setForm({
                      ...form, 
                      employee_id: empId,
                      after_dept_id: emp?.department_id || '',
                      after_pos_id: emp?.position_id || ''
                    });
                  }}
                >
                  <option value="">사원 선택</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.emp_no}) - {e.department || '부서없음'}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">발령 유형 <span className="text-red-500">*</span></label>
                  <select 
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value})}
                  >
                    <option value="부서이동">부서 이동</option>
                    <option value="승진">승진</option>
                    <option value="강등">강등</option>
                    <option value="겸직">겸직</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">발령 일자 <span className="text-red-500">*</span></label>
                  <Input type="date" value={form.appointment_date} onChange={e => setForm({...form, appointment_date: e.target.value})} />
                </div>
              </div>
              
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-4">
                <h4 className="text-sm font-semibold text-blue-800">변경 후 소속/직급</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">이동 부서</label>
                    <select 
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500"
                      value={form.after_dept_id}
                      onChange={e => setForm({...form, after_dept_id: e.target.value})}
                    >
                      <option value="">부서 없음</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">변경 직급</label>
                    <select 
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500"
                      value={form.after_pos_id}
                      onChange={e => setForm({...form, after_pos_id: e.target.value})}
                    >
                      <option value="">직급 없음</option>
                      {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">발령 메모</label>
                <Input value={form.memo} onChange={e => setForm({...form, memo: e.target.value})} placeholder="발령 사유 등 메모" />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>취소</Button>
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">추가 (대기 상태로 저장)</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
