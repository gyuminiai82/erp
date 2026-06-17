"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Save, Undo2, ArrowUpRight } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataGrid, ColumnDef } from "@/components/ui/DataGrid";
import { useDialog } from "@/components/providers/DialogProvider";

const CLIENT_TYPES = ["고객사", "협력사", "기타"];

export default function ClientsPage() {
  const [allClients, setAllClients] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert, showConfirm } = useDialog();
  
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 팝업 등록용 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({
    client_code: '', client_name: '', client_type: '고객사',
    registration_number: '', representative: '', contact_person: '', 
    contact_phone: '', contact_email: '', address: '', is_active: true
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const res = await fetch("/api/clients", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllClients(data);
        setClients(data);
        setSearchKeyword('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddRow = () => {
    setNewClientData({
      client_code: '', client_name: '', client_type: '고객사',
      registration_number: '', representative: '', contact_person: '', 
      contact_phone: '', contact_email: '', address: '', is_active: true
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientData.client_code || !newClientData.client_name) {
      showAlert("거래처 코드와 거래처명은 필수 입력 항목입니다.", { type: "warning" });
      return;
    }
    const newTempClient = {
      id: `temp_${Date.now()}`,
      ...newClientData,
      _state: 'C'
    };
    setClients([newTempClient, ...clients]);
    setIsModalOpen(false);
  };

  const handleDeleteRows = () => {
    if (selectedRowIndices.length === 0) {
      showAlert("삭제할 거래처를 선택해주세요.", { type: "warning" });
      return;
    }
    showConfirm(
      "선택 삭제",
      `선택한 ${selectedRowIndices.length}개의 거래처를 목록에서 제거하시겠습니까?`,
      () => {
        const newData = [...clients];
        selectedRowIndices.sort((a, b) => b - a).forEach(idx => {
          if (newData[idx]._state === 'C') {
            newData.splice(idx, 1);
          } else {
            newData[idx] = { ...newData[idx], _state: 'D' };
          }
        });
        setClients(newData);
        setSelectedRowIndices([]);
      }
    );
  };

  const handleSave = async () => {
    const changed = clients.filter(c => c._state);
    if (changed.length === 0) {
      showAlert("저장할 변경사항이 없습니다.", { type: "info" });
      return;
    }

    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      
      for (const item of changed) {
        if (item._state === 'C') {
          const res = await fetch("/api/clients", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              client_code: item.client_code,
              client_name: item.client_name,
              client_type: item.client_type,
              registration_number: item.registration_number,
              representative: item.representative,
              contact_person: item.contact_person,
              contact_phone: item.contact_phone,
              contact_email: item.contact_email,
              address: item.address,
              is_active: item.is_active
            })
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.detail || "등록 실패");
          }
        } else if (item._state === 'U') {
          const res = await fetch(`/api/clients/${item.id}`, {
            method: "PUT",
            headers: { 
              "Content-Type": "application/json",
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              client_code: item.client_code,
              client_name: item.client_name,
              client_type: item.client_type,
              registration_number: item.registration_number,
              representative: item.representative,
              contact_person: item.contact_person,
              contact_phone: item.contact_phone,
              contact_email: item.contact_email,
              address: item.address,
              is_active: item.is_active
            })
          });
          if (!res.ok) throw new Error("수정 실패");
        } else if (item._state === 'D') {
          const res = await fetch(`/api/clients/${item.id}`, {
            method: "DELETE",
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("삭제 실패");
        }
      }
      
      showAlert("저장되었습니다.", { type: "success" });
      fetchClients();
    } catch (e: any) {
      showAlert(e.message || "저장 중 오류가 발생했습니다.", { type: "error" });
    }
  };

  const handleSearch = () => {
    let filtered = [...allClients];
    if (searchKeyword) {
      const lower = searchKeyword.toLowerCase();
      filtered = filtered.filter(c => 
        (c.client_code && c.client_code.toLowerCase().includes(lower)) ||
        (c.client_name && c.client_name.toLowerCase().includes(lower))
      );
    }
    setClients(filtered);
    setSelectedRowIndices([]);
  };

  const columns: ColumnDef[] = [
    {
      field: "client_code",
      header: "거래처 코드",
      width: "120px",
      align: "center",
      editable: true,
      renderCell: (val) => <span className="font-medium text-[#107C41]">{val}</span>
    },
    { field: "client_name", header: "거래처명", width: "180px", editable: true },
    {
      field: "client_type",
      header: "구분",
      width: "120px",
      align: "center",
      editable: true,
      editor: { type: "select", options: CLIENT_TYPES }
    },
    { field: "registration_number", header: "사업자등록번호", width: "150px", align: "center", editable: true },
    { field: "representative", header: "대표자", width: "100px", align: "center", editable: true },
    { field: "contact_person", header: "담당자", width: "100px", align: "center", editable: true },
    { field: "contact_phone", header: "연락처", width: "150px", align: "center", editable: true },
    { field: "contact_email", header: "이메일", width: "180px", editable: true },
    { field: "address", header: "주소", width: "250px", editable: true },
    {
      field: "is_active",
      header: "상태",
      width: "100px",
      align: "center",
      editable: true,
      editor: {
        type: "select",
        options: ["true", "false"]
      },
      renderCell: (val) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          String(val) === 'true' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
        }`}>
          {String(val) === 'true' ? '활성' : '비활성'}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#107C41]"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">거래처 관리</h1>
          <p className="text-gray-500">회사의 고객사 및 협력사 정보를 관리합니다.</p>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-320px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="p-3 border-b border-gray-200 bg-gray-50/80 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="코드/거래처명 검색" 
                className="pl-9 w-[220px] h-9 text-sm" 
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button variant="secondary" size="sm" onClick={handleSearch} className="h-9">
              조회
            </Button>
            <Button variant="outline" size="sm" onClick={fetchClients} className="h-9" title="초기화">
              <Undo2 className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleAddRow} className="h-9 flex items-center bg-white">
              <Plus className="w-4 h-4 mr-1 text-[#107C41]" />
              신규 거래처
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeleteRows} className="h-9 flex items-center bg-white text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
              <Trash2 className="w-4 h-4 mr-1" />
              선택 삭제
            </Button>
            <Button size="sm" onClick={handleSave} className="h-9 flex items-center bg-[#107C41] hover:bg-[#0c5e31] text-white">
              <Save className="w-4 h-4 mr-1" />
              저장
            </Button>
          </div>
        </div>

        {/* DataGrid */}
        <div className="flex-1 overflow-hidden">
          <DataGrid 
            columns={columns} 
            data={clients}
            onChange={(newData) => {
              const updatedData = newData.map((row: any, i: number) => {
                const oldRow = clients[i];
                if (oldRow && oldRow._state === 'C') return row;
                if (oldRow && JSON.stringify(oldRow) !== JSON.stringify(row)) {
                  return { ...row, _state: oldRow._state || 'U' };
                }
                return row;
              });
              setClients(updatedData);
            }}
            showCheckboxes={true}
            selectedRowIndices={selectedRowIndices}
            onSelectionChange={setSelectedRowIndices}
          />
        </div>
      </div>

      {/* 신규 등록 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <ArrowUpRight className="w-5 h-5 mr-2 text-[#107C41]" />
                신규 거래처 등록
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <Undo2 className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">거래처 코드 <span className="text-red-500">*</span></label>
                    <Input 
                      required 
                      value={newClientData.client_code} 
                      onChange={e => setNewClientData({...newClientData, client_code: e.target.value})}
                      placeholder="예: CUST-001"
                      className="border-gray-300 focus:border-[#107C41] focus:ring-[#107C41]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">거래처명 <span className="text-red-500">*</span></label>
                    <Input 
                      required 
                      value={newClientData.client_name} 
                      onChange={e => setNewClientData({...newClientData, client_name: e.target.value})}
                      placeholder="회사명 입력"
                      className="border-gray-300 focus:border-[#107C41] focus:ring-[#107C41]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">구분</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#107C41]"
                      value={newClientData.client_type}
                      onChange={e => setNewClientData({...newClientData, client_type: e.target.value})}
                    >
                      {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">사업자등록번호</label>
                    <Input 
                      value={newClientData.registration_number} 
                      onChange={e => setNewClientData({...newClientData, registration_number: e.target.value})}
                      placeholder="000-00-00000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">대표자명</label>
                    <Input 
                      value={newClientData.representative} 
                      onChange={e => setNewClientData({...newClientData, representative: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">담당자명</label>
                    <Input 
                      value={newClientData.contact_person} 
                      onChange={e => setNewClientData({...newClientData, contact_person: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">연락처</label>
                    <Input 
                      value={newClientData.contact_phone} 
                      onChange={e => setNewClientData({...newClientData, contact_phone: e.target.value})}
                      placeholder="010-0000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">이메일</label>
                    <Input 
                      type="email"
                      value={newClientData.contact_email} 
                      onChange={e => setNewClientData({...newClientData, contact_email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">주소</label>
                  <Input 
                    value={newClientData.address} 
                    onChange={e => setNewClientData({...newClientData, address: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  취소
                </Button>
                <Button type="submit" className="bg-[#107C41] hover:bg-[#0c5e31] text-white">
                  임시 등록 (저장 필요)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
