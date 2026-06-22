"use client";

import React, { useState, useEffect } from "react";
import { DataGrid, ColumnDef } from "@/components/ui/DataGrid";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useDialog } from "@/components/providers/DialogProvider";
import { Plus, Search, Trash2, Save, Undo2, FileDown } from "lucide-react";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function WorkOrdersPage() {
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrderData, setNewOrderData] = useState({
    order_no: "",
    item_id: "",
    planned_quantity: "",
    start_date: "",
    end_date: "",
    manager_id: ""
  });
  const [managerSearchQuery, setManagerSearchQuery] = useState("");
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  
  const { showAlert, showConfirm } = useDialog();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token')) : '';
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [resOrders, resItems, resEmp] = await Promise.all([
        fetch("/api/mes/work-orders", { headers }),
        fetch("/api/mes/items", { headers }),
        fetch("/api/employees", { headers })
      ]);
      if (resOrders.ok) {
        const data = await resOrders.json();
        setAllOrders(data);
        setOrders(data);
      }
      if (resItems.ok) setItems(await resItems.json());
      if (resEmp.ok) setEmployees(await resEmp.json());
      
      setSearchKeyword("");
      setSelectedRowIndices([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = () => {
    let filtered = [...allOrders];
    if (searchKeyword.trim() !== '') {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(o => 
        (o.order_no && o.order_no.toLowerCase().includes(keyword))
      );
    }
    setOrders(filtered);
    setSelectedRowIndices([]);
  };

  const handleAddRow = () => {
    setNewOrderData({
      order_no: "",
      item_id: "",
      planned_quantity: "",
      start_date: "",
      end_date: "",
      manager_id: ""
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderData.order_no || !newOrderData.item_id || !newOrderData.planned_quantity) {
      showAlert("지시번호, 품목, 계획수량은 필수 항목입니다.", { type: "warning" });
      return;
    }
    
    const newTempOrder = {
      id: `temp_${Date.now()}`,
      order_no: newOrderData.order_no,
      item_id: parseInt(newOrderData.item_id),
      planned_quantity: parseFloat(newOrderData.planned_quantity),
      produced_quantity: 0,
      status: "PENDING",
      start_date: newOrderData.start_date || null,
      end_date: newOrderData.end_date || null,
      manager_id: newOrderData.manager_id ? parseInt(newOrderData.manager_id) : null,
      _state: 'C'
    };
    
    setOrders([newTempOrder, ...orders]);
    setIsModalOpen(false);
  };

  const handleBulkDelete = () => {
    if (selectedRowIndices.length === 0) return;
    const newOrders = orders.filter((order, idx) => {
      if (selectedRowIndices.includes(idx)) {
        if (order._state === 'C' || !order.id || String(order.id).startsWith('temp_')) {
          return false;
        } else {
          order._state = 'D';
          return true;
        }
      }
      return true;
    });
    setOrders(newOrders);
    setSelectedRowIndices([]);
  };

  const handleDataChange = (rowIndex: number, field: string, value: any) => {
    const updated = [...orders];
    updated[rowIndex] = { ...updated[rowIndex], [field]: value, _state: updated[rowIndex]._state === 'C' ? 'C' : 'U' };
    setOrders(updated);
    
    const updatedAll = [...allOrders];
    const allIdx = updatedAll.findIndex(o => o.id === updated[rowIndex].id);
    if (allIdx >= 0) {
      updatedAll[allIdx] = { ...updated[rowIndex] };
      setAllOrders(updatedAll);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
    
    const rowsToCreate = orders.filter(o => o._state === 'C');
    const rowsToDelete = orders.filter(o => o._state === 'D');
    const rowsToUpdate = orders.filter(o => o._state === 'U');
    
    if (rowsToCreate.length === 0 && rowsToDelete.length === 0 && rowsToUpdate.length === 0) {
      await showAlert("저장할 변경사항이 없습니다.", { type: "info" });
      return;
    }

    const totalChanges = rowsToCreate.length + rowsToDelete.length + rowsToUpdate.length;
    const confirmed = await showConfirm(`총 ${totalChanges}건의 변경사항(신규 ${rowsToCreate.length}건, 수정 ${rowsToUpdate.length}건, 삭제 ${rowsToDelete.length}건)을 저장하시겠습니까?`, { type: "warning" });
    if (!confirmed) return;
    
    try {
      // 1. Delete
      for (const row of rowsToDelete) {
        await fetch(`/api/mes/work-orders/${row.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // 2. Create
      for (const row of rowsToCreate) {
        await fetch(`/api/mes/work-orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            order_no: row.order_no,
            item_id: Number(row.item_id),
            planned_quantity: Number(row.planned_quantity),
            start_date: row.start_date || null,
            end_date: row.end_date || null,
            manager_id: row.manager_id ? Number(row.manager_id) : null,
            status: row.status
          })
        });
      }
      
      // 3. Update
      for (const row of rowsToUpdate) {
        await fetch(`/api/mes/work-orders/${row.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            order_no: row.order_no,
            item_id: Number(row.item_id),
            planned_quantity: Number(row.planned_quantity),
            produced_quantity: Number(row.produced_quantity),
            start_date: row.start_date || null,
            end_date: row.end_date || null,
            manager_id: row.manager_id ? Number(row.manager_id) : null,
            status: row.status
          })
        });
      }

      await showAlert("변경사항이 성공적으로 저장되었습니다.", { type: "success" });
      fetchData();
    } catch (e: any) {
      console.error(e);
      await showAlert("오류가 발생했습니다.", { type: "error" });
    }
  };

  const handleCancel = async () => {
    const confirmed = await showConfirm("변경사항을 취소하고 처음 상태로 되돌리시겠습니까?", { type: "warning" });
    if (!confirmed) return;
    fetchData();
  };

  const handleExcelDownload = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('작업지시서목록');
    
    const baseCols = columns.map(c => ({
      headerName: c.headerName,
      key: c.field,
      width: c.width ? Math.max(10, c.width / 10) : 15
    }));
    
    worksheet.columns = baseCols;
    
    orders.forEach(order => {
      const rowData: any = { ...order };
      const itemObj = items.find(i => i.id === order.item_id);
      if (itemObj) rowData.item_id = `[${itemObj.item_code}] ${itemObj.item_name}`;
      worksheet.addRow(rowData);
    });
    
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.font = { name: '맑은 고딕', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E2E2' } },
          left: { style: 'thin', color: { argb: 'FFE2E2E2' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E2E2' } },
          right: { style: 'thin', color: { argb: 'FFE2E2E2' } }
        };
        if (rowNumber === 1) {
          cell.font = { name: '맑은 고딕', size: 10, bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F4F7' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
      row.height = 22;
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `work_orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const columns: ColumnDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "order_no", headerName: "지시번호", width: 150, editable: true },
    { 
      field: "item_id", 
      headerName: "품목 ID", 
      width: 250, 
      editable: true,
      editType: "select",
      options: items.map(item => ({ label: `[${item.item_code}] ${item.item_name}`, value: item.id })),
      renderCell: (v) => {
        const item = items.find(i => i.id === v);
        return item ? `[${item.item_code}] ${item.item_name}` : v;
      }
    },
    { field: "planned_quantity", headerName: "계획수량", width: 120, editable: true },
    { field: "produced_quantity", headerName: "실적수량", width: 120, editable: true },
    { 
      field: "status", 
      headerName: "상태", 
      width: 120, 
      editable: true,
      editType: "select",
      options: [
        { label: "대기", value: "PENDING" },
        { label: "진행중", value: "IN_PROGRESS" },
        { label: "완료", value: "COMPLETED" },
        { label: "취소", value: "CANCELLED" }
      ],
      renderCell: (v) => {
        const map: any = { PENDING: "대기", IN_PROGRESS: "진행중", COMPLETED: "완료", CANCELLED: "취소" };
        return map[v] || v;
      }
    },
    { field: "start_date", headerName: "시작일", width: 150, editable: true },
    { field: "end_date", headerName: "종료일", width: 150, editable: true }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">작업 지시서 관리</h1>
          <p className="text-gray-500">생산 공정에 필요한 작업 지시를 발행하고 관리합니다.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50/50">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-2 w-full max-w-[400px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="지시번호 검색..." 
                    className="pl-9 w-full h-9 text-sm" 
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') handleSearch(); }}
                  />
                </div>
                <Button variant="secondary" size="sm" className="h-9" onClick={handleSearch}>
                  조회
                </Button>
                <Button variant="secondary" onClick={fetchData} className="h-9 px-3 shrink-0" title="초기화">
                  <Undo2 className="w-4 h-4 text-[#107C41]" />
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-end gap-2 w-full mt-2">
              <Button variant="outline" size="sm" onClick={handleAddRow} className="h-9 flex items-center bg-white">
                <Plus className="w-4 h-4 mr-1 text-[#107C41]" />
                작업 지시서 발행
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBulkDelete} 
                disabled={selectedRowIndices.length === 0}
                className={`h-9 flex items-center ${selectedRowIndices.length > 0 ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200' : ''}`}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                선택 삭제
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={!orders.some(o => o._state === 'C' || o._state === 'D' || o._state === 'U')}
                className="h-9 flex items-center bg-[#107C41] hover:bg-[#0c5e31] text-white"
              >
                <Save className="w-4 h-4 mr-1" />
                저장
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel} 
                disabled={!orders.some(o => o._state === 'C' || o._state === 'D' || o._state === 'U')}
                className="h-9 flex items-center"
              >
                <Undo2 className="w-4 h-4 mr-1" />
                변경 취소
              </Button>
              <Button variant="outline" size="sm" className="h-9 flex items-center bg-white" onClick={handleExcelDownload}>
                <FileDown className="w-4 h-4 mr-1 text-[#107C41]" />
                엑셀 다운로드
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col h-[calc(100vh-320px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
            <DataGrid 
              columns={columns} 
              data={orders} 
              onDataChange={handleDataChange}
              showCheckboxes={true}
              selectedRowIndices={selectedRowIndices}
              onSelectionChange={setSelectedRowIndices}
              storageKey="erp_workorders_grid_columns"
            />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">새 작업 지시서 발행</h3>
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
              <form id="newOrderForm" onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">지시번호 <span className="text-red-500">*</span></label>
                  <input type="text" value={newOrderData.order_no} onChange={e => setNewOrderData({...newOrderData, order_no: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#107C41] focus:border-[#107C41]" placeholder="예: WO-2026-001" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">품목 <span className="text-red-500">*</span></label>
                    <select value={newOrderData.item_id} onChange={e => setNewOrderData({...newOrderData, item_id: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#107C41] focus:border-[#107C41]">
                      <option value="">선택</option>
                      {items.map(item => <option key={item.id} value={item.id}>[{item.item_code}] {item.item_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">계획 수량 <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01" value={newOrderData.planned_quantity} onChange={e => setNewOrderData({...newOrderData, planned_quantity: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#107C41] focus:border-[#107C41]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">시작 예정일</label>
                    <input type="date" value={newOrderData.start_date} onChange={e => setNewOrderData({...newOrderData, start_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#107C41] focus:border-[#107C41]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">종료 예정일</label>
                    <input type="date" value={newOrderData.end_date} onChange={e => setNewOrderData({...newOrderData, end_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#107C41] focus:border-[#107C41]" />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                  <div 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-[#107C41] focus-within:border-[#107C41] cursor-pointer bg-white relative flex justify-between items-center"
                    onClick={() => {
                      if (!isManagerDropdownOpen) setManagerSearchQuery('');
                      setIsManagerDropdownOpen(!isManagerDropdownOpen);
                    }}
                  >
                    <span>{newOrderData.manager_id ? employees.find(e => e.id.toString() === newOrderData.manager_id.toString())?.name || '알 수 없음' : '선택 안함'}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                  
                  {isManagerDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#107C41]"
                          placeholder="이름으로 검색..."
                          value={managerSearchQuery}
                          onChange={e => setManagerSearchQuery(e.target.value)}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <div
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                        onClick={() => {
                          setNewOrderData({...newOrderData, manager_id: ''});
                          setIsManagerDropdownOpen(false);
                        }}
                      >
                        선택 안함
                      </div>
                      {employees.filter(emp => emp.name.toLowerCase().includes(managerSearchQuery.toLowerCase())).map(emp => (
                        <div 
                          key={emp.id} 
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                          onClick={() => {
                            setNewOrderData({...newOrderData, manager_id: emp.id.toString()});
                            setIsManagerDropdownOpen(false);
                          }}
                        >
                          {emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>취소</Button>
              <Button type="submit" form="newOrderForm" className="bg-[#107C41] hover:bg-[#0b5c30] text-white">표에 임시 추가</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
