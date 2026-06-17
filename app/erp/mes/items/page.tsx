"use client";

import { useState, useEffect, useMemo } from "react";
import { DataGrid, ColumnDef } from "@/components/ui/DataGrid";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useDialog } from "@/components/providers/DialogProvider";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Plus, X, Box, Search, Warehouse, Wrench, ShieldAlert, Tag, Layers, DollarSign, Clock, Undo2, Trash2, Save, FileDown } from "lucide-react";

export default function ItemsPage() {
  const [allItems, setAllItems] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState('');
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    item_type: '원자재',
    unit: 'EA',
    standard: '',
    standard_cost: 0,
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
    const mapped = data.map((i: any) => ({ ...i, _state: 'R' }));
    setAllItems(mapped);
    setItems(mapped);
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
        standard_cost: 0, lead_time: 0, is_lot_tracked: false, location: ''
      });
      fetchItems();
      showAlert('품목이 추가되었습니다.', { type: 'success' });
    } else {
      const errorData = await res.json();
      showAlert(errorData.detail || "추가 실패", { type: "error" });
    }
  };

  const handleSearch = () => {
    let filtered = [...allItems];
    if (searchType) {
      filtered = filtered.filter(i => i.item_type === searchType);
    }
    if (searchKeyword) {
      const lower = searchKeyword.toLowerCase();
      filtered = filtered.filter(i => 
        (i.item_code && i.item_code.toLowerCase().includes(lower)) ||
        (i.item_name && i.item_name.toLowerCase().includes(lower))
      );
    }
    setItems(filtered);
    setSelectedRowIndices([]);
  };

  const handleReset = () => {
    setSearchKeyword('');
    setSearchType('');
    setItems(allItems);
    setSelectedRowIndices([]);
  };

  const handleDataChange = (rowIndex: number, field: string, newValue: any) => {
    const updatedData = [...items];
    const oldRow = updatedData[rowIndex];
    const newRow = { ...oldRow, [field]: newValue };
    if (oldRow && oldRow._state !== 'C') {
      newRow._state = 'U';
    }
    updatedData[rowIndex] = newRow;
    setItems(updatedData);
  };

  const handleDeleteSelected = () => {
    if (selectedRowIndices.length === 0) return;
    const newData = [...items];
    selectedRowIndices.sort((a, b) => b - a).forEach(idx => {
      if (newData[idx]._state === 'C') {
        newData.splice(idx, 1);
      } else {
        newData[idx] = { ...newData[idx], _state: 'D' };
      }
    });
    setItems(newData);
    setSelectedRowIndices([]);
  };

  const handleBatchSave = async () => {
    const changed = items.filter(i => i._state === 'U' || i._state === 'D');
    if (changed.length === 0) return;
    
    try {
      for (const item of changed) {
        if (item._state === 'U') {
          await fetch(`/api/mes/items/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item)
          });
        } else if (item._state === 'D') {
          await fetch(`/api/mes/items/${item.id}`, {
            method: "DELETE"
          });
        }
      }
      showAlert("저장되었습니다.", { type: "success" });
      fetchItems();
      setSelectedRowIndices([]);
    } catch (e) {
      showAlert("저장 중 오류가 발생했습니다.", { type: "error" });
    }
  };

  const handleBatchCancel = () => {
    fetchItems();
    setSelectedRowIndices([]);
  };

  const handleExcelDownload = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('품목 목록');

    worksheet.columns = [
      { header: '품목코드', key: 'item_code', width: 15 },
      { header: '품목명', key: 'item_name', width: 30 },
      { header: '유형', key: 'item_type', width: 15 },
      { header: '규격', key: 'standard', width: 20 },
      { header: '단위', key: 'unit', width: 10 },
      { header: '표준단가', key: 'standard_cost', width: 15 }
    ];

    items.forEach(item => {
      worksheet.addRow({
        item_code: item.item_code,
        item_name: item.item_name,
        item_type: item.item_type,
        standard: item.standard || '',
        unit: item.unit,
        standard_cost: item.standard_cost || 0
      });
    });

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
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

    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `품목관리_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const columns: ColumnDef[] = useMemo(() => [
    { field: "item_code", headerName: "품목코드", width: 150, editable: true },
    { field: "item_name", headerName: "품목명", width: 220, editable: true, renderCell: (val: any) => <span>{val}</span> },
    { field: "item_type", headerName: "유형", width: 100, editable: true },
    { field: "standard", headerName: "규격", width: 160, editable: true, renderCell: (val: any) => <span className="text-gray-600 text-sm">{val || '-'}</span> },
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
              <select 
                value={searchType}
                onChange={e => setSearchType(e.target.value)}
                className="border border-gray-200 rounded-lg text-sm bg-white px-3 py-2 h-9 focus:outline-none focus:ring-2 focus:ring-slate-800 min-w-[120px]"
              >
                <option value="">모든 품목 유형</option>
                <option value="원자재">원자재</option>
                <option value="반제품">반제품</option>
                <option value="완제품">완제품</option>
              </select>
              <div className="flex items-center space-x-2 w-full max-w-[400px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="코드, 품목명 검색..." 
                    className="pl-9 w-full h-9 text-sm" 
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button variant="secondary" size="sm" onClick={handleSearch} className="h-9">
                  조회
                </Button>
                <Button variant="secondary" size="sm" onClick={handleReset} className="h-9" title="초기화">
                  <Undo2 className="w-4 h-4 text-[#107C41]" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 w-full mt-2">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)} className="h-9 flex items-center bg-white">
                <Plus className="w-4 h-4 mr-1 text-[#107C41]" />
                품목 등록
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDeleteSelected} 
                disabled={selectedRowIndices.length === 0}
                className={`h-9 flex items-center ${selectedRowIndices.length > 0 ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200' : ''}`}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                선택 삭제
              </Button>
              <Button 
                size="sm" 
                onClick={handleBatchSave} 
                disabled={!items.some(e => e._state === 'U' || e._state === 'D' || e._state === 'C')}
                className="h-9 flex items-center bg-[#107C41] hover:bg-[#0c5e31] text-white"
              >
                <Save className="w-4 h-4 mr-1" />
                저장
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBatchCancel} 
                disabled={!items.some(e => e._state === 'U' || e._state === 'D' || e._state === 'C')}
                className="h-9 flex items-center"
              >
                <Undo2 className="w-4 h-4 mr-1" />
                변경 취소
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExcelDownload} 
                className="h-9 flex items-center bg-white text-gray-700 border-gray-300"
              >
                <FileDown className="w-4 h-4 mr-1" />
                엑셀 다운로드
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col h-[calc(100vh-380px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
            <DataGrid 
              data={items} 
              columns={columns} 
              showCheckboxes={true} 
              onDataChange={handleDataChange} 
              selectedRowIndices={selectedRowIndices}
              onSelectionChange={setSelectedRowIndices}
            />
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
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Warehouse className="w-3 h-3"/> 창고 위치</label>
                          <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="ex: 1층 자재창고 A열 3번선반" />
                        </div>
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
