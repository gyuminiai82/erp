'use client';

import { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Save, Undo2, FileDown, Search } from 'lucide-react';

export default function ResourcesPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [resources, setResources] = useState<any[]>([]);
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [token, setToken] = useState<string | null>(null);

  const columns: ColumnDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'employee_name', headerName: '이름', width: 150 },
    { field: 'department_name', headerName: '부서', width: 150 },
    { field: 'role', headerName: '역할', },
    { field: 'start_date', headerName: '투입 시작일', width: 120 },
    { field: 'end_date', headerName: '투입 종료일', width: 120 },
    { field: 'participation_rate', headerName: '참여율(M/M)', width: 120 },
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
    fetch(`/api/projects/${selectedProject}/resources`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(data => setResources(Array.isArray(data) ? data : []));
  }, [token, selectedProject]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">투입 인력(M/M) 관리</h1>
          <p className="text-gray-500">프로젝트에 투입된 인원과 참여율을 관리합니다.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="검색어 입력..." className="pl-9 pr-4 border border-gray-200 rounded-lg text-sm bg-white w-full h-10 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent" />
            </div>
            <select 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm bg-white px-3 py-2 h-10 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent min-w-[200px]"
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
          <div className="flex flex-wrap justify-end gap-2 w-full mt-2">
            <Button variant="outline" size="sm" className="h-9 flex items-center bg-white">
              <Plus className="w-4 h-4 mr-1 text-[#107C41]" />
              인력 추가
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
        <div className="flex flex-col h-[calc(100vh-380px)] min-h-[400px] border-t border-gray-200 overflow-hidden bg-white">
          {selectedProject ? (<DataGrid columns={columns} data={resources} showCheckboxes={true} selectedRowIndices={selectedRowIndices} onSelectionChange={setSelectedRowIndices} />) : (<div className="flex items-center justify-center h-full text-gray-500">프로젝트를 선택해주세요.</div>)}
        </div>
      </div>
    </div>
  );
}
