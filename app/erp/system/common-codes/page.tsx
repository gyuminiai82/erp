"use client";

import React, { useState, useEffect } from 'react';
import DataGrid, { ColumnDef } from "@/components/ui/DataGrid";
import { Plus, Save, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/Button";

export default function CommonCodesPage() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // For adding a new code
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState({ group_code: '', code: '', name: '', sort_order: 10, is_active: true });

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

  const handleDataChange = async (rowIndex: number, field: string, value: any) => {
    const code = codes[rowIndex];
    if (!code) return;

    // Update state optimistically
    const updatedCodes = [...codes];
    updatedCodes[rowIndex] = { ...updatedCodes[rowIndex], [field]: value };
    setCodes(updatedCodes);

    // Call API
    try {
      const payload: any = {};
      payload[field] = value;
      
      const res = await fetch(`http://localhost:8000/api/common-codes/${code.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        // Revert on failure
        fetchData();
        const errorData = await res.json();
        alert(errorData.detail || "수정 실패");
      }
    } catch (e) {
      console.error(e);
      fetchData();
    }
  };

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

  const columns: ColumnDef[] = [
    { field: 'group_code', headerName: '그룹 코드', width: 150, editable: true },
    { field: 'code', headerName: '코드', width: 150, editable: true },
    { field: 'name', headerName: '이름(라벨)', width: 200, editable: true },
    { field: 'sort_order', headerName: '정렬 순서', width: 100, editable: true },
    { 
      field: 'is_active', 
      headerName: '활성 여부', 
      width: 100, 
      editable: true,
      editType: 'select',
      options: [{ label: '활성', value: true }, { label: '비활성', value: false }],
      renderCell: (val: any) => val ? '활성' : '비활성'
    },
    {
      field: 'actions',
      headerName: '관리',
      width: 100,
      renderCell: (val: any, row: any) => (
        <button 
          onClick={() => handleDelete(row.id)}
          className="text-red-500 hover:text-red-700 flex items-center justify-center w-full h-full"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  if (loading) return <div className="p-8 text-gray-500">데이터를 불러오는 중...</div>;

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e5e5e5]">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">공통 코드 관리</h1>
          <p className="text-sm text-gray-500 mt-1">시스템에서 사용되는 공통 코드(고용형태, 상태 등)를 관리합니다. (더블클릭하여 인라인 수정)</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          코드 추가
        </Button>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <div className="bg-white rounded-lg shadow-sm border border-[#e5e5e5] h-full flex flex-col">
          <DataGrid 
            columns={columns} 
            data={codes} 
            onDataChange={handleDataChange}
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4">공통 코드 추가</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">그룹 코드 *</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2" 
                  value={newCode.group_code}
                  onChange={e => setNewCode({...newCode, group_code: e.target.value})}
                  placeholder="예: EMP_TYPE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">코드 *</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2" 
                  value={newCode.code}
                  onChange={e => setNewCode({...newCode, code: e.target.value})}
                  placeholder="예: FULL_TIME"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">이름(라벨) *</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2" 
                  value={newCode.name}
                  onChange={e => setNewCode({...newCode, name: e.target.value})}
                  placeholder="예: 정규직"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">정렬 순서</label>
                <input 
                  type="number" 
                  className="w-full border rounded p-2" 
                  value={newCode.sort_order}
                  onChange={e => setNewCode({...newCode, sort_order: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>취소</Button>
              <Button onClick={handleSaveNew}>저장</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
