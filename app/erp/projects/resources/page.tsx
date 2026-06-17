'use client';

import { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';

export default function ResourcesPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [resources, setResources] = useState([]);
  const [token, setToken] = useState<string | null>(null);

  const columns: ColumnDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'employee_name', headerName: '이름', width: 150 },
    { field: 'department_name', headerName: '부서', width: 150 },
    { field: 'role', headerName: '역할', flex: 1 },
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
    <div className="p-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">투입 인력(M/M) 관리</h1>
          <p className="text-gray-500 mt-2">프로젝트에 투입된 인원과 참여율을 관리합니다.</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedProject} 
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded"
          >
            <option value="">프로젝트 선택</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">인력 추가</button>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-320px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
        {selectedProject ? (
          <DataGrid columns={columns} data={resources} showCheckboxes={true} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            프로젝트를 선택해주세요.
          </div>
        )}
      </div>
    </div>
  );
}
