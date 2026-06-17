"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Undo2, Download, AlertCircle, CheckCircle2, Edit3, Save } from 'lucide-react';

interface Item {
  id: number;
  item_code: string;
  item_name: string;
  item_type: string;
  unit: string;
  standard: string | null;
  safety_stock: number;
  current_stock: number;
  location: string | null;
  _state?: 'R' | 'U';
}

export default function InventoryStatusPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState(''); // 품목유형 필터

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const res = await fetch('http://localhost:8000/api/mes/items', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((i: any) => ({ ...i, _state: 'R' }));
        setItems(mapped);
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch items', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // 백엔드에 search 쿼리가 아직 없으므로, 프론트에서 필터링하거나 새로고침
    fetchItems();
  };

  // 프론트엔드 필터링 적용
  const filteredItems = items.filter(item => {
    const matchKeyword = !searchKeyword || 
      item.item_name.includes(searchKeyword) || 
      item.item_code.includes(searchKeyword);
    const matchType = !searchType || item.item_type === searchType;
    return matchKeyword && matchType;
  });

  const handleSave = async () => {
    const updatedItems = items.filter(i => i._state === 'U');
    if (updatedItems.length === 0) return;

    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      
      // 일괄 저장을 위해 개별 PUT 요청 전송
      await Promise.all(updatedItems.map(item => {
        const payload = {
          item_code: item.item_code,
          item_name: item.item_name,
          item_type: item.item_type,
          unit: item.unit,
          standard: item.standard,
          safety_stock: item.safety_stock,
          current_stock: item.current_stock,
          location: item.location
        };
        return fetch(`http://localhost:8000/api/mes/items/${item.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }));

      alert('재고 정보가 저장되었습니다.');
      fetchItems();
    } catch (error) {
      console.error('Save error', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    fetchItems();
  };

  const handleDataChange = (rowIndex: number, field: string, value: any) => {
    const newItems = [...items];
    const originalIndex = items.findIndex(i => i.id === filteredItems[rowIndex].id);
    
    if (originalIndex !== -1) {
      const item = { ...newItems[originalIndex] };
      (item as any)[field] = value;
      item._state = 'U';
      newItems[originalIndex] = item;
      setItems(newItems);
    }
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('재고 현황');

    worksheet.columns = [
      { header: '품목코드', key: 'item_code', width: 15 },
      { header: '품목명', key: 'item_name', width: 30 },
      { header: '유형', key: 'item_type', width: 15 },
      { header: '규격', key: 'standard', width: 20 },
      { header: '단위', key: 'unit', width: 10 },
      { header: '창고위치', key: 'location', width: 20 },
      { header: '안전재고', key: 'safety_stock', width: 15 },
      { header: '현재재고', key: 'current_stock', width: 15 },
      { header: '상태', key: 'status', width: 15 }
    ];

    filteredItems.forEach(item => {
      const status = item.current_stock < item.safety_stock ? '재고 부족' : '적정';
      worksheet.addRow({
        item_code: item.item_code,
        item_name: item.item_name,
        item_type: item.item_type,
        standard: item.standard || '',
        unit: item.unit,
        location: item.location || '',
        safety_stock: item.safety_stock,
        current_stock: item.current_stock,
        status: status
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
    saveAs(blob, `재고현황_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const columns: ColumnDef[] = [
    { field: 'item_code', headerName: '품목코드', width: 120 },
    { field: 'item_name', headerName: '품목명', width: 200 },
    { field: 'item_type', headerName: '품목유형', width: 100 },
    { field: 'standard', headerName: '규격', width: 120 },
    { field: 'unit', headerName: '단위', width: 80 },
    { field: 'location', headerName: '창고위치', width: 120, editable: true },
    { 
      field: 'safety_stock', 
      headerName: '안전재고', 
      width: 100, 
      editable: true,
      renderCell: (val: any) => <div className="text-right w-full font-medium">{val?.toLocaleString()}</div>
    },
    { 
      field: 'current_stock', 
      headerName: '현재재고', 
      width: 100, 
      editable: true,
      renderCell: (val: any) => <div className="text-right w-full font-bold text-[#107C41]">{val?.toLocaleString()}</div>
    },
    {
      field: 'id', // 더미 필드
      headerName: '상태',
      width: 120,
      renderCell: (_: any, row: any) => {
        const isShortage = row.current_stock < row.safety_stock;
        return (
          <div className={`flex items-center ${isShortage ? 'text-red-600' : 'text-green-600'}`}>
            {isShortage ? (
              <><AlertCircle className="w-4 h-4 mr-1" />재고 부족</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-1" />적정</>
            )}
          </div>
        );
      }
    }
  ];

  const hasChanges = items.some(i => i._state === 'U');

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 p-6 overflow-hidden">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center">
            재고 현황
          </h1>
          <p className="text-gray-500 mt-2">영업 및 물류 관리를 위한 품목별 실시간 재고 현황을 조회하고 조정합니다.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="p-4 bg-gray-50/50 flex flex-col h-full">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <select 
                value={searchType}
                onChange={e => setSearchType(e.target.value)}
                className="border border-gray-200 rounded-lg text-sm bg-white px-3 py-2 h-10 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent min-w-[120px]"
              >
                <option value="">모든 품목 유형</option>
                <option value="완제품">완제품</option>
                <option value="반제품">반제품</option>
                <option value="원자재">원자재</option>
              </select>

              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input 
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  className="pl-9 pr-4 bg-white w-full focus:z-10 relative" 
                  placeholder="품목코드, 품목명 검색..." 
                />
              </div>

              <Button variant="secondary" onClick={handleSearch} className="h-10 px-6 shrink-0">
                조회
              </Button>
              <Button variant="secondary" onClick={fetchItems} className="h-10 px-3 shrink-0" title="초기화">
                <Undo2 className="w-4 h-4 text-[#107C41]" />
              </Button>
            </div>

            <div className="flex flex-wrap justify-end gap-2 w-full mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportExcel} 
                className="h-9 flex items-center bg-white text-gray-700 border-gray-300"
              >
                <Download className="w-4 h-4 mr-1" />
                엑셀 다운로드
              </Button>
              
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={!hasChanges}
                className="h-9 flex items-center bg-[#107C41] hover:bg-[#0c5e31] text-white"
              >
                <Save className="w-4 h-4 mr-1" />
                변경내역 저장
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel} 
                disabled={!hasChanges}
                className="h-9 flex items-center"
              >
                <Undo2 className="w-4 h-4 mr-1" />
                변경 취소
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col flex-1 border border-gray-300 rounded-md overflow-hidden bg-white min-h-[400px]">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-6 w-6 border-2 border-gray-300 border-t-[#107C41] rounded-full animate-spin mb-2"></div>
                  데이터를 불러오는 중입니다...
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                조회된 재고 데이터가 없습니다.
              </div>
            ) : (
              <DataGrid 
                columns={columns} 
                data={filteredItems}
                onDataChange={handleDataChange}
                showCheckboxes={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
