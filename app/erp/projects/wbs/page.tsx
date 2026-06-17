'use client';

import { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';

export default function WBSPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [tasks, setTasks] = useState([]);
  const [token, setToken] = useState<string | null>(null);

  const columns: ColumnDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'name', headerName: '작업명', flex: 1 },
    { field: 'assignee_name', headerName: '담당자', width: 120 },
    { field: 'start_date', headerName: '시작일', width: 120 },
    { field: 'end_date', headerName: '종료일', width: 120 },
    { field: 'status', headerName: '상태', width: 100 },
    { field: 'progress', headerName: '진척도(%)', width: 100 },
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

  useEffect(() => {
    if (!token || !selectedProject) return;
    fetch(`/api/projects/${selectedProject}/tasks`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setTasks(data));
  }, [token, selectedProject]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">WBS 작업 관리</h1>
          <p className="text-gray-500 mt-2">프로젝트별 세부 작업을 관리하고 진척도를 추적합니다.</p>
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
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">작업 추가</button>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-320px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
        {selectedProject ? (
          <DataGrid columns={columns} data={tasks} showCheckboxes={true} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            프로젝트를 선택해주세요.
          </div>
        )}
      </div>
    </div>
  );
}
