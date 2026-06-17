"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Save, Undo2, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataGrid, ColumnDef } from "@/components/ui/DataGrid";
import { useDialog } from "@/components/providers/DialogProvider";

export default function AccountsPage() {
  const [allAccounts, setAllAccounts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert, showConfirm } = useDialog();
  
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState('');

  // 팝업 등록용 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newData, setNewData] = useState({
    code: '', name: '', type: '자산', description: '', is_active: true
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAllAccounts(data);
        setAccounts(data);
        setSearchKeyword('');
        setSearchType('');
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

  const handleAddRow = () => {
    setNewData({ code: '', name: '', type: '자산', description: '', is_active: true });
    setIsModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newData.code || !newData.name) {
      showAlert("계정코드와 계정명은 필수 입력 항목입니다.", { type: "warning" });
      return;
    }
    const newTemp = {
      id: `temp_${Date.now()}`,
      ...newData,
      _state: 'C'
    };
    setAccounts([newTemp, ...accounts]);
    setIsModalOpen(false);
  };

  const handleBulkDelete = async () => {
    if (selectedRowIndices.length === 0) return;
    
    const updated = accounts.filter((acc, idx) => {
      if (selectedRowIndices.includes(idx)) {
        if (acc._state === 'C' || !acc.id || String(acc.id).startsWith('temp_')) {
          return false;
        } else {
          acc._state = 'D';
          return true;
        }
      }
      return true;
    });

    setAccounts(updated);
    setSelectedRowIndices([]);
  };

  const handleSave = async () => {
    const rowsToCreate = accounts.filter(e => e._state === 'C');
    const rowsToDelete = accounts.filter(e => e._state === 'D');
    const rowsToUpdate = accounts.filter(e => e._state === 'U');
    
    if (rowsToCreate.length === 0 && rowsToDelete.length === 0 && rowsToUpdate.length === 0) {
      await showAlert("저장할 변경사항이 없습니다.", { type: "info" });
      return;
    }

    const invalidCreate = rowsToCreate.find(e => !e.code || !e.name);
    if (invalidCreate) {
      await showAlert("신규 등록 시 계정코드와 계정명은 필수입니다.", { type: "warning" });
      return;
    }

    const totalChanges = rowsToCreate.length + rowsToDelete.length + rowsToUpdate.length;
    const confirmed = await showConfirm(`총 ${totalChanges}건의 변경사항(신규 ${rowsToCreate.length}건, 수정 ${rowsToUpdate.length}건, 삭제 ${rowsToDelete.length}건)을 저장하시겠습니까?`, { type: "warning" });
    if (!confirmed) return;
    
    try {
      // Handle deletions
      if (rowsToDelete.length > 0) {
        for (const row of rowsToDelete) {
          const res = await fetch(`/api/accounts/${row.id}`, { method: "DELETE" });
          if (!res.ok) throw new Error(`코드 ${row.code} 삭제 실패`);
        }
      }

      // Handle creations
      if (rowsToCreate.length > 0) {
        for (const row of rowsToCreate) {
          const payload = {
            code: row.code,
            name: row.name,
            type: row.type,
            description: row.description,
            is_active: row.is_active === 'true' || row.is_active === true
          };
          const res = await fetch(`/api/accounts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(`계정과목 ${row.code} 등록 실패: ${data.detail || ''}`);
          }
        }
      }

      // Handle updates
      if (rowsToUpdate.length > 0) {
        for (const row of rowsToUpdate) {
          const payload = {
            code: row.code,
            name: row.name,
            type: row.type,
            description: row.description,
            is_active: row.is_active === 'true' || row.is_active === true
          };
          const res = await fetch(`/api/accounts/${row.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(`계정과목 ${row.code} 수정 실패: ${data.detail || ''}`);
          }
        }
      }

      await showAlert("변경사항이 성공적으로 저장되었습니다.", { type: "success" });
      fetchData();
    } catch (e: any) {
      console.error(e);
      await showAlert(e.message || "오류가 발생했습니다.", { type: "error" });
    }
  };

  const handleCancel = async () => {
    const confirmed = await showConfirm("변경사항을 취소하고 처음 상태로 되돌리시겠습니까?", { type: "warning" });
    if (!confirmed) return;
    setSelectedRowIndices([]);
    fetchData();
  };

  const columns: ColumnDef[] = [
    { field: 'code', headerName: '계정코드', width: 120, editable: true },
    { field: 'name', headerName: '계정명', width: 200, editable: true },
    { 
      field: 'type', 
      headerName: '분류', 
      width: 150,
      editable: true,
      editType: 'select',
      options: [
        { label: '자산', value: '자산' },
        { label: '부채', value: '부채' },
        { label: '자본', value: '자본' },
        { label: '수익', value: '수익' },
        { label: '비용', value: '비용' },
        { label: '제조원가', value: '제조원가' },
        { label: '판매비와관리비', value: '판매비와관리비' }
      ]
    },
    { field: 'description', headerName: '설명/적요', width: 300, editable: true },
    { 
      field: 'is_active', 
      headerName: '사용여부', 
      width: 100, 
      editable: true,
      editType: 'select',
      options: [{ label: '사용', value: 'true' }, { label: '미사용', value: 'false' }],
      renderCell: (v) => (v === true || v === 'true') ? '사용' : '미사용'
    }
  ];

  const handleDataChange = (rowIndex: number, field: string, value: any) => {
    const updated = [...accounts];
    updated[rowIndex] = { ...updated[rowIndex], [field]: value, _state: 'U' };
    setAccounts(updated);
    
    const updatedAll = [...allAccounts];
    const allIdx = updatedAll.findIndex(e => e.id === updated[rowIndex].id);
    if (allIdx >= 0) {
      updatedAll[allIdx] = { ...updated[rowIndex] };
      setAllAccounts(updatedAll);
    }
  };

  const handleSearch = () => {
    let filtered = [...allAccounts];

    if (searchKeyword.trim() !== '') {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(e => 
        (e.code && e.code.toLowerCase().includes(keyword)) ||
        (e.name && e.name.toLowerCase().includes(keyword))
      );
    }

    if (searchType !== '') {
      filtered = filtered.filter(e => e.type === searchType);
    }

    setAccounts(filtered);
    setSelectedRowIndices([]);
  };

  if (loading) return <div className="p-8 text-gray-500 text-center">계정과목 데이터를 불러오는 중...</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">계정과목 관리</h1>
          <p className="text-gray-500">전표 입력 시 사용되는 계정과목 라이브러리를 관리합니다.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50/50">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input 
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  onKeyDown={e => { if(e.key === 'Enter') handleSearch(); }}
                  className="pl-9 pr-4 bg-white w-full focus:z-10 relative" 
                  placeholder="계정코드, 계정명 검색..." 
                />
              </div>

              <select 
                value={searchType}
                onChange={e => setSearchType(e.target.value)}
                className="border border-gray-200 rounded-lg text-sm bg-white px-3 py-2 h-10 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent min-w-[120px]"
              >
                <option value="">모든 분류</option>
                <option value="자산">자산</option>
                <option value="부채">부채</option>
                <option value="자본">자본</option>
                <option value="수익">수익</option>
                <option value="비용">비용</option>
                <option value="제조원가">제조원가</option>
                <option value="판매비와관리비">판매비와관리비</option>
              </select>

              <Button onClick={handleSearch} className="bg-slate-800 hover:bg-slate-700 text-white px-6 shadow-sm border border-slate-800 h-10 shrink-0">
                검색
              </Button>
            </div>

            <div className="flex flex-wrap justify-end gap-2 w-full mt-2">
              {accounts.some(e => e._state === 'C' || e._state === 'D' || e._state === 'U') && (
                <>
                  <Button onClick={handleCancel} variant="outline" className="text-gray-700 bg-white border-gray-300 hover:bg-gray-50 transition-all shrink-0">
                    <Undo2 className="w-4 h-4 mr-2" />
                    변경 취소
                  </Button>
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 transition-all transform hover:scale-105 duration-200 shrink-0">
                    <Save className="w-4 h-4 mr-2" />
                    변경사항 저장
                  </Button>
                </>
              )}
              {selectedRowIndices.length > 0 && (
                <Button variant="danger" onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 text-white border-transparent shrink-0">
                  <Trash2 className="w-4 h-4 mr-2" />
                  선택 삭제 ({selectedRowIndices.length})
                </Button>
              )}
              <Button className="bg-[#107C41] hover:bg-[#0b5c30] text-white" onClick={handleAddRow}>
                <Plus className="w-4 h-4 mr-2" />
                신규 계정과목
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col h-[calc(100vh-380px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
              <DataGrid 
                columns={columns} 
                data={accounts} 
                onDataChange={handleDataChange}
                showCheckboxes={true}
                selectedRowIndices={selectedRowIndices}
                onSelectionChange={setSelectedRowIndices}
                storageKey="erp_accounts_grid_columns"
              />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">신규 계정과목 등록</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2 text-sm text-blue-800 shadow-sm">
                <span className="text-blue-500 font-bold">ℹ️</span>
                <p className="text-blue-700/90 whitespace-nowrap">
                  하단의 <strong className="text-blue-900">[표에 임시 추가]</strong> 후, 상단의 <strong className="text-blue-900 bg-white px-1 py-0.5 rounded border border-blue-200">[변경사항 저장]</strong>을 눌러야 최종 반영됩니다.
                </p>
              </div>
              <form id="newDataForm" onSubmit={handleModalSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">계정코드 *</label>
                    <Input required value={newData.code} onChange={e => setNewData({...newData, code: e.target.value})} placeholder="811" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">계정명 *</label>
                    <Input required value={newData.name} onChange={e => setNewData({...newData, name: e.target.value})} placeholder="복리후생비" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 h-10" value={newData.type} onChange={e => setNewData({...newData, type: e.target.value})}>
                      <option value="자산">자산</option>
                      <option value="부채">부채</option>
                      <option value="자본">자본</option>
                      <option value="수익">수익</option>
                      <option value="비용">비용</option>
                      <option value="제조원가">제조원가</option>
                      <option value="판매비와관리비">판매비와관리비</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">사용여부</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 h-10" value={newData.is_active ? 'true' : 'false'} onChange={e => setNewData({...newData, is_active: e.target.value === 'true'})}>
                      <option value="true">사용</option>
                      <option value="false">미사용</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명/적요</label>
                    <Input value={newData.description} onChange={e => setNewData({...newData, description: e.target.value})} placeholder="계정과목에 대한 상세 설명..." />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>취소</Button>
              <Button type="submit" form="newDataForm" className="bg-[#107C41] hover:bg-[#0b5c30] text-white">표에 임시 추가</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
