'use client';

import { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';

export default function BudgetPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [budgets, setBudgets] = useState([]);
  const [token, setToken] = useState<string | null>(null);

  const columns: ColumnDef[] = [
    { key: 'id', header: 'ID', width: 60 },
    { key: 'category', header: '항목(카테고리)', width: 150 },
    { key: 'amount', header: '예산 배정액', width: 150 },
    { key: 'spent_amount', header: '집행액', width: 150 },
    { key: 'remarks', header: '비고', flex: 1 },
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
    fetch(`/api/projects/${selectedProject}/budgets`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setBudgets(data));
  }, [token, selectedProject]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">예산 및 비용 관리</h1>
          <p className="text-gray-500 mt-2">프로젝트의 항목별 예산과 실제 지출 내역을 추적합니다.</p>
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
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">예산 추가</button>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-320px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
        {selectedProject ? (
          <DataGrid columns={columns} data={budgets} showCheckboxes={true} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            프로젝트를 선택해주세요.
          </div>
        )}
      </div>
    </div>
  );
}
