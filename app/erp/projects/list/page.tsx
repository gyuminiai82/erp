'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileDown, Search, Undo2, Save } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { useDialog } from "@/components/providers/DialogProvider";

interface Project {
  id: number;
  name: string;
  client_id: number | null;
  client_name: string | null;
  manager_id: number | null;
  manager_name: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  status: string;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<{id: number, name: string}[]>([]);
  const [employees, setEmployees] = useState<{id: number, name: string}[]>([]);
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const { showAlert, showConfirm } = useDialog();
  
  // Form state
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState<number | ''>('');
  const [managerId, setManagerId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState(0);
  const [status, setStatus] = useState('PLANNED');

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
    try {
      const [resClients, resEmp] = await Promise.all([
        fetch('/api/clients', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (resClients.ok) setClients(await resClients.json());
      if (resEmp.ok) setEmployees(await resEmp.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("프로젝트명을 입력하세요.");
      return;
    }

    const payload = {
      name,
      client_id: clientId || null,
      manager_id: managerId || null,
      start_date: startDate || null,
      end_date: endDate || null,
      budget,
      status
    };

    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setName(''); setClientId(''); setManagerId(''); setStartDate(''); setEndDate(''); setBudget(0); setStatus('PLANNED');
        fetchProjects();
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    }
  };

  const columns: ColumnDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'name', headerName: '프로젝트명', width: 200, editable: true },
    { 
      field: 'client_id', 
      headerName: '발주처', 
      width: 150, 
      editable: true,
      editType: 'select',
      options: clients.map(c => ({ label: c.name, value: c.id })),
      renderCell: (v: any) => clients.find(c => c.id === v)?.name || '-'
    },
    { 
      field: 'manager_id', 
      headerName: 'PM(담당자)', 
      width: 120,
      editable: true,
      editType: 'select',
      options: employees.map(e => ({ label: e.name, value: e.id })),
      renderCell: (v: any) => employees.find(e => e.id === v)?.name || '-'
    },
    { field: 'start_date', headerName: '시작일', width: 120, editable: true },
    { field: 'end_date', headerName: '종료일', width: 120, editable: true },
    { field: 'budget', headerName: '예산', width: 120, editable: true, renderCell: (val: any) => Number(val || 0).toLocaleString() + '원' },
    { 
      field: 'status', 
      headerName: '상태', 
      width: 100,
      editable: true,
      editType: 'select',
      options: [
        { label: 'PLANNED', value: 'PLANNED' },
        { label: 'IN_PROGRESS', value: 'IN_PROGRESS' },
        { label: 'COMPLETED', value: 'COMPLETED' },
        { label: 'ON_HOLD', value: 'ON_HOLD' }
      ]
    }
  ];

  const handleDataChange = (rowIndex: number, field: string, value: any) => {
    const updated = [...projects];
    updated[rowIndex] = { ...updated[rowIndex], [field]: value, _state: 'U' } as any;
    setProjects(updated);
  };

  const handleCancel = () => {
    // Reset any pending U states
    const reverted = projects.map(p => {
      if ((p as any)._state === 'U') {
        const { _state, ...rest } = p as any;
        return rest;
      }
      return p;
    });
    // In a real app we might want to refetch to get the original data back.
    // Let's just refetch.
    fetchProjects();
    setSelectedRowIndices([]);
  };

  const handleSave = async () => {
    const rowsToUpdate = (projects as any[]).filter(p => p._state === 'U');
    if (rowsToUpdate.length === 0) {
      await showAlert("저장할 변경사항이 없습니다.", { type: "info" });
      return;
    }
    
    const confirmed = await showConfirm(`총 ${rowsToUpdate.length}건의 수정사항을 저장하시겠습니까?`, { type: "warning" });
    if (!confirmed) return;
    
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const payload = rowsToUpdate.map(p => ({
        id: p.id,
        name: p.name,
        client_id: p.client_id ? Number(p.client_id) : null,
        manager_id: p.manager_id ? Number(p.manager_id) : null,
        start_date: p.start_date || null,
        end_date: p.end_date || null,
        budget: Number(p.budget) || 0,
        status: p.status
      }));
      
      const res = await fetch('/api/projects/bulk-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ projects: payload })
      });
      
      if (res.ok) {
        await showAlert("저장되었습니다.", { type: "success" });
        fetchProjects();
      } else {
        const err = await res.json();
        await showAlert(err.detail || "저장에 실패했습니다.", { type: "error" });
      }
    } catch (e: any) {
      console.error(e);
      await showAlert("오류가 발생했습니다.", { type: "error" });
    }
  };

  const handleDelete = async () => {
    if (selectedRowIndices.length === 0) return;
    const confirmed = await showConfirm(`선택한 ${selectedRowIndices.length}개의 프로젝트를 삭제하시겠습니까?`, { type: "warning" });
    if (!confirmed) return;
    
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const idsToDelete = selectedRowIndices.map(idx => projects[idx].id);
      
      const res = await fetch('/api/projects/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ project_ids: idsToDelete })
      });
      
      if (res.ok) {
        setSelectedRowIndices([]);
        await showAlert("삭제되었습니다.", { type: "success" });
        fetchProjects();
      } else {
        const err = await res.json();
        await showAlert(err.detail || "삭제에 실패했습니다.", { type: "error" });
      }
    } catch (e: any) {
      console.error(e);
      await showAlert("오류가 발생했습니다.", { type: "error" });
    }
  };

  const handleSearch = () => {
    // In a real app, you would filter projects based on searchKeyword.
    // For now, this is a placeholder matching the layout.
    fetchProjects();
  };

  const filteredProjects = projects.filter(p => 
    searchKeyword === '' || 
    p.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (p.client_name && p.client_name.toLowerCase().includes(searchKeyword.toLowerCase())) ||
    (p.manager_name && p.manager_name.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">프로젝트 현황</h1>
          <p className="text-gray-500">사내 프로젝트 및 계약 건의 일정과 예산을 관리합니다.</p>
        </div>
        <div className="flex space-x-2">
          {/* Action buttons have been moved to the DataGrid toolbar */}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50/50">
          <div className="flex flex-col gap-4 mb-4">
            {/* Top Row: Search Input and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input 
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  onKeyDown={e => { if(e.key === 'Enter') handleSearch(); }}
                  className="pl-9 pr-4 bg-white w-full h-10 focus:z-10 relative" 
                  placeholder="프로젝트명, 발주처 검색..." 
                />
              </div>

              <Button variant="secondary" onClick={handleSearch} className="h-10 px-6 shrink-0">
                조회
              </Button>
              <Button variant="secondary" onClick={() => {setSearchKeyword(''); fetchProjects();}} className="h-10 px-3 shrink-0" title="초기화">
                <Undo2 className="w-4 h-4 text-[#107C41]" />
              </Button>
            </div>

            {/* Bottom Row: Action buttons */}
            <div className="flex flex-wrap justify-end gap-2 w-full mt-2">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)} className="h-9 flex items-center bg-white">
                <Plus className="w-4 h-4 mr-1 text-[#107C41]" />
                프로젝트 추가
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDelete} 
                disabled={selectedRowIndices.length === 0}
                className={`h-9 flex items-center ${selectedRowIndices.length > 0 ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200' : ''}`}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                선택 삭제
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={!(projects as any[]).some(p => p._state === 'U')}
                className="h-9 flex items-center bg-[#107C41] hover:bg-[#0c5e31] text-white"
              >
                <Save className="w-4 h-4 mr-1" />
                저장
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel} 
                disabled={!(projects as any[]).some(p => p._state === 'U')}
                className="h-9 flex items-center"
              >
                <Undo2 className="w-4 h-4 mr-1" />
                변경 취소
              </Button>
              <Button variant="outline" size="sm" className="h-9 flex items-center bg-white">
                <FileDown className="w-4 h-4 mr-1 text-[#107C41]" />
                엑셀 다운로드
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col h-[calc(100vh-380px)] min-h-[400px] border border-gray-300 rounded-md overflow-hidden bg-white">
              <DataGrid 
                columns={columns} 
                data={filteredProjects} 
                onDataChange={handleDataChange}
                showCheckboxes={true}
                selectedRowIndices={selectedRowIndices}
                onSelectionChange={setSelectedRowIndices}
                storageKey="erp_projects_grid_columns"
              />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">새 프로젝트 추가</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트명</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">발주처</label>
                  <select value={clientId} onChange={e => setClientId(Number(e.target.value) || '')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                    <option value="">선택 안함</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자(PM)</label>
                  <select value={managerId} onChange={e => setManagerId(Number(e.target.value) || '')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                    <option value="">선택 안함</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">예산(원)</label>
                <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                  <option value="PLANNED">계획 (PLANNED)</option>
                  <option value="IN_PROGRESS">진행중 (IN_PROGRESS)</option>
                  <option value="COMPLETED">완료 (COMPLETED)</option>
                  <option value="ON_HOLD">보류 (ON_HOLD)</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>취소</Button>
                <Button type="submit" className="bg-[#107C41] hover:bg-[#0b5c30] text-white">저장</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
