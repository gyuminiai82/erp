'use client';

import { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Save, Undo2, FileDown } from 'lucide-react';

export default function BudgetPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [token, setToken] = useState<string | null>(null);

  const columns: ColumnDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'category', headerName: '항목(카테고리)', width: 150 },
    { field: 'amount', headerName: '예산 배정액', width: 150 },
    { field: 'spent_amount', headerName: '집행액', width: 150 },
    { field: 'remarks', headerName: '비고', flex: 1 },
  ];

  useEffect(() => {
    const t = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
    if (t) {
      setToken(t);
      fetch('/api/projects', { headers: { Authorization: `Bearer ${t}` } })
        .then(res => res.ok ? res.json() : [])
        .then(data => setProjects(Array.isArray(data) ? data : []));
    }
  }, []);

  useEffect(() => {
    if (!token || !selectedProject) return;
    fetch(`/api/projects/${selectedProject}/budgets`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(data => setBudgets(Array.isArray(data) ? data : []));
  }, [token, selectedProject]);

  return (
    <div className="p-6 bg-gray-50/30 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">예산 및 비용 관리</h1>
          <p className="text-gray-500 mt-2">프로젝트의 항목별 예산과 실제 지출 내역을 추적합니다.</p>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-320px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
        <div className="p-4 border-b border-gray-200 flex flex-col gap-4 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <input type="text" placeholder="검색어 입력..." className="px-3 py-2 border border-gray-300 rounded text-sm w-64 outline-none focus:border-[#107C41]" />
            <select 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm min-w-[200px] outline-none focus:border-blue-500"
            >
              <option value="">프로젝트 선택</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <Button variant="secondary" className="h-10 px-6 shrink-0">
              조회
            </Button>
            <Button variant="secondary" className="h-10 px-3 shrink-0" title="초기화">
              <Undo2 className="w-4 h-4 text-[#107C41]" />
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="h-9 flex items-center bg-white">
              <Plus className="w-4 h-4 mr-1 text-[#107C41]" />
              예산 추가
            </Button>
            <Button variant="outline" size="sm" className="h-9 flex items-center" disabled={selectedRowIndices.length === 0}>
              <Trash2 className="w-4 h-4 mr-1" />
              선택 삭제
            </Button>
            <Button size="sm" className="h-9 flex items-center bg-[#107C41] hover:bg-[#0c5e31] text-white" disabled={true}>
              <Save className="w-4 h-4 mr-1" />
              저장
            </Button>
            <Button variant="outline" size="sm" className="h-9 flex items-center bg-white">
              <FileDown className="w-4 h-4 mr-1 text-[#107C41]" />
              엑셀 다운로드
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative">
          {selectedProject ? (<DataGrid columns={columns} data={budgets} showCheckboxes={true} selectedRowIndices={selectedRowIndices} onSelectionChange={setSelectedRowIndices} />) : (<div className="flex items-center justify-center h-full text-gray-500">프로젝트를 선택해주세요.</div>)}
        </div>
      </div>
    </div>
  );
}
