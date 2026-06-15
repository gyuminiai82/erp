"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, UserPlus, FileDown, Trash2, Save, Undo2, Edit2, ArrowUpRight, MoreVertical, LayoutGrid, List as ListIcon } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataGrid, ColumnDef } from "@/components/ui/DataGrid";
import { useDialog } from "@/components/providers/DialogProvider";

const ROLE_OPTIONS = [
  { id: 'master', name: '사내 총괄 관리자' },
  { id: 'hr_manager', name: '인사 담당자' },
  { id: 'dept_head', name: '부서장' },
  { id: 'employee', name: '일반 사원' },
];

const formatPhoneNumber = (value: string) => {
  if (!value) return '';
  const number = value.replace(/[^0-9]/g, '');
  let res = '';

  if (number.length < 3) {
    return number;
  } else if (number.startsWith('02')) {
    if (number.length <= 5) {
      res = number.replace(/(\d{2})(\d{1,3})/, '$1-$2');
    } else if (number.length <= 9) {
      res = number.replace(/(\d{2})(\d{3})(\d{1,4})/, '$1-$2-$3');
    } else {
      res = number.replace(/(\d{2})(\d{4})(\d{1,4})/, '$1-$2-$3');
    }
  } else {
    if (number.length <= 6) {
      res = number.replace(/(\d{3})(\d{1,3})/, '$1-$2');
    } else if (number.length <= 10) {
      res = number.replace(/(\d{3})(\d{3})(\d{1,4})/, '$1-$2-$3');
    } else {
      res = number.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
    }
  }
  return res;
};

const formatResidentNum = (value: string) => {
  if (!value) return '';
  const num = value.replace(/[^0-9]/g, '');
  if (num.length <= 6) return num;
  return num.slice(0, 6) + '-' + num.slice(6, 13);
};

