"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Building2, Briefcase } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function DepartmentsPage() {

  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Department Modal State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deptForm, setDeptForm] = useState({ name: '', manager_id: '' });

  // Position Modal State
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<any>(null);
  const [posForm, setPosForm] = useState({ name: '', level: 10, description: '' });

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: 'dept' | 'pos' } | null>(null);

  const fetchData = async () => {
    try {
      const [deptRes, posRes, empRes] = await Promise.all([
        fetch("http://localhost:8000/api/departments"),
        fetch("http://localhost:8000/api/positions"),
        fetch("http://localhost:8000/api/employees")
      ]);
      
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (posRes.ok) setPositions(await posRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Department Functions
  const handleSaveDept = async () => {
    if (!deptForm.name.trim()) return alert("부서명을 입력해주세요.");
    
    const url = editingDept ? `http://localhost:8000/api/departments/${editingDept.id}` : "http://localhost:8000/api/departments";
    const method = editingDept ? "PUT" : "POST";
    
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: deptForm.name,
          manager_id: deptForm.manager_id ? Number(deptForm.manager_id) : null
        })
      });
      
      if (res.ok) {
        setIsDeptModalOpen(false);
        setEditingDept(null);
        setDeptForm({ name: '', manager_id: '' });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.detail || "저장 실패");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const typeStr = deleteTarget.type === 'dept' ? 'departments' : 'positions';
      const res = await fetch(`http://localhost:8000/api/${typeStr}/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.detail || "삭제 실패");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteTarget(null);
    }
  };

  // Position Functions
  const handleSavePos = async () => {
    if (!posForm.name.trim()) return alert("직급명을 입력해주세요.");
    
    const url = editingPos ? `http://localhost:8000/api/positions/${editingPos.id}` : "http://localhost:8000/api/positions";
    const method = editingPos ? "PUT" : "POST";
    
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: posForm.name,
          level: Number(posForm.level),
          description: posForm.description
        })
      });
      
      if (res.ok) {
        setIsPosModalOpen(false);
        setEditingPos(null);
        setPosForm({ name: '', level: 10, description: '' });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.detail || "저장 실패");
      }
    } catch (e) {
      console.error(e);
    }
  };



  if (loading) return <div className="p-8 text-gray-500 text-center">조직 데이터를 불러오는 중...</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">조직(부서/직급) 관리</h1>
          <p className="text-gray-500">회사의 조직 구조인 부서와 직급 체계를 관리합니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-semibold text-gray-800">전체 부서 목록</h2>
              <Button onClick={() => {
                setEditingDept(null);
                setDeptForm({ name: '', manager_id: '' });
                setIsDeptModalOpen(true);
              }} className="bg-blue-600 hover:bg-blue-700 text-white h-9">
                <Plus className="w-4 h-4 mr-1.5" />
                부서 추가
              </Button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-6 font-semibold">부서명</th>
                  <th className="py-3 px-6 font-semibold">부서장</th>
                  <th className="py-3 px-6 font-semibold text-right">관리</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {departments.map((dept) => {
                  const manager = employees.find(e => e.id === dept.manager_id);
                  return (
                    <tr key={dept.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-6 font-medium text-gray-900">{dept.name}</td>
                      <td className="py-3 px-6 text-gray-600">{manager ? `${manager.name} (${manager.emp_no})` : '-'}</td>
                      <td className="py-3 px-6 text-right space-x-2">
                        <button onClick={() => {
                          setEditingDept(dept);
                          setDeptForm({ name: dept.name, manager_id: dept.manager_id || '' });
                          setIsDeptModalOpen(true);
                        }} className="text-gray-400 hover:text-blue-600 p-1">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget({ id: dept.id, type: 'dept' })} className="text-gray-400 hover:text-red-600 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {departments.length === 0 && (
                  <tr><td colSpan={3} className="py-8 text-center text-gray-500">등록된 부서가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-semibold text-gray-800">전체 직급 목록</h2>
              <Button onClick={() => {
                setEditingPos(null);
                setPosForm({ name: '', level: 10, description: '' });
                setIsPosModalOpen(true);
              }} className="bg-blue-600 hover:bg-blue-700 text-white h-9">
                <Plus className="w-4 h-4 mr-1.5" />
                직급 추가
              </Button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-6 font-semibold w-24">레벨</th>
                  <th className="py-3 px-6 font-semibold">직급명</th>
                  <th className="py-3 px-6 font-semibold">설명</th>
                  <th className="py-3 px-6 font-semibold text-right">관리</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {positions.map((pos) => (
                  <tr key={pos.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-6 text-gray-500">{pos.level}</td>
                    <td className="py-3 px-6 font-medium text-gray-900">{pos.name}</td>
                    <td className="py-3 px-6 text-gray-500">{pos.description || '-'}</td>
                    <td className="py-3 px-6 text-right space-x-2">
                      <button onClick={() => {
                        setEditingPos(pos);
                        setPosForm({ name: pos.name, level: pos.level, description: pos.description || '' });
                        setIsPosModalOpen(true);
                      }} className="text-gray-400 hover:text-blue-600 p-1">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget({ id: pos.id, type: 'pos' })} className="text-gray-400 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {positions.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500">등록된 직급이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
        </div>
      </div>

      {/* Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{editingDept ? '부서 수정' : '부서 추가'}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부서명</label>
                <Input value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} placeholder="개발팀" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부서장 (선택)</label>
                <select 
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={deptForm.manager_id}
                  onChange={e => setDeptForm({...deptForm, manager_id: e.target.value})}
                >
                  <option value="">지정 안함</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.emp_no})</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsDeptModalOpen(false)}>취소</Button>
              <Button onClick={handleSaveDept} className="bg-blue-600 hover:bg-blue-700 text-white">저장</Button>
            </div>
          </div>
        </div>
      )}

      {/* Position Modal */}
      {isPosModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{editingPos ? '직급 수정' : '직급 추가'}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">직급명</label>
                <Input value={posForm.name} onChange={e => setPosForm({...posForm, name: e.target.value})} placeholder="사원, 대리 등" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">레벨 (정렬 순서)</label>
                <Input type="number" value={posForm.level} onChange={e => setPosForm({...posForm, level: Number(e.target.value)})} />
                <p className="text-xs text-gray-500 mt-1">숫자가 작을수록 높은 직급입니다. (예: 사장 1, 팀장 5, 사원 10)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <Input value={posForm.description} onChange={e => setPosForm({...posForm, description: e.target.value})} placeholder="직급 설명" />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsPosModalOpen(false)}>취소</Button>
              <Button onClick={handleSavePos} className="bg-blue-600 hover:bg-blue-700 text-white">저장</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">삭제 확인</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                정말 이 {deleteTarget.type === 'dept' ? '부서를' : '직급을'} 삭제하시겠습니까?
                <br />
                <span className="text-sm text-gray-500">(소속된 사원이 없어야 삭제 가능합니다)</span>
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>취소</Button>
              <Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white">삭제</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
