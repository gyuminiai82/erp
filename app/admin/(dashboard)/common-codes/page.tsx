"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { Button } from "@/components/ui/Button";

export default function CommonCodesPage() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // For adding a new code
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState({ group_code: '', code: '', name: '', sort_order: 10, is_active: true });

  // For editing an existing row
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const fetchData = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/common-codes");
      if (res.ok) {
        setCodes(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/common-codes/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("삭제 실패");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNew = async () => {
    if (!newCode.group_code || !newCode.code || !newCode.name) {
      alert("필수 항목(그룹, 코드, 이름)을 입력해주세요.");
      return;
    }
    
    try {
      const res = await fetch("http://localhost:8000/api/common-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCode)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewCode({ group_code: '', code: '', name: '', sort_order: 10, is_active: true });
        fetchData();
      } else {
        alert("추가 실패");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startEditing = (code: any) => {
    setEditingId(code.id);
    setEditForm({ ...code });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/common-codes/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setEditingId(null);
        fetchData();
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "수정 실패");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">데이터를 불러오는 중...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">공통 코드 관리</h1>
          <p className="text-sm text-gray-500 mt-1">시스템 전반에서 사용되는 기준 정보(고용형태, 상태 등)를 관리합니다.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          코드 등록
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 p-6">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 font-medium rounded-tl-lg">그룹 코드</th>
                <th className="px-6 py-4 font-medium">코드</th>
                <th className="px-6 py-4 font-medium">이름(라벨)</th>
                <th className="px-6 py-4 font-medium">정렬 순서</th>
                <th className="px-6 py-4 font-medium text-center">상태</th>
                <th className="px-6 py-4 font-medium text-right rounded-tr-lg">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    등록된 공통 코드가 없습니다.
                  </td>
                </tr>
              ) : codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50/50 transition-colors">
                  {editingId === code.id ? (
                    <>
                      <td className="px-6 py-3">
                        <input 
                          className="border rounded px-2 py-1 w-full text-sm" 
                          value={editForm.group_code} 
                          onChange={e => setEditForm({...editForm, group_code: e.target.value})} 
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input 
                          className="border rounded px-2 py-1 w-full text-sm" 
                          value={editForm.code} 
                          onChange={e => setEditForm({...editForm, code: e.target.value})} 
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input 
                          className="border rounded px-2 py-1 w-full text-sm" 
                          value={editForm.name} 
                          onChange={e => setEditForm({...editForm, name: e.target.value})} 
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input 
                          type="number"
                          className="border rounded px-2 py-1 w-full text-sm" 
                          value={editForm.sort_order} 
                          onChange={e => setEditForm({...editForm, sort_order: parseInt(e.target.value) || 0})} 
                        />
                      </td>
                      <td className="px-6 py-3 text-center">
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={editForm.is_active ? 'true' : 'false'}
                          onChange={e => setEditForm({...editForm, is_active: e.target.value === 'true'})}
                        >
                          <option value="true">활성</option>
                          <option value="false">비활성</option>
                        </select>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 p-1" title="저장">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEditing} className="text-gray-400 hover:text-gray-600 p-1" title="취소">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-medium text-gray-900">{code.group_code}</td>
                      <td className="px-6 py-4 text-gray-600">{code.code}</td>
                      <td className="px-6 py-4 text-gray-900">{code.name}</td>
                      <td className="px-6 py-4 text-gray-500">{code.sort_order}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${code.is_active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                          {code.is_active ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => startEditing(code)} className="text-gray-400 hover:text-blue-600 p-1 transition-colors" title="수정">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(code.id)} className="text-gray-400 hover:text-red-600 p-1 transition-colors" title="삭제">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[400px] shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">새 공통 코드 등록</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">그룹 코드 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value={newCode.group_code}
                  onChange={e => setNewCode({...newCode, group_code: e.target.value})}
                  placeholder="예: EMP_TYPE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">코드 값 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value={newCode.code}
                  onChange={e => setNewCode({...newCode, code: e.target.value})}
                  placeholder="예: FULL_TIME"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 (표시 라벨) <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value={newCode.name}
                  onChange={e => setNewCode({...newCode, name: e.target.value})}
                  placeholder="예: 정규직"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">정렬 순서</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={newCode.sort_order}
                    onChange={e => setNewCode({...newCode, sort_order: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newCode.is_active ? 'true' : 'false'}
                    onChange={e => setNewCode({...newCode, is_active: e.target.value === 'true'})}
                  >
                    <option value="true">활성</option>
                    <option value="false">비활성</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-8">
              <Button variant="outline" className="border-gray-200 text-gray-700" onClick={() => setIsModalOpen(false)}>취소</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveNew}>저장하기</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
