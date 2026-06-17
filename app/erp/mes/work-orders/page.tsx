"use client";

import { useState, useEffect } from "react";
import { DataGrid } from "@/components/ui/DataGrid";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useDialog } from "@/components/providers/DialogProvider";
import { Plus, Search } from "lucide-react";

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const { showAlert, showPrompt } = useDialog();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token')) : '';
    const headers = { Authorization: `Bearer ${token}` };
    const res = await fetch("/api/mes/work-orders", { headers });
    const data = await res.json();
    setOrders(data);
  };

  const createOrder = async () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token')) : '';
    const headers = { Authorization: `Bearer ${token}` };
    const orderNo = await showPrompt("지시번호를 입력하세요:", "");
    if (!orderNo) return;
    const itemId = await showPrompt("품목 ID (숫자)를 입력하세요:", "");
    if (!itemId) return;
    const quantity = await showPrompt("계획 수량을 입력하세요:", "");
    if (!quantity) return;

    const res = await fetch("/api/mes/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ 
        order_no: orderNo, 
        item_id: parseInt(itemId), 
        planned_quantity: parseFloat(quantity) 
      })
    });
    
    if (res.ok) {
      fetchOrders();
    } else {
      await showAlert("추가 실패", { type: "error" });
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "order_no", headerName: "지시번호", width: 150 },
    { field: "item_id", headerName: "품목 ID", width: 100 },
    { field: "planned_quantity", headerName: "계획수량", width: 120 },
    { field: "produced_quantity", headerName: "실적수량", width: 120 },
    { field: "status", headerName: "상태", width: 120 },
    { field: "start_date", headerName: "시작일", width: 150 },
    { field: "end_date", headerName: "종료일", width: 150 },
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
              <Button variant="outline" size="sm" onClick={createOrder} className="h-9 flex items-center bg-white">
                <Plus className="w-4 h-4 mr-1 text-[#107C41]" />
                작업 지시서 발행
              </Button>
            </div>
          </div>
          <div className="flex flex-col h-[calc(100vh-380px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
            <DataGrid data={orders} columns={columns} />
          </div>
        </div>
      </div>
    </div>
  );
}
