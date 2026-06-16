"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Download, Save, Undo2, FileDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DataGrid, ColumnDef } from "@/components/ui/DataGrid";
import { useDialog } from "@/components/providers/DialogProvider";
import { Button } from "@/components/ui/Button";

interface Payroll {
  id: number | string;
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
  _state?: 'C' | 'U' | 'D' | '';
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
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const { showAlert, showConfirm } = useDialog();
  
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
      // Initialize _state for datagrid
      const initData = data.map((item: any) => ({ ...item, _state: '' }));
      setPayrolls(initData);
      setSelectedRowIndices([]);
    } catch (err: any) {
      console.error(err.message);
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
    const confirmed = await showConfirm(`${currentMonth} 귀속 급여를 일괄 산출하시겠습니까? (기존 데이터가 있다면 덮어씁니다)`, { type: "warning" });
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
      
      await showAlert(data.message, { type: "success" });
      fetchPayrolls();
    } catch (err: any) {
      await showAlert(err.message, { type: "error" });
      setLoading(false);
    }
  };

  const handleDataChange = (rowIndex: number, field: string, newValue: any) => {
    const newData = [...payrolls];
    const row = { ...newData[rowIndex] };

    // Update field value
    (row as any)[field] = newValue;

    // Apply _state logic
    if (row._state !== 'C' && row._state !== 'D') {
      row._state = 'U';
    }

    // Determine deduction rate from settings
    let deductionRate = 0.094; // fallback
    if (systemSettings) {
      const np = systemSettings.national_pension_rate || 0.045;
      const hi = systemSettings.health_insurance_rate || 0.03545;
      const ltc = systemSettings.long_term_care_rate || 0.1295;
      const ei = systemSettings.employment_insurance_rate || 0.009;
      deductionRate = np + hi + (hi * ltc) + ei;
    }

    // Calculate deductions when base_salary or bonus changes
    if (field === 'base_salary' || field === 'bonus') {
      const base = Number(row.base_salary || 0);
      const bonus = Number(row.bonus || 0);
      const estimatedDeduction = Math.floor((base + bonus) * deductionRate);
      row.deductions = Math.floor(estimatedDeduction / 10) * 10;
    }

    // Auto calculate net_pay
    const base = Number(row.base_salary || 0);
    const bonus = Number(row.bonus || 0);
    const deductions = Number(row.deductions || 0);
    row.net_pay = base + bonus - deductions;

    // Find employee info if employee_id changed
    if (field === 'employee_id') {
      const emp = employees.find(e => e.id === Number(newValue));
      if (emp) {
        row.employee_name = emp.name;
        row.employee_no = emp.emp_no;
        row.department_name = emp.department_name;
      }
    }

    newData[rowIndex] = row;
    setPayrolls(newData);
  };

  const handleAddRow = () => {
    const newRow: Payroll = {
      id: `temp-${Date.now()}`,
      employee_id: employees.length > 0 ? employees[0].id : 0,
      payment_month: currentMonth,
      base_salary: 0,
      bonus: 0,
      deductions: 0,
      net_pay: 0,
      payment_date: new Date().toISOString().slice(0, 10),
      _state: 'C',
    };
    
    // Autofill employee_name and emp_no if employee exists
    if (employees.length > 0) {
      newRow.employee_name = employees[0].name;
      newRow.employee_no = employees[0].emp_no;
      newRow.department_name = employees[0].department_name;
    }

    setPayrolls([newRow, ...payrolls]);
  };

  const handleBulkDelete = async () => {
    if (selectedRowIndices.length === 0) return;
    
    const newPayrolls = payrolls.filter((p, idx) => {
      if (selectedRowIndices.includes(idx)) {
        if (p._state === 'C' || String(p.id).startsWith('temp-')) {
          return false;
        } else {
          p._state = 'D';
          return true;
        }
      }
      return true;
    });

    setPayrolls(newPayrolls);
    setSelectedRowIndices([]);
  };

  const handleCancel = () => {
    fetchPayrolls();
  };

  const handleSave = async () => {
    const rowsToCreate = payrolls.filter(p => p._state === 'C');
    const rowsToDelete = payrolls.filter(p => p._state === 'D');
    const rowsToUpdate = payrolls.filter(p => p._state === 'U');
    
    if (rowsToCreate.length === 0 && rowsToDelete.length === 0 && rowsToUpdate.length === 0) {
      await showAlert("저장할 변경사항이 없습니다.", { type: "info" });
      return;
    }

    const totalChanges = rowsToCreate.length + rowsToDelete.length + rowsToUpdate.length;
    const confirmed = await showConfirm(`총 ${totalChanges}건의 변경사항(신규 ${rowsToCreate.length}건, 수정 ${rowsToUpdate.length}건, 삭제 ${rowsToDelete.length}건)을 저장하시겠습니까?`, { type: "warning" });
    if (!confirmed) return;
    
    try {
      setLoading(true);

      // 1. Delete
      if (rowsToDelete.length > 0) {
        const idsToDelete = rowsToDelete.map(p => Number(p.id)).filter(id => !isNaN(id));
        if (idsToDelete.length > 0) {
          const res = await fetch(`/api/payrolls/bulk-delete`, { 
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ payroll_ids: idsToDelete })
          });
          if (!res.ok) throw new Error("일괄 삭제 실패");
        }
      }

      // 2. Create
      if (rowsToCreate.length > 0) {
        const createPayload = rowsToCreate.map(p => ({
          employee_id: Number(p.employee_id),
          payment_month: p.payment_month,
          base_salary: Number(p.base_salary) || 0,
          bonus: Number(p.bonus) || 0,
          deductions: Number(p.deductions) || 0,
          payment_date: p.payment_date,
        }));

        const res = await fetch(`/api/payrolls/bulk-create`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ payrolls: createPayload })
        });
        if (!res.ok) throw new Error("일괄 등록 실패");
      }

      // 3. Update
      if (rowsToUpdate.length > 0) {
        const updatePayload = rowsToUpdate.map(p => ({
          id: Number(p.id),
          base_salary: Number(p.base_salary) || 0,
          bonus: Number(p.bonus) || 0,
          deductions: Number(p.deductions) || 0,
          payment_date: p.payment_date,
        }));

        const res = await fetch(`/api/payrolls/bulk-update`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ payrolls: updatePayload })
        });
        if (!res.ok) throw new Error("일괄 수정 실패");
      }

      await showAlert("변경사항이 성공적으로 저장되었습니다.", { type: "success" });
      fetchPayrolls();
    } catch (err: any) {
      await showAlert(err.message, { type: "error" });
      setLoading(false);
    }
  };

  const columns: ColumnDef[] = [
    {
      field: '_state',
      headerName: '상태',
      width: 60,
      renderCell: (val: any) => {
        if (val === 'C') return <span className="text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded text-xs">신규</span>;
        if (val === 'U') return <span className="text-orange-500 font-bold bg-orange-50 px-2 py-0.5 rounded text-xs">수정</span>;
        if (val === 'D') return <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded text-xs line-through">삭제</span>;
        return <span className="text-gray-400 text-xs">-</span>;
      }
    },
    {
      field: 'employee_no',
      headerName: '사번',
      width: 100,
    },
    {
      field: 'employee_id',
      headerName: '이름',
      width: 120,
      editable: true,
      editType: 'select',
      options: employees.map(e => ({ label: `${e.name} (${e.department_name || '미지정'})`, value: e.id })),
      renderCell: (val: any, row: any) => <span>{row.employee_name || '-'}</span>
    },
    {
      field: 'department_name',
      headerName: '부서',
      width: 120,
      renderCell: (val: any) => <span className="text-gray-600">{val || '-'}</span>
    },
    {
      field: 'payment_month',
      headerName: '귀속월',
      width: 100,
      editable: true,
      renderCell: (val: any) => <div className="text-center w-full">{val}</div>
    },
    {
      field: 'base_salary',
      headerName: '기본급',
      width: 130,
      editable: true,
      renderCell: (val: any) => <div className="text-right w-full">{Number(val).toLocaleString()}원</div>
    },
    {
      field: 'bonus',
      headerName: '상여금',
      width: 130,
      editable: true,
      renderCell: (val: any) => <div className="text-right w-full">{Number(val).toLocaleString()}원</div>
    },
    {
      field: 'deductions',
      headerName: '공제액',
      width: 130,
      editable: true,
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
      editable: true,
      renderCell: (val: any) => <div className="text-center w-full text-gray-600">{val}</div>
    }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">급여 대장</h1>
          <p className="text-gray-500">임직원들의 월별 급여 산출 및 지급 내역을 관리합니다.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex items-center">
              <input 
                type="month" 
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#107C41] focus:border-[#107C41]"
              />
            </div>
            
            <div className="flex flex-wrap justify-end gap-2 w-full mt-2">
              <Button 
                onClick={handleBulkGenerate}
                variant="outline"
                className="text-gray-700 bg-white border-gray-300 hover:bg-gray-50 transition-colors shadow-sm shrink-0"
              >
                <Download className="w-4 h-4 mr-2" />
                일괄 자동 산출
              </Button>
              {payrolls.some(p => p._state === 'C' || p._state === 'D' || p._state === 'U') && (
                <>
                  <Button onClick={handleCancel} variant="outline" className="text-gray-700 bg-white border-gray-300 hover:bg-gray-50 transition-all shrink-0">
                    <Undo2 className="w-4 h-4 mr-2" />
                    변경 취소
                  </Button>
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 transition-all transform hover:scale-105 duration-200 shrink-0">
                    <Save className="w-4 h-4 mr-2" />
                    변경사항 저장
                  </Button>
                </>
              )}
              {selectedRowIndices.length > 0 && (
                <Button variant="danger" onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 text-white border-transparent shrink-0">
                  <Trash2 className="w-4 h-4 mr-2" />
                  선택 삭제 ({selectedRowIndices.length})
                </Button>
              )}
              <Button className="bg-[#107C41] hover:bg-[#0b5c30] text-white" onClick={handleAddRow}>
                <Plus className="w-4 h-4 mr-2" />
                급여 추가
              </Button>
            </div>
          </div>

          <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-6 w-6 border-2 border-gray-300 border-t-[#107C41] rounded-full animate-spin mb-2"></div>
                  데이터를 불러오는 중입니다...
                </div>
              </div>
            ) : payrolls.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                선택한 월({currentMonth})의 급여 데이터가 없습니다.
              </div>
            ) : (
              <DataGrid 
                columns={columns} 
                data={payrolls} 
                onDataChange={handleDataChange}
                showCheckboxes={true}
                selectedRowIndices={selectedRowIndices}
                onSelectionChange={setSelectedRowIndices}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
