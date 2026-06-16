"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DataGrid, ColumnDef } from "@/components/ui/DataGrid";

interface Payroll {
  id: number;
  employee_id: number;
  payment_month: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  net_pay: number;
  payment_date: string;
  employee_name?: string;
  employee_no?: string;
  department_name?: string;
}

interface Employee {
  id: number;
  emp_no: string;
  name: string;
  department_name?: string;
}

export default function PayrollsPage() {
  const router = useRouter();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // 급여대장은 이전 달을 기본값으로 설정
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  });
  
  const [systemSettings, setSystemSettings] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPayroll, setCurrentPayroll] = useState<Partial<Payroll>>({});
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token') || localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPayrolls();
    fetchEmployees();
    fetchSystemSettings();
  }, [currentMonth, token, router]);

  const fetchSystemSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSystemSettings(data);
      }
    } catch (err) {
      console.error("Failed to fetch system settings", err);
    }
  };

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/payrolls?month=${currentMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('급여 대장 데이터를 불러오는데 실패했습니다.');
      const data = await res.json();
      setPayrolls(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`/api/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkGenerate = async () => {
    const confirmed = window.confirm(`${currentMonth} 귀속 급여를 일괄 산출하시겠습니까? (기존 데이터가 있다면 덮어씁니다)`);
    if (!confirmed) return;
    
    try {
      setLoading(true);
      const res = await fetch('/api/payrolls/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payment_month: currentMonth })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "일괄 산출 실패");
      
      alert(data.message);
      fetchPayrolls();
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  const handleOpenModal = (payroll?: Payroll) => {
    if (payroll) {
      setEditMode(true);
      setCurrentPayroll(payroll);
    } else {
      setEditMode(false);
      // 신규 입력 기본값
      setCurrentPayroll({
        payment_month: currentMonth,
        base_salary: 0,
        bonus: 0,
        deductions: 0,
        payment_date: new Date().toISOString().slice(0, 10)
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPayroll({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPayroll.employee_id || !currentPayroll.base_salary) {
      alert('필수 정보를 입력해주세요.');
      return;
    }

    try {
      const url = editMode ? `/api/payrolls/${currentPayroll.id}` : '/api/payrolls';
      const method = editMode ? 'PUT' : 'POST';
      
      const payload = {
        employee_id: currentPayroll.employee_id,
        payment_month: currentPayroll.payment_month,
        base_salary: Number(currentPayroll.base_salary),
        bonus: Number(currentPayroll.bonus || 0),
        deductions: Number(currentPayroll.deductions || 0),
        payment_date: currentPayroll.payment_date
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('급여 정보 저장에 실패했습니다.');
      
      handleCloseModal();
      fetchPayrolls();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/payrolls/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('삭제 실패');
      fetchPayrolls();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleNumberInput = (field: keyof Payroll, value: string) => {
    const numericValue = value.replace(/,/g, '');
    let num = 0;
    if (numericValue !== '' && !isNaN(Number(numericValue))) {
      num = Number(numericValue);
    }

    const updatedPayroll = { ...currentPayroll, [field]: num };

    // 기본급 또는 상여금 입력 시 관리자가 설정한 4대보험 공제율 적용
    if (field === 'base_salary' || field === 'bonus') {
      const base = field === 'base_salary' ? num : Number(currentPayroll.base_salary || 0);
      const bonus = field === 'bonus' ? num : Number(currentPayroll.bonus || 0);
      
      let deductionRate = 0.094; // fallback
      if (systemSettings) {
        const np = systemSettings.national_pension_rate || 0.045;
        const hi = systemSettings.health_insurance_rate || 0.03545;
        const ltc = systemSettings.long_term_care_rate || 0.1295;
        const ei = systemSettings.employment_insurance_rate || 0.009;
        // 총 공제율 = 국민 + 건강 + (건강*장기요양) + 고용
        deductionRate = np + hi + (hi * ltc) + ei;
      }

      const estimatedDeduction = Math.floor((base + bonus) * deductionRate);
      updatedPayroll.deductions = Math.floor(estimatedDeduction / 10) * 10; // 10원 단위 절사
    }

    setCurrentPayroll(updatedPayroll);
  };

  // 실수령액 자동 계산용 함수 (모달 내부)
  const calculateNetPay = () => {
    const base = Number(currentPayroll.base_salary || 0);
    const bonus = Number(currentPayroll.bonus || 0);
    const deductions = Number(currentPayroll.deductions || 0);
    return base + bonus - deductions;
  };

  const columns: ColumnDef[] = [
    {
      field: 'employee_no',
      headerName: '사번',
      width: 120,
    },
    {
      field: 'employee_name',
      headerName: '이름',
      width: 120,
    },
    {
      field: 'department_name',
      headerName: '부서',
      width: 150,
      renderCell: (val: any) => <span className="text-gray-600">{val || '-'}</span>
    },
    {
      field: 'base_salary',
      headerName: '기본급',
      width: 130,
      renderCell: (val: any) => <div className="text-right w-full">{Number(val).toLocaleString()}원</div>
    },
    {
      field: 'bonus',
      headerName: '상여금',
      width: 130,
      renderCell: (val: any) => <div className="text-right w-full">{Number(val).toLocaleString()}원</div>
    },
    {
      field: 'deductions',
      headerName: '공제액',
      width: 130,
      renderCell: (val: any) => <div className="text-right w-full text-red-500">-{Number(val).toLocaleString()}원</div>
    },
    {
      field: 'net_pay',
      headerName: '실수령액',
      width: 140,
      renderCell: (val: any) => <div className="text-right w-full font-bold text-[#107C41]">{Number(val).toLocaleString()}원</div>
    },
    {
      field: 'payment_date',
      headerName: '지급일',
      width: 120,
      renderCell: (val: any) => <div className="text-center w-full text-gray-600">{val}</div>
    },
    {
      field: 'id',
      headerName: '관리',
      width: 100,
      renderCell: (val: any, row: any) => (
        <div className="flex items-center justify-center space-x-2 w-full">
          <button onClick={() => handleOpenModal(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100">
          <div className="flex items-center">
            <input 
              type="month" 
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#107C41] focus:border-[#107C41]"
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 w-full sm:w-auto">
            <button 
              onClick={handleBulkGenerate}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              일괄 자동 산출
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center px-4 py-2 bg-[#107C41] text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              수동 등록
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 mx-4 my-4 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-6 w-6 border-2 border-gray-300 border-t-[#107C41] rounded-full animate-spin mb-2"></div>
              데이터를 불러오는 중입니다...
            </div>
          </div>
        ) : payrolls.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            선택한 월({currentMonth})의 급여 데이터가 없습니다.
          </div>
        ) : (
          <DataGrid columns={columns} data={payrolls} />
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">
                {editMode ? '급여 명세 수정' : '신규 급여 등록'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="payroll-form" onSubmit={handleSave} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">대상 사원</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#107C41] focus:border-[#107C41]"
                      value={currentPayroll.employee_id || ''}
                      onChange={(e) => setCurrentPayroll({...currentPayroll, employee_id: Number(e.target.value)})}
                      required
                      disabled={editMode}
                    >
                      <option value="">사원 선택</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.department_name || '부서미지정'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">귀속 월</label>
                    <input 
                      type="month"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#107C41] focus:border-[#107C41]"
                      value={currentPayroll.payment_month || ''}
                      onChange={(e) => setCurrentPayroll({...currentPayroll, payment_month: e.target.value})}
                      required
                      disabled={editMode}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-1">기본급 (원)</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#107C41] focus:border-[#107C41]"
                    value={currentPayroll.base_salary ? currentPayroll.base_salary.toLocaleString() : ''}
                    onChange={(e) => handleNumberInput('base_salary', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상여금 (원)</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#107C41] focus:border-[#107C41]"
                      value={currentPayroll.bonus ? currentPayroll.bonus.toLocaleString() : ''}
                      onChange={(e) => handleNumberInput('bonus', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">공제액 (원)</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#107C41] focus:border-[#107C41]"
                      value={currentPayroll.deductions ? currentPayroll.deductions.toLocaleString() : ''}
                      onChange={(e) => handleNumberInput('deductions', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">실지급일</label>
                  <input 
                    type="date"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#107C41] focus:border-[#107C41]"
                    value={currentPayroll.payment_date || ''}
                    onChange={(e) => setCurrentPayroll({...currentPayroll, payment_date: e.target.value})}
                    required
                  />
                </div>

                <div className="mt-6 p-4 bg-[#f0fdf4] rounded-xl border border-green-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">예상 실수령액</span>
                    <span className="text-2xl font-bold text-[#107C41]">
                      {calculateNetPay().toLocaleString()} 원
                    </span>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 mt-auto">
              <button 
                type="button" 
                onClick={handleCloseModal}
                className="px-5 py-2.5 text-gray-700 font-medium bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                취소
              </button>
              <button 
                type="submit" 
                form="payroll-form"
                className="px-5 py-2.5 text-white font-medium bg-[#107C41] rounded-xl hover:bg-green-700 transition-colors shadow-md shadow-green-600/20"
              >
                {editMode ? '수정 내용 저장' : '급여 대장 등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
