"use client";

import { useState, useEffect, useMemo } from "react";
import { DataGrid, ColumnDef } from "@/components/ui/DataGrid";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useDialog } from "@/components/providers/DialogProvider";
import { Plus, X, Box, Search, Warehouse, Wrench, ShieldAlert, Tag, Layers, DollarSign, Clock } from "lucide-react";

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    item_type: '원자재',
    unit: 'EA',
    standard: '',
    standard_cost: 0,
    safety_stock: 0,
    current_stock: 0,
    lead_time: 0,
    is_lot_tracked: false,
    location: ''
  });
  
  const { showAlert } = useDialog();

  const [unitOptions, setUnitOptions] = useState<{label: string, value: string}[]>([]);

  useEffect(() => {
    fetchItems();
    fetchUnitCodes();
  }, []);

  const fetchUnitCodes = async () => {
    const res = await fetch("/api/common-codes?group=ITEM_UNIT");
    if (res.ok) {
      const data = await res.json();
      setUnitOptions(data.map((c: any) => ({ label: c.name, value: c.code })));
    }
  };

  const fetchItems = async () => {
    const res = await fetch("/api/mes/items");
    const data = await res.json();
    setItems(data);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = Number(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_code || !formData.item_name) {
      showAlert('품목코드와 품목명은 필수입니다.', { type: 'warning' });
      return;
    }

    const res = await fetch("/api/mes/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      setIsModalOpen(false);
      setFormData({
        item_code: '', item_name: '', item_type: '원자재', unit: 'EA', standard: '',
        standard_cost: 0, safety_stock: 0, current_stock: 0, lead_time: 0, is_lot_tracked: false, location: ''
      });
      fetchItems();
      showAlert('품목이 추가되었습니다.', { type: 'success' });
    } else {
      const errorData = await res.json();
      showAlert(errorData.detail || "추가 실패", { type: "error" });
    }
  };

  const handleDataChange = async (rowIndex: number, field: string, newValue: any) => {
    const updatedItem = { ...items[rowIndex], [field]: newValue };
    
    // Optimistic UI update
    const newItems = [...items];
    newItems[rowIndex] = updatedItem;
    setItems(newItems);

    try {
      const res = await fetch(`/api/mes/items/${updatedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem)
      });
      if (!res.ok) {
        throw new Error("수정 실패");
      }
    } catch (err) {
      showAlert("데이터 수정 중 오류가 발생했습니다.", { type: "error" });
      fetchItems(); // Revert on failure
    }
  };

  const columns: ColumnDef[] = useMemo(() => [
    { field: "item_code", headerName: "품목코드", width: 150, editable: true },
    { field: "item_name", headerName: "품목명", width: 220, editable: true, renderCell: (val: any) => <span>{val}</span> },
    { field: "item_type", headerName: "유형", width: 100, editable: true },
    { field: "standard", headerName: "규격", width: 160, editable: true, renderCell: (val: any) => <span className="text-gray-600 text-sm">{val || '-'}</span> },
    { field: "current_stock", headerName: "현재고", width: 100, editable: true, renderCell: (val: any, row: any) => {
        return <div className="text-right w-full">{Number(val).toLocaleString()}</div>;
      }
    },
    { field: "safety_stock", headerName: "안전재고", width: 90, editable: true, renderCell: (val: any) => <div className="text-right w-full text-gray-600">{Number(val).toLocaleString()}</div> },
    { field: "unit", headerName: "단위", width: 100, editable: true, editType: 'select', options: unitOptions },
    { field: "standard_cost", headerName: "표준단가", width: 120, editable: true, renderCell: (val: any) => <div className="text-right w-full">{Number(val).toLocaleString()}원</div> },
    { field: "lead_time", headerName: "L/T", width: 70, editable: true, renderCell: (val: any) => <div className="text-center w-full">{val}일</div> },
    { field: "location", headerName: "창고위치", width: 140, editable: true, renderCell: (val: any) => <span className="text-gray-600 text-sm">{val || '-'}</span> },
  ], [unitOptions]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">품목 관리</h1>
          <p className="text-gray-500">스마트폰 조립에 필요한 원자재, 반제품, 완제품의 품목 마스터를 관리합니다.</p>
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
                    placeholder="검색어 입력..." 
                    className="pl-9 w-full h-9 text-sm" 
                  />
                </div>
                <Button variant="secondary" size="sm" className="h-9">
                  조회
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 w-full mt-2">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)} className="h-9 flex items-center bg-white">
                <Plus className="w-4 h-4 mr-1 text-[#107C41]" />
                품목 등록
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col h-[calc(100vh-380px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
            <DataGrid data={items} columns={columns} showCheckboxes={true} onDataChange={handleDataChange} />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Box className="w-6 h-6 text-indigo-600" />
                신규 품목 등록
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1단원: 기본 정보 */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2">
                      <Tag className="w-4 h-4 text-gray-500" />
                      기본 정보
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">품목코드 *</label>
                        <input type="text" name="item_code" value={formData.item_code} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="ex: RM-AP-8GEN4" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">품목명 *</label>
                        <input type="text" name="item_name" value={formData.item_name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="ex: Snapdragon 8 Gen 4 (AP)" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">유형 *</label>
                          <select name="item_type" value={formData.item_type} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                            <option value="원자재">원자재</option>
                            <option value="반제품">반제품</option>
                            <option value="완제품">완제품</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">단위 *</label>
                          <select name="unit" value={formData.unit} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                            {unitOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">규격/사양</label>
                        <input type="text" name="standard" value={formData.standard} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="상세 스펙 등 입력" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2단원: 물류/원가 정보 */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2">
                      <Warehouse className="w-4 h-4 text-gray-500" />
                      물류 및 원가 정보
                    </h3>
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> 표준단가(원)</label>
                          <input type="number" name="standard_cost" value={formData.standard_cost} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right" min="0" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> 리드타임(일)</label>
                          <input type="number" name="lead_time" value={formData.lead_time} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right" min="0" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Layers className="w-3 h-3"/> 현재고</label>
                          <input type="number" name="current_stock" value={formData.current_stock} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right text-indigo-700 font-bold" min="0" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> 안전재고</label>
                          <input type="number" name="safety_stock" value={formData.safety_stock} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right" min="0" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Warehouse className="w-3 h-3"/> 창고 위치</label>
                        <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="ex: 1층 자재창고 A열 3번선반" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  취소
                </Button>
                <Button type="submit" className="bg-[#107C41] hover:bg-[#0b5c30] text-white">
                  품목 등록 완료
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
