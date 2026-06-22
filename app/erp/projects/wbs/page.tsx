'use client';

import { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Save, Undo2, FileDown, Search } from 'lucide-react';

export default function WBSPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [originalTasks, setOriginalTasks] = useState<any[]>([]);
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    name: '',
    assignee_name: '',
    start_date: '',
    end_date: '',
    status: 'TODO',
    progress: 0
  });
  
  // Use a dialog provider if needed, or window.alert
  const showAlert = (msg: string) => window.alert(msg);

  const columns: ColumnDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'name', headerName: '작업명', editable: true },
    { field: 'assignee_name', headerName: '담당자', width: 120, editable: true },
    { field: 'start_date', headerName: '시작일', width: 120, editable: true, editType: 'date' },
    { field: 'end_date', headerName: '종료일', width: 120, editable: true, editType: 'date' },
    { field: 'status', headerName: '상태', width: 100, editable: true, editType: 'select', options: [{label: 'TODO', value: 'TODO'}, {label: 'IN_PROGRESS', value: 'IN_PROGRESS'}, {label: 'DONE', value: 'DONE'}] },
    { field: 'progress', headerName: '진척도(%)', width: 100, editable: true },
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

  const fetchTasks = () => {
    if (!token || !selectedProject) return;
    fetch(`/api/projects/${selectedProject}/tasks`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setTasks(arr);
        setOriginalTasks(arr);
        setSelectedRowIndices([]);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, [token, selectedProject]);

  const handleAddRow = () => {
    if (!selectedProject) {
      showAlert('프로젝트를 먼저 선택해주세요.');
      return;
    }
    setNewTaskData({
      name: '',
      assignee_name: '',
      start_date: '',
      end_date: '',
      status: 'TODO',
      progress: 0
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskData.name) {
      showAlert('작업명을 입력해주세요.');
      return;
    }
    const newTemp = {
      id: `temp_${Date.now()}`,
      ...newTaskData,
      _state: 'C'
    };
    setTasks([newTemp, ...tasks]);
    setIsModalOpen(false);
  };

  const handleDataChange = (rowIndex: number, field: string, value: any) => {
    const updated = [...tasks];
    updated[rowIndex] = { ...updated[rowIndex], [field]: value, _state: updated[rowIndex]._state === 'C' ? 'C' : 'U' };
    setTasks(updated);
  };

  const handleBulkDelete = () => {
    if (selectedRowIndices.length === 0) return;
    const newTasks = tasks.filter((task, idx) => {
      if (selectedRowIndices.includes(idx)) {
        if (task._state === 'C' || String(task.id).startsWith('temp_')) {
          return false;
        } else {
          task._state = 'D';
          return true;
        }
      }
      return true;
    });
    setTasks(newTasks);
    setSelectedRowIndices([]);
  };

  const hasChanges = tasks.some(t => t._state === 'C' || t._state === 'U' || t._state === 'D');

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">WBS 작업 관리</h1>
          <p className="text-gray-500">프로젝트별 세부 작업을 관리하고 진척도를 추적합니다.</p>
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
            <Button variant="outline" size="sm" className="h-9 flex items-center bg-white" onClick={handleAddRow}>
              <Plus className="w-4 h-4 mr-1 text-[#107C41]" />
              작업 추가
            </Button>
            <Button variant="outline" size="sm" className={`h-9 flex items-center ${selectedRowIndices.length > 0 ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200' : ''}`} disabled={selectedRowIndices.length === 0} onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              선택 삭제
            </Button>
            <Button size="sm" className="h-9 flex items-center bg-[#107C41] hover:bg-[#0c5e31] text-white" disabled={!hasChanges} onClick={() => showAlert("저장 기능은 곧 업데이트 예정입니다.")}>
              <Save className="w-4 h-4 mr-1" />
              저장
            </Button>
            <Button variant="outline" size="sm" className="h-9 flex items-center" disabled={!hasChanges} onClick={() => { setTasks([...originalTasks]); setSelectedRowIndices([]); }}>
              <Undo2 className="w-4 h-4 mr-1" />
              변경 취소
            </Button>
            <Button variant="outline" size="sm" className="h-9 flex items-center bg-white">
              <FileDown className="w-4 h-4 mr-1 text-[#107C41]" />
              엑셀 다운로드
            </Button>
          </div>
        </div>
        <div className="flex flex-col h-[calc(100vh-380px)] min-h-[400px] border-t border-gray-200 overflow-hidden bg-white">
          {selectedProject ? (<DataGrid columns={columns} data={tasks} showCheckboxes={true} selectedRowIndices={selectedRowIndices} onSelectionChange={setSelectedRowIndices} onDataChange={handleDataChange} />) : (<div className="flex items-center justify-center h-full text-gray-500">프로젝트를 선택해주세요.</div>)}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">새 작업 추가</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2 text-sm text-blue-800 shadow-sm">
                <span className="text-blue-500 font-bold">ℹ️</span>
                <p className="text-blue-700/90 whitespace-normal break-keep">
                  하단의 <strong className="text-blue-900">[표에 임시 추가]</strong> 후, 반드시 표 상단의 <strong className="text-blue-900 bg-white px-1 py-0.5 rounded border border-blue-200">[저장]</strong>을 눌러야 최종 반영됩니다.
                </p>
              </div>
              <form id="newTaskForm" onSubmit={handleModalSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">작업명 *</label>
                    <input type="text" required value={newTaskData.name} onChange={e => setNewTaskData({...newTaskData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#107C41] focus:border-[#107C41]" placeholder="작업명을 입력하세요" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                    <input type="text" value={newTaskData.assignee_name} onChange={e => setNewTaskData({...newTaskData, assignee_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#107C41] focus:border-[#107C41]" placeholder="담당자 이름" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                    <input type="date" value={newTaskData.start_date} onChange={e => setNewTaskData({...newTaskData, start_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#107C41] focus:border-[#107C41]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                    <input type="date" value={newTaskData.end_date} onChange={e => setNewTaskData({...newTaskData, end_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#107C41] focus:border-[#107C41]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                    <select value={newTaskData.status} onChange={e => setNewTaskData({...newTaskData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#107C41] focus:border-[#107C41]">
                      <option value="TODO">TODO (대기)</option>
                      <option value="IN_PROGRESS">IN_PROGRESS (진행중)</option>
                      <option value="DONE">DONE (완료)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">진척도 (%)</label>
                    <input type="number" min="0" max="100" value={newTaskData.progress} onChange={e => setNewTaskData({...newTaskData, progress: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#107C41] focus:border-[#107C41]" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>취소</Button>
              <Button type="submit" form="newTaskForm" className="bg-[#107C41] hover:bg-[#0b5c30] text-white">표에 임시 추가</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
