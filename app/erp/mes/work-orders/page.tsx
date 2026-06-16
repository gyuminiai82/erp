"use client";

import { useState, useEffect } from "react";
import { DataGrid } from "@/components/ui/DataGrid";
import { Button } from "@/components/ui/Button";

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const res = await fetch("/api/mes/work-orders");
    const data = await res.json();
    setOrders(data);
  };

  const createOrder = async () => {
    const orderNo = prompt("지시번호:");
    if (!orderNo) return;
    const itemId = prompt("품목 ID (숫자):");
    if (!itemId) return;
    const quantity = prompt("계획 수량:");
    if (!quantity) return;

    const res = await fetch("/api/mes/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        order_no: orderNo, 
        item_id: parseInt(itemId), 
        planned_quantity: parseFloat(quantity) 
      })
    });
    
    if (res.ok) {
      fetchOrders();
    } else {
      alert("추가 실패");
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">작업 지시서 관리</h1>
        <Button onClick={createOrder}>+ 작업 지시서 발행</Button>
      </div>
      <DataGrid data={orders} columns={columns} />
    </div>
  );
}
