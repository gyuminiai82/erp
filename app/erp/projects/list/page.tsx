'use client';

import { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';

export default function ProjectListPage() {
  const [projects, setProjects] = useState([]);
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
        .then(res => res.json())
        .then(data => setProjects(data));
    }
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">프로젝트 조회/등록</h1>
          <p className="text-gray-500 mt-2">전체 프로젝트의 기본 정보와 현황을 관리합니다.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">프로젝트 등록</button>
      </div>

      <div className="flex flex-col h-[calc(100vh-320px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
        <DataGrid columns={columns} data={projects} showCheckboxes={true} />
      </div>
    </div>
  );
}
