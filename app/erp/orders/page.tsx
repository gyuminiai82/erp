"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Plus, Trash2, Save, X, ArrowUpRight } from 'lucide-react';

interface OrderItem {
  id?: number;
  item_id: number | '';
  item_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  _state?: 'C' | 'D' | 'U';
}

interface Order {
  id: number;
  order_no: string;
  order_type: string;
  client_id: number;
  client_name?: string;
  order_date: string;
  delivery_date: string | null;
  status: string;
  manager_id: number;
  manager_name?: string;
  total_amount: number;
  remarks: string | null;
  items: OrderItem[];
  _state?: 'R' | 'C' | 'U' | 'D';
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderType, setOrderType] = useState<string>('수주');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Partial<Order>>({
    order_type: '수주',
    order_date: new Date().toISOString().split('T')[0],
    status: '대기',
    items: []
  });
  const [clients, setClients] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetchOrders();
    fetchOptions();
  }, [orderType]);

  const fetchOptions = async () => {
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [resClients, resItems, resEmps] = await Promise.all([
        fetch('http://localhost:8000/api/clients', { headers }),
        fetch('http://localhost:8000/api/items', { headers }),
        fetch('http://localhost:8000/api/employees', { headers })
      ]);
      
      if (resClients.ok) setClients(await resClients.json());
      if (resItems.ok) setItems(await resItems.json());
      if (resEmps.ok) setEmployees(await resEmps.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      let url = `http://localhost:8000/api/orders?order_type=${orderType}`;
      if (searchKeyword) {
        url += `&search=${encodeURIComponent(searchKeyword)}`;
      }
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((o: any) => ({ ...o, _state: 'R' }));
        setOrders(mapped);
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchOrders();
  };

  const handleBulkDelete = async () => {
    if (selectedRowIndices.length === 0) return;
    if (!confirm('선택한 항목을 삭제하시겠습니까?')) return;
    
    const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
    const idsToDelete = selectedRowIndices.map(i => orders[i].id).filter(id => id !== undefined);
    
    try {
      if (idsToDelete.length > 0) {
        const res = await fetch('http://localhost:8000/api/orders/bulk-delete', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ order_ids: idsToDelete })
        });
        if (!res.ok) throw new Error('Delete failed');
      }
      
      setSelectedRowIndices([]);
      fetchOrders();
    } catch (error) {
      console.error('Delete error', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const openNewModal = () => {
    setModalData({
      order_no: `ORD-${Date.now()}`,
      order_type: orderType,
      order_date: new Date().toISOString().split('T')[0],
      status: '대기',
      items: [{ item_id: '', quantity: 1, unit_price: 0, total_price: 0 }]
    });
    setIsModalOpen(true);
  };

  const handleModalItemChange = (index: number, field: string, value: any) => {
    const newItems = [...(modalData.items || [])];
    const item = newItems[index];
    
    if (field === 'item_id') {
      const selectedItem = items.find(i => i.id === parseInt(value));
      item.item_id = value === '' ? '' : parseInt(value);
      item.unit_price = selectedItem ? selectedItem.standard_price : 0;
      item.total_price = item.quantity * item.unit_price;
    } else if (field === 'quantity' || field === 'unit_price') {
      (item as any)[field] = parseInt(value) || 0;
      item.total_price = item.quantity * item.unit_price;
    } else {
      (item as any)[field] = value;
    }
    
    const totalAmount = newItems.reduce((sum, it) => sum + (it.total_price || 0), 0);
    setModalData({ ...modalData, items: newItems, total_amount: totalAmount });
  };

  const addModalItem = () => {
    setModalData({
      ...modalData,
      items: [...(modalData.items || []), { item_id: '', quantity: 1, unit_price: 0, total_price: 0 }]
    });
  };

  const removeModalItem = (index: number) => {
    const newItems = [...(modalData.items || [])];
    newItems.splice(index, 1);
    const totalAmount = newItems.reduce((sum, it) => sum + (it.total_price || 0), 0);
    setModalData({ ...modalData, items: newItems, total_amount: totalAmount });
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalData.client_id || !modalData.manager_id || !modalData.items || modalData.items.length === 0) {
      alert('필수 항목 및 품목을 1개 이상 입력해주세요.');
      return;
    }
    
    const validItems = modalData.items.filter((it: any) => it.item_id !== '');
    if (validItems.length === 0) {
      alert('품목을 올바르게 선택해주세요.');
      return;
    }

    const payload = {
      ...modalData,
      client_id: parseInt(modalData.client_id as any),
      manager_id: parseInt(modalData.manager_id as any),
      items: validItems
    };

    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const res = await fetch('http://localhost:8000/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchOrders();
      } else {
        const err = await res.json();
        alert('저장 실패: ' + (err.detail || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    }
  };

  const columns: ColumnDef[] = [
    { field: 'order_no', headerName: '주문번호', width: 150 },
    { field: 'order_type', headerName: '유형', width: 80 },
    { field: 'client_name', headerName: '거래처명', width: 200 },
    { field: 'order_date', headerName: '주문일자', width: 120 },
    { field: 'delivery_date', headerName: '납기일자', width: 120 },
    { 
      field: 'total_amount', 
      headerName: '총 공급가액', 
      width: 150,
      renderCell: (val: any) => val ? val.toLocaleString() + '원' : '0원'
    },
    { field: 'status', headerName: '상태', width: 100 },
    { field: 'manager_name', headerName: '담당자', width: 120 },
    { field: 'remarks', headerName: '비고', }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 p-6 overflow-hidden">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center">
            수주/발주 등록
          </h1>
          <p className="text-gray-500 mt-2">고객사의 수주 내역 및 협력사의 발주 내역을 등록하고 관리합니다.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="p-4 bg-gray-50/50 flex flex-col h-full">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <select 
                value={orderType}
                onChange={e => setOrderType(e.target.value)}
                className="border border-gray-200 rounded-lg text-sm bg-white px-3 py-2 h-10 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent min-w-[120px]"
              >
                <option value="수주">수주 (Sales Order)</option>
                <option value="발주">발주 (Purchase Order)</option>
              </select>

              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input 
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  onKeyDown={e => { if(e.key === 'Enter') handleSearch(); }}
                  className="pl-9 pr-4 bg-white w-full h-10 focus:z-10 relative" 
                  placeholder="주문번호, 거래처명 검색..." 
                />
              </div>

              <Button variant="secondary" onClick={handleSearch} className="h-10 px-6 shrink-0">
                조회
              </Button>
            </div>

            <div className="flex flex-wrap justify-end gap-2 w-full mt-2">
              <Button variant="outline" size="sm" onClick={openNewModal} className="h-9 flex items-center bg-white">
                <Plus className="w-4 h-4 mr-1 text-[#107C41]" />
                신규 {orderType} 등록
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
            </div>
          </div>
          
          <div className="flex flex-col flex-1 border border-gray-300 rounded-md overflow-hidden bg-white min-h-[400px]">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                로딩 중...
              </div>
            ) : orders.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                등록된 {orderType} 데이터가 없습니다.
              </div>
            ) : (
              <DataGrid 
                columns={columns} 
                data={orders}
                showCheckboxes={true}
                selectedRowIndices={selectedRowIndices}
                onSelectionChange={setSelectedRowIndices}
              />
            )}
          </div>
        </div>
      </div>

      {/* 신규 등록 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <ArrowUpRight className="w-5 h-5 mr-2 text-[#107C41]" />
                신규 {orderType} 등록
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">주문번호</label>
                    <Input value={modalData.order_no || ''} readOnly className="bg-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">거래처 <span className="text-red-500">*</span></label>
                    <select 
                      required
                      value={modalData.client_id || ''}
                      onChange={e => setModalData({...modalData, client_id: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#107C41]"
                    >
                      <option value="">거래처 선택</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.client_name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">주문일자 <span className="text-red-500">*</span></label>
                    <Input 
                      type="date" 
                      required
                      value={modalData.order_date || ''}
                      onChange={e => setModalData({...modalData, order_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">납기일자</label>
                    <Input 
                      type="date" 
                      value={modalData.delivery_date || ''}
                      onChange={e => setModalData({...modalData, delivery_date: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">담당자 <span className="text-red-500">*</span></label>
                    <select 
                      required
                      value={modalData.manager_id || ''}
                      onChange={e => setModalData({...modalData, manager_id: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#107C41]"
                    >
                      <option value="">담당자 선택</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                    <select 
                      value={modalData.status || '대기'}
                      onChange={e => setModalData({...modalData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#107C41]"
                    >
                      <option value="대기">대기</option>
                      <option value="진행중">진행중</option>
                      <option value="완료">완료</option>
                      <option value="취소">취소</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                    <Input 
                      value={modalData.remarks || ''}
                      onChange={e => setModalData({...modalData, remarks: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">품목 상세</h3>
                    <Button type="button" size="sm" variant="outline" onClick={addModalItem}>
                      <Plus className="w-4 h-4 mr-1" /> 추가
                    </Button>
                  </div>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 w-1/3">품목</th>
                          <th className="px-4 py-3 w-1/6 text-right">수량</th>
                          <th className="px-4 py-3 w-1/6 text-right">단가</th>
                          <th className="px-4 py-3 w-1/6 text-right">공급가액</th>
                          <th className="px-4 py-3 w-[60px] text-center">삭제</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalData.items?.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100 last:border-0 bg-white hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <select 
                                required
                                value={item.item_id || ''}
                                onChange={e => handleModalItemChange(idx, 'item_id', e.target.value)}
                                className="w-full border-gray-300 rounded px-2 py-1 focus:ring-[#107C41] focus:border-[#107C41]"
                              >
                                <option value="">선택</option>
                                {items.map(i => (
                                  <option key={i.id} value={i.id}>{i.item_code} - {i.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="number" 
                                required min="1"
                                value={item.quantity}
                                onChange={e => handleModalItemChange(idx, 'quantity', e.target.value)}
                                className="w-full border-gray-300 rounded px-2 py-1 text-right focus:ring-[#107C41] focus:border-[#107C41]"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="number" 
                                required min="0"
                                value={item.unit_price}
                                onChange={e => handleModalItemChange(idx, 'unit_price', e.target.value)}
                                className="w-full border-gray-300 rounded px-2 py-1 text-right focus:ring-[#107C41] focus:border-[#107C41]"
                              />
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-gray-900">
                              {item.total_price?.toLocaleString()}원
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button 
                                type="button"
                                onClick={() => removeModalItem(idx)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {(!modalData.items || modalData.items.length === 0) && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500 bg-white">
                              품목을 추가해주세요.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-gray-50 font-semibold border-t border-gray-200">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right">총 합계</td>
                          <td className="px-4 py-3 text-right text-[#107C41]">
                            {modalData.total_amount?.toLocaleString() || '0'}원
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  취소
                </Button>
                <Button type="submit" className="bg-[#107C41] hover:bg-[#0c5e31] text-white">
                  <Save className="w-4 h-4 mr-1" />
                  저장
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