export default function EmployeesPage() {
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [empTypes, setEmpTypes] = useState<any[]>([]);
  const [empStatuses, setEmpStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert, showConfirm } = useDialog();
  
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchDept, setSearchDept] = useState('');
  const [searchPos, setSearchPos] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [searchEmpType, setSearchEmpType] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  // 팝업 등록용 상태
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [newEmpData, setNewEmpData] = useState({
    name: '', email: '', department: '', position: '', role: 'employee',
    phone: '', birth_date: '', gender: '남성', address: '', 
    employment_type: '정규직', resident_num: '', base_salary: 0, 
    status: '재직', hire_date: ''
  });

  const fetchData = async () => {
    try {
      const [empRes, deptRes, posRes, typeRes, statusRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/departments"),
        fetch("/api/positions"),
        fetch("/api/common-codes?group=EMP_TYPE"),
        fetch("/api/common-codes?group=EMP_STATUS")
      ]);
      
      if (empRes.ok) {
        const data = await empRes.json();
        setAllEmployees(data);
        setEmployees(data);
        // If there were active search queries, we might want to re-apply them, but usually fetch clears them or we reset
        setSearchKeyword('');
        setSearchDept('');
        setSearchPos('');
        setSearchRole('');
        setSearchEmpType('');
        setSearchStatus('');
      }
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (posRes.ok) setPositions(await posRes.json());
      if (typeRes.ok) setEmpTypes(await typeRes.json());
      if (statusRes.ok) setEmpStatuses(await statusRes.json());
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatApiError = (detail: any, defaultMsg: string) => {
    if (Array.isArray(detail)) {
      return detail.map((e: any) => `${e.loc?.join('.')} - ${e.msg}`).join('\n');
    }
    if (typeof detail === 'string') return detail;
    if (detail) return JSON.stringify(detail);
    return defaultMsg;
  };

  const handleAddRow = () => {
    setNewEmpData({
      name: '', email: '', department: '', position: '', role: 'employee',
      phone: '', birth_date: '', gender: '남성', address: '', 
      employment_type: '정규직', resident_num: '', base_salary: 0, 
      status: '재직', hire_date: new Date().toISOString().split('T')[0]
    });
    setIsEmpModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpData.name || !newEmpData.email) {
      showAlert("이름과 이메일은 필수 입력 항목입니다.", { type: "warning" });
      return;
    }
    const newTempEmp = {
      id: `temp_${Date.now()}`,
      emp_no: '자동 채번',
      ...newEmpData,
      _state: 'C'
    };
    setEmployees([newTempEmp, ...employees]);
    setIsEmpModalOpen(false);
  };

  const handleBulkDelete = async () => {
    if (selectedRowIndices.length === 0) return;
    
    // Instead of immediate API call, just mark row as 'D'
    const updated = [...employees];
    selectedRowIndices.forEach(idx => {
      updated[idx] = { ...updated[idx], _state: 'D' };
    });
    setEmployees(updated);
    setSelectedRowIndices([]);
  };

  const handleSave = async () => {
    // Collect rows to delete and update
    const rowsToCreate = employees.filter(e => e._state === 'C');
    const rowsToDelete = employees.filter(e => e._state === 'D');
    const rowsToUpdate = employees.filter(e => e._state === 'U');
    
    if (rowsToCreate.length === 0 && rowsToDelete.length === 0 && rowsToUpdate.length === 0) {
      await showAlert("저장할 변경사항이 없습니다.", { type: "info" });
      return;
    }

    const invalidCreate = rowsToCreate.find(e => !e.name || !e.email);
    if (invalidCreate) {
      await showAlert("신규 등록 시 이름과 이메일은 필수입니다.", { type: "warning" });
      return;
    }

    const totalChanges = rowsToCreate.length + rowsToDelete.length + rowsToUpdate.length;
    const confirmed = await showConfirm(`총 ${totalChanges}건의 변경사항(신규 ${rowsToCreate.length}건, 수정 ${rowsToUpdate.length}건, 삭제 ${rowsToDelete.length}건)을 저장하시겠습니까?`, { type: "warning" });
    if (!confirmed) return;
    
    try {
      // Handle deletions
      if (rowsToDelete.length > 0) {
        const idsToDelete = rowsToDelete.map(e => parseInt(String(e.id), 10)).filter(id => !isNaN(id));
        const delRes = await fetch(`/api/employees/bulk-delete`, { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employee_ids: idsToDelete })
        });
        if (!delRes.ok) {
          const data = await delRes.json();
          throw new Error(formatApiError(data.detail, "삭제 실패"));
        }
      }

      // Handle creations
      if (rowsToCreate.length > 0) {
        const createPayload = rowsToCreate.map(e => ({
          name: e.name,
          email: e.email,
          department: e.department,
          position: e.position,
          role: e.role,
          phone: e.phone,
          birth_date: e.birth_date,
          gender: e.gender,
          address: e.address,
          employment_type: e.employment_type,
          resident_num: e.resident_num,
          base_salary: Number(e.base_salary) || 0,
          hire_date: e.hire_date
        }));

        const creRes = await fetch(`/api/employees/bulk-create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employees: createPayload })
        });
        if (!creRes.ok) {
          const data = await creRes.json();
          throw new Error(formatApiError(data.detail, "등록 실패"));
        }
      }

      // Handle updates
      if (rowsToUpdate.length > 0) {
        // Prepare payload, extracting only updatable fields
        const updatePayload = rowsToUpdate.map(e => ({
          id: e.id,
          name: e.name,
          email: e.email,
          department: e.department,
          position: e.position,
          phone: e.phone,
          birth_date: e.birth_date,
          gender: e.gender,
          address: e.address,
          employment_type: e.employment_type,
          resident_num: e.resident_num,
          status: e.status,
          hire_date: e.hire_date,
          base_salary: Number(e.base_salary) || 0
        }));

        const upRes = await fetch(`/api/employees/bulk-update`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employees: updatePayload })
        });
        if (!upRes.ok) {
          const data = await upRes.json();
          throw new Error(formatApiError(data.detail, "수정 실패"));
        }
      }

      await showAlert("변경사항이 성공적으로 저장되었습니다.", { type: "success" });
      fetchData();
    } catch (e: any) {
      console.error(e);
      await showAlert(e.message || "오류가 발생했습니다.", { type: "error" });
    }
  };

  const handleExcelDownload = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('사원목록');

    const baseCols = columns.map(c => ({
      header: c.headerName,
      key: c.field,
      width: c.width ? Math.max(10, c.width / 10) : 15
    }));

    try {
      const saved = localStorage.getItem("erp_employees_grid_columns");
      if (saved) {
        const savedFields = JSON.parse(saved);
        const orderedCols: any[] = [];
        const added: any[] = [];
        savedFields.forEach((field: string) => {
          const col = baseCols.find(c => c.key === field);
          if (col) orderedCols.push(col);
        });
        baseCols.forEach(c => {
          if (!orderedCols.includes(c)) added.push(c);
        });
        worksheet.columns = [...orderedCols, ...added];
      } else {
        worksheet.columns = baseCols;
      }
    } catch (e) {
      worksheet.columns = baseCols;
    }

    employees.forEach(emp => {
      const rowData: any = { ...emp };
      const roleObj = ROLE_OPTIONS.find(r => r.id === emp.role);
      if (roleObj) rowData.role = roleObj.name;
      if (emp.resident_num) rowData.resident_num = maskResidentNum(emp.resident_num);
      worksheet.addRow(rowData);
    });

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.font = { name: '맑은 고딕', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E2E2' } },
          left: { style: 'thin', color: { argb: 'FFE2E2E2' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E2E2' } },
          right: { style: 'thin', color: { argb: 'FFE2E2E2' } }
        };

        if (rowNumber === 1) {
          cell.font = { name: '맑은 고딕', size: 10, bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F4F7' }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          const colKey = worksheet.columns[colNumber - 1].key;
          if (colKey === 'email' || colKey === 'address') {
            cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        }
      });
      row.height = 22;
    });

    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `employees_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleCancel = async () => {
    const confirmed = await showConfirm("변경사항을 취소하고 처음 상태로 되돌리시겠습니까?", { type: "warning" });
    if (!confirmed) return;
    setSelectedRowIndices([]);
    fetchData(); // Refetch from server to clear all local changes
  };

  const maskResidentNum = (v: any) => {
    if (!v || typeof v !== 'string') return v;
    if (v.length === 14 && v[6] === '-') return v.substring(0, 8) + '******';
    if (v.length === 13) return v.substring(0, 7) + '******';
    return v;
  };

  const columns: ColumnDef[] = [
    { field: 'emp_no', headerName: '사번', width: 120, editable: true },
    { field: 'name', headerName: '이름', width: 120, editable: true },
    { 
      field: 'department', 
      headerName: '부서', 
      width: 150,
      editable: true,
      editType: 'select',
      options: departments.map(d => ({ label: d.name, value: d.name }))
    },
    { 
      field: 'position', 
      headerName: '직급', 
      width: 100,
      editable: true,
      editType: 'select',
      options: positions.map(p => ({ label: p.name, value: p.name }))
    },
    { field: 'phone', headerName: '연락처', width: 150, editable: true, formatEditValue: formatPhoneNumber },
    { 
      field: 'employment_type', 
      headerName: '고용형태', 
      width: 120, 
      editable: true,
      editType: 'select',
      options: empTypes.length > 0 ? empTypes.map(t => ({ label: t.name, value: t.code })) : [
        { label: '정규직', value: '정규직' },
        { label: '계약직', value: '계약직' },
        { label: '아르바이트', value: '아르바이트' },
        { label: '인턴', value: '인턴' },
        { label: '프리랜서', value: '프리랜서' }
      ]
    },
    { 
      field: 'status', 
      headerName: '상태', 
      width: 100,
      editable: true,
      editType: 'select',
      options: empStatuses.length > 0 ? empStatuses.map(s => ({ label: s.name, value: s.code })) : [
        { label: '재직', value: '재직' },
        { label: '휴직', value: '휴직' },
        { label: '퇴사', value: '퇴사' }
      ]
    },
    { field: 'hire_date', headerName: '입사일', width: 120, editable: true },
    { 
      field: 'role', 
      headerName: '시스템 권한', 
      width: 150,
      editable: true,
      editType: 'select',
      options: ROLE_OPTIONS.map(r => ({ label: r.name, value: r.id })),
      renderCell: (v) => ROLE_OPTIONS.find(r => r.id === v)?.name || '일반 사원'
    },
    { field: 'email', headerName: '이메일', width: 180, editable: true },
    { field: 'birth_date', headerName: '생년월일', width: 120, editable: true },
    { 
      field: 'gender', 
      headerName: '성별', 
      width: 80, 
      editable: true,
      editType: 'select',
      options: [{ label: '남성', value: '남성' }, { label: '여성', value: '여성' }]
    },
    { field: 'resident_num', headerName: '주민등록번호', width: 150, editable: true, formatEditValue: formatResidentNum, renderCell: (v) => maskResidentNum(v) },
    { field: 'address', headerName: '주소', width: 250, editable: true },
    { field: 'base_salary', headerName: '기본급(원)', width: 150, editable: true, renderCell: (v) => v ? Number(v).toLocaleString() : '0' }
  ];

  const handleDataChange = (rowIndex: number, field: string, value: any) => {
    let finalValue = value;
    if (field === 'phone') {
      finalValue = formatPhoneNumber(value || '');
    } else if (field === 'resident_num') {
      finalValue = formatResidentNum(value || '');
    }

    const updated = [...employees];
    updated[rowIndex] = { ...updated[rowIndex], [field]: finalValue, _state: 'U' };
    setEmployees(updated);
    
    // Update allEmployees as well so filters don't erase changes
    const updatedAll = [...allEmployees];
    const allIdx = updatedAll.findIndex(e => e.id === updated[rowIndex].id);
    if (allIdx >= 0) {
      updatedAll[allIdx] = { ...updated[rowIndex] };
      setAllEmployees(updatedAll);
    }
  };

  const handleSearch = () => {
    let filtered = [...allEmployees];

    if (searchKeyword.trim() !== '') {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(e => 
        (e.name && e.name.toLowerCase().includes(keyword)) ||
        (e.emp_no && e.emp_no.toLowerCase().includes(keyword)) ||
        (e.email && e.email.toLowerCase().includes(keyword))
      );
    }

    if (searchDept !== '') {
      filtered = filtered.filter(e => e.department === searchDept);
    }

    if (searchPos !== '') {
      filtered = filtered.filter(e => e.position === searchPos);
    }

    if (searchRole !== '') {
      filtered = filtered.filter(e => e.role === searchRole);
    }

    if (searchEmpType !== '') {
      filtered = filtered.filter(e => e.employment_type === searchEmpType);
    }

    if (searchStatus !== '') {
      filtered = filtered.filter(e => e.status === searchStatus);
    }

    setEmployees(filtered);
    setSelectedRowIndices([]);
  };

  if (loading) return <div className="p-8 text-gray-500 text-center">직원 데이터를 불러오는 중...</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">사원 관리</h1>
          <p className="text-gray-500">전체 임직원 목록 조회 및 신규 사원 등록을 관리합니다.</p>
        </div>
        <div className="flex space-x-2">
          {/* Action buttons have been moved to the DataGrid toolbar */}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50/50">
          <div className="flex flex-col gap-4 mb-4">
            {/* Top Row: Search Input, Filters, and Search Button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input 
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  onKeyDown={e => { if(e.key === 'Enter') handleSearch(); }}
                  className="pl-9 pr-4 bg-white w-full focus:z-10 relative" 
                  placeholder="이름, 사번, 이메일 검색..." 
                />
              </div>

              {/* Filters */}
              <select 
                value={searchDept}
                onChange={e => setSearchDept(e.target.value)}
                className="border border-gray-200 rounded-lg text-sm bg-white px-3 py-2 h-10 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent min-w-[120px]"
              >
                <option value="">모든 부서</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
              <select 
                value={searchPos}
                onChange={e => setSearchPos(e.target.value)}
                className="border border-gray-200 rounded-lg text-sm bg-white px-3 py-2 h-10 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent min-w-[120px]"
              >
                <option value="">모든 직급</option>
                {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
              <select 
                value={searchRole}
                onChange={e => setSearchRole(e.target.value)}
                className="border border-gray-200 rounded-lg text-sm bg-white px-3 py-2 h-10 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent min-w-[120px]"
              >
                <option value="">모든 권한</option>
                {ROLE_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select 
                value={searchEmpType}
                onChange={e => setSearchEmpType(e.target.value)}
                className="border border-gray-200 rounded-lg text-sm bg-white px-3 py-2 h-10 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent min-w-[120px]"
              >
                <option value="">모든 고용형태</option>
                {empTypes.map(t => <option key={t.id} value={t.code}>{t.name}</option>)}
              </select>
              <select 
                value={searchStatus}
                onChange={e => setSearchStatus(e.target.value)}
                className="border border-gray-200 rounded-lg text-sm bg-white px-3 py-2 h-10 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent min-w-[120px]"
              >
                <option value="">모든 상태</option>
                {empStatuses.map(s => <option key={s.id} value={s.code}>{s.name}</option>)}
              </select>

              <Button onClick={handleSearch} className="bg-slate-800 hover:bg-slate-700 text-white px-6 shadow-sm border border-slate-800 h-10 shrink-0">
                검색
              </Button>
            </div>

            {/* Bottom Row: Action buttons */}
            <div className="flex flex-wrap justify-end gap-2 w-full mt-2">
              {employees.some(e => e._state === 'C' || e._state === 'D' || e._state === 'U') && (
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
              <Button variant="outline" className="text-gray-700 bg-white shrink-0" onClick={handleExcelDownload}>
                <FileDown className="w-4 h-4 mr-2" />
                엑셀 다운로드
              </Button>
              <Button className="bg-[#107C41] hover:bg-[#0b5c30] text-white" onClick={handleAddRow}>
                <Plus className="w-4 h-4 mr-2" />
                행 추가
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col h-[600px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
            <div className="h-[calc(100vh-280px)] min-h-[400px]">
              <DataGrid 
                columns={columns} 
                data={employees} 
                onDataChange={handleDataChange}
                showCheckboxes={true}
                selectedRowIndices={selectedRowIndices}
                onSelectionChange={setSelectedRowIndices}
                storageKey="erp_employees_grid_columns"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Employee Registration Modal */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">신규 사원 등록</h3>
              <button onClick={() => setIsEmpModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Trash2 className="w-5 h-5 hidden" /> {/* Just for spacing or use an X icon */}
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <form id="newEmpForm" onSubmit={handleModalSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                    <Input required value={newEmpData.name} onChange={e => setNewEmpData({...newEmpData, name: e.target.value})} placeholder="홍길동" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
                    <Input required type="email" value={newEmpData.email} onChange={e => setNewEmpData({...newEmpData, email: e.target.value})} placeholder="hong@example.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 h-10" value={newEmpData.department} onChange={e => setNewEmpData({...newEmpData, department: e.target.value})}>
                      <option value="">선택 안함</option>
                      {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">직급</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 h-10" value={newEmpData.position} onChange={e => setNewEmpData({...newEmpData, position: e.target.value})}>
                      <option value="">선택 안함</option>
                      {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">고용형태</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 h-10" value={newEmpData.employment_type} onChange={e => setNewEmpData({...newEmpData, employment_type: e.target.value})}>
                      {empTypes.map(t => <option key={t.id} value={t.code}>{t.name}</option>)}
                      {empTypes.length === 0 && <option value="정규직">정규직</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">시스템 권한</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 h-10" value={newEmpData.role} onChange={e => setNewEmpData({...newEmpData, role: e.target.value})}>
                      {ROLE_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 h-10" value={newEmpData.status} onChange={e => setNewEmpData({...newEmpData, status: e.target.value})}>
                      {empStatuses.map(s => <option key={s.id} value={s.code}>{s.name}</option>)}
                      {empStatuses.length === 0 && <option value="재직">재직</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">입사일</label>
                    <Input type="date" value={newEmpData.hire_date} onChange={e => setNewEmpData({...newEmpData, hire_date: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                    <Input value={newEmpData.phone} onChange={e => setNewEmpData({...newEmpData, phone: formatPhoneNumber(e.target.value)})} placeholder="010-0000-0000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">기본급 (원)</label>
                    <Input type="number" value={newEmpData.base_salary} onChange={e => setNewEmpData({...newEmpData, base_salary: Number(e.target.value)})} placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
                    <Input type="date" value={newEmpData.birth_date} onChange={e => setNewEmpData({...newEmpData, birth_date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 h-10" value={newEmpData.gender} onChange={e => setNewEmpData({...newEmpData, gender: e.target.value})}>
                      <option value="남성">남성</option>
                      <option value="여성">여성</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">주민등록번호</label>
                    <Input value={newEmpData.resident_num} onChange={e => setNewEmpData({...newEmpData, resident_num: formatResidentNum(e.target.value)})} placeholder="000000-0000000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                    <Input value={newEmpData.address} onChange={e => setNewEmpData({...newEmpData, address: e.target.value})} placeholder="서울특별시 강남구..." />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEmpModalOpen(false)}>취소</Button>
              <Button type="submit" form="newEmpForm" className="bg-[#107C41] hover:bg-[#0b5c30] text-white">표에 임시 추가</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
