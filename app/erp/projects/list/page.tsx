'use client';

import { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Save, Undo2, FileDown } from 'lucide-react';

export default function ProjectListPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [token, setToken] = useState<string | null>(null);

  const columns: ColumnDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'name', headerName: '프로젝트명', flex: 1 },
    { field: 'client_name', headerName: '고객사', width: 150 },
    { field: 'manager_name', headerName: 'PM', width: 100 },
    { field: 'start_date', headerName: '시작일', width: 120 },
    { field: 'end_date', headerName: '종료일', width: 120 },
    { field: 'status', headerName: '상태', width: 100 },
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

  return (
    <div className="p-6 bg-gray-50/30 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">프로젝트 조회/등록</h1>
          <p className="text-gray-500 mt-2">전체 프로젝트의 기본 정보와 현황을 관리합니다.</p>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-320px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
        <div className="p-4 border-b border-gray-200 flex flex-col gap-4 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <input type="text" placeholder="검색어 입력..." className="px-3 py-2 border border-gray-300 rounded text-sm w-64 outline-none focus:border-[#107C41]" />
            
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
              프로젝트 등록
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
          <DataGrid columns={columns} data={projects} showCheckboxes={true} selectedRowIndices={selectedRowIndices} onSelectionChange={setSelectedRowIndices} />
        </div>
      </div>
    </div>
  );
}
