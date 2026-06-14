"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/Button";

export default function CommonCodesPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // Modals
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  // Forms
  const [newGroup, setNewGroup] = useState({ code: '', name: '', description: '' });
  const [newCode, setNewCode] = useState({ group_code: '', code: '', name: '', sort_order: 10, is_active: true });

  // Editing state
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editGroupForm, setEditGroupForm] = useState<any>({});
  
  const [editingCodeId, setEditingCodeId] = useState<number | null>(null);
  const [editCodeForm, setEditCodeForm] = useState<any>({});

  const fetchGroups = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/common-code-groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        if (data.length > 0 && !selectedGroup) {
          setSelectedGroup(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchCodes = async (groupCode: string) => {
    setLoadingCodes(true);
    try {
      const res = await fetch(`http://localhost:8000/api/common-codes?group=${groupCode}`);
      if (res.ok) {
        setCodes(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCodes(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchCodes(selectedGroup.code);
    } else {
      setCodes([]);
    }
  }, [selectedGroup]);

  // --- Group Handlers ---
  const handleSaveNewGroup = async () => {
    if (!newGroup.code || !newGroup.name) {
      alert("그룹 코드와 이름을 입력해주세요.");
      return;
    }
    try {
      const res = await fetch("http://localhost:8000/api/common-code-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroup)
      });
      if (res.ok) {
        const addedGroup = await res.json();
        setIsGroupModalOpen(false);
        setNewGroup({ code: '', name: '', description: '' });
        fetchGroups();
        setSelectedGroup(addedGroup);
      } else {
        alert("그룹 추가 실패");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm("그룹을 삭제하시겠습니까? (하위 코드가 있으면 삭제할 수 없습니다)")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/common-code-groups/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedGroup?.id === id) setSelectedGroup(null);
        fetchGroups();
      } else {
        const err = await res.json();
        alert(err.detail || "그룹 삭제 실패");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startEditingGroup = (group: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroupId(group.id);
    setEditGroupForm({ ...group });
  };

  const handleSaveEditGroup = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:8000/api/common-code-groups/${editingGroupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editGroupForm)
      });
      if (res.ok) {
        setEditingGroupId(null);
        fetchGroups();
        if (selectedGroup?.id === editingGroupId) {
          setSelectedGroup(await res.json());
        }
      } else {
        alert("그룹 수정 실패");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- Code Handlers ---
  const handleSaveNewCode = async () => {
    if (!selectedGroup) return;
    if (!newCode.code || !newCode.name) {
      alert("코드와 이름을 입력해주세요.");
      return;
    }
    
    const codePayload = { ...newCode, group_code: selectedGroup.code };
    try {
      const res = await fetch("http://localhost:8000/api/common-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(codePayload)
      });
      if (res.ok) {
        setIsCodeModalOpen(false);
        setNewCode({ group_code: '', code: '', name: '', sort_order: 10, is_active: true });
        fetchCodes(selectedGroup.code);
      } else {
        alert("코드 추가 실패");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCode = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/common-codes/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCodes(selectedGroup.code);
      } else {
        alert("삭제 실패");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startEditingCode = (code: any) => {
    setEditingCodeId(code.id);
    setEditCodeForm({ ...code });
  };

  const handleSaveEditCode = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/common-codes/${editingCodeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editCodeForm)
      });
      if (res.ok) {
        setEditingCodeId(null);
        fetchCodes(selectedGroup.code);
      } else {
        alert("코드 수정 실패");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loadingGroups) return <div className="p-8 text-gray-500">데이터를 불러오는 중...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">공통 코드 관리</h1>
          <p className="text-sm text-gray-500 mt-1">시스템 전반에서 사용되는 기준 정보(고용형태, 상태 등)를 관리합니다.</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Pane: Groups */}
        <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-semibold text-gray-800">그룹 코드</h2>
            <Button onClick={() => setIsGroupModalOpen(true)} size="sm" variant="outline" className="h-8">
              <Plus className="w-4 h-4 mr-1" /> 추가
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {groups.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">등록된 그룹이 없습니다.</div>
            ) : groups.map(group => (
              <div 
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${
                  selectedGroup?.id === group.id 
                    ? 'bg-blue-50 border border-blue-100 shadow-sm' 
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                {editingGroupId === group.id ? (
                  <div className="flex flex-col gap-2 w-full pr-2" onClick={e => e.stopPropagation()}>
                    <input className="border rounded px-2 py-1 text-sm" value={editGroupForm.name} onChange={e => setEditGroupForm({...editGroupForm, name: e.target.value})} placeholder="그룹명" />
                    <input className="border rounded px-2 py-1 text-sm text-gray-500" value={editGroupForm.description || ''} onChange={e => setEditGroupForm({...editGroupForm, description: e.target.value})} placeholder="설명" />
                    <div className="flex justify-end gap-1 mt-1">
                      <Button size="sm" className="h-6 text-xs px-2" onClick={handleSaveEditGroup}>저장</Button>
                      <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={(e) => { e.stopPropagation(); setEditingGroupId(null); }}>취소</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${selectedGroup?.id === group.id ? 'text-blue-700' : 'text-gray-900'}`}>
                          {group.name}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                          {group.code}
                        </span>
                      </div>
                      {group.description && <p className="text-xs text-gray-500 mt-1 truncate">{group.description}</p>}
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => startEditingGroup(group, e)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <ChevronRight className={`w-4 h-4 ml-1 ${selectedGroup?.id === group.id ? 'text-blue-500' : 'text-gray-300'}`} />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Codes */}
        <div className="w-2/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          {selectedGroup ? (
            <>
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-800">{selectedGroup.name} <span className="text-gray-500 font-normal">상세 코드</span></h2>
                </div>
                <Button onClick={() => setIsCodeModalOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 h-8">
                  <Plus className="w-4 h-4 mr-1" /> 코드 추가
                </Button>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white text-gray-500 text-xs uppercase sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 font-medium border-b border-gray-100">코드</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-100">이름(라벨)</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-100">정렬 순서</th>
                      <th className="px-6 py-4 font-medium text-center border-b border-gray-100">상태</th>
                      <th className="px-6 py-4 font-medium text-right border-b border-gray-100">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loadingCodes ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">불러오는 중...</td></tr>
                    ) : codes.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">등록된 상세 코드가 없습니다.</td></tr>
                    ) : codes.map(code => (
                      <tr key={code.id} className="hover:bg-gray-50/50 transition-colors group">
                        {editingCodeId === code.id ? (
                          <>
                            <td className="px-6 py-3">
                              <input className="border rounded px-2 py-1 w-full text-sm" value={editCodeForm.code} onChange={e => setEditCodeForm({...editCodeForm, code: e.target.value})} />
                            </td>
                            <td className="px-6 py-3">
                              <input className="border rounded px-2 py-1 w-full text-sm" value={editCodeForm.name} onChange={e => setEditCodeForm({...editCodeForm, name: e.target.value})} />
                            </td>
                            <td className="px-6 py-3">
                              <input type="number" className="border rounded px-2 py-1 w-20 text-sm" value={editCodeForm.sort_order} onChange={e => setEditCodeForm({...editCodeForm, sort_order: parseInt(e.target.value) || 0})} />
                            </td>
                            <td className="px-6 py-3 text-center">
                              <select className="border rounded px-2 py-1 text-sm" value={editCodeForm.is_active ? 'true' : 'false'} onChange={e => setEditCodeForm({...editCodeForm, is_active: e.target.value === 'true'})}>
                                <option value="true">활성</option>
                                <option value="false">비활성</option>
                              </select>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button onClick={handleSaveEditCode} className="text-green-600 hover:text-green-800 p-1"><Save className="w-4 h-4" /></button>
                                <button onClick={() => setEditingCodeId(null)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 font-medium text-gray-900">{code.code}</td>
                            <td className="px-6 py-4 text-gray-700">{code.name}</td>
                            <td className="px-6 py-4 text-gray-500">{code.sort_order}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium tracking-wide ${code.is_active ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                {code.is_active ? '활성' : '비활성'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEditingCode(code)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteCode(code.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ChevronRight className="w-8 h-8 text-gray-300" />
              </div>
              <p>왼쪽에서 그룹 코드를 선택하면<br/>상세 코드를 관리할 수 있습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[400px] shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">새 그룹 추가</h2>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">그룹 코드 (영문) <span className="text-red-500">*</span></label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={newGroup.code} onChange={e => setNewGroup({...newGroup, code: e.target.value.toUpperCase()})} placeholder="예: EMP_TYPE" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">그룹명 <span className="text-red-500">*</span></label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} placeholder="예: 고용 형태" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={newGroup.description} onChange={e => setNewGroup({...newGroup, description: e.target.value})} placeholder="설명 입력" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-8">
              <Button variant="outline" onClick={() => setIsGroupModalOpen(false)}>취소</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveNewGroup}>저장하기</Button>
            </div>
          </div>
        </div>
      )}

      {/* Code Modal */}
      {isCodeModalOpen && selectedGroup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[400px] shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">새 상세 코드 추가</h2>
              <button onClick={() => setIsCodeModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex justify-between items-center">
              <span className="text-sm font-medium text-blue-900">선택된 그룹</span>
              <span className="text-sm font-bold text-blue-700">{selectedGroup.name} ({selectedGroup.code})</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">코드 값 <span className="text-red-500">*</span></label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={newCode.code} onChange={e => setNewCode({...newCode, code: e.target.value})} placeholder="예: FULL_TIME" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 (표시 라벨) <span className="text-red-500">*</span></label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={newCode.name} onChange={e => setNewCode({...newCode, name: e.target.value})} placeholder="예: 정규직" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">정렬 순서</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={newCode.sort_order} onChange={e => setNewCode({...newCode, sort_order: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={newCode.is_active ? 'true' : 'false'} onChange={e => setNewCode({...newCode, is_active: e.target.value === 'true'})}>
                    <option value="true">활성</option>
                    <option value="false">비활성</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-8">
              <Button variant="outline" onClick={() => setIsCodeModalOpen(false)}>취소</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveNewCode}>저장하기</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
