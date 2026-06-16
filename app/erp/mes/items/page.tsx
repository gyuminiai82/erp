"use client";

import { useState, useEffect } from "react";
import { DataGrid } from "@/components/ui/DataGrid";
import { Button } from "@/components/ui/Button";
import { useDialog } from "@/components/providers/DialogProvider";

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const { showAlert, showPrompt } = useDialog();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const res = await fetch("/api/mes/items");
    const data = await res.json();
    setItems(data);
  };

  const createItem = async () => {
    const code = await showPrompt("품목코드를 입력하세요:", "");
    if (!code) return;
    const name = await showPrompt("품목명을 입력하세요:", "");
    if (!name) return;
    const type = await showPrompt("유형(완제품/반제품/원자재)을 입력하세요:", "");
    if (!type) return;
    const unit = await showPrompt("단위(EA/KG/L 등)를 입력하세요:", "");
    if (!unit) return;
    const standard = (await showPrompt("규격(선택):", "")) || "";

    const res = await fetch("/api/mes/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_code: code, item_name: name, item_type: type, unit, standard })
    });
    
    if (res.ok) {
      fetchItems();
    } else {
      await showAlert("추가 실패", { type: "error" });
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "item_code", headerName: "품목코드", width: 150 },
    { field: "item_name", headerName: "품목명", width: 250 },
    { field: "item_type", headerName: "유형", width: 120 },
    { field: "unit", headerName: "단위", width: 100 },
    { field: "standard", headerName: "규격", width: 150 },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">품목 관리</h1>
          <p className="text-gray-500">생산에 필요한 원자재, 반제품, 완제품의 품목을 관리합니다.</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 flex justify-end">
          <Button onClick={createItem} className="bg-[#107C41] hover:bg-[#0b5c30] text-white">
            <span className="mr-2">+</span> 품목 추가
          </Button>
        </div>
        <div className="flex flex-col h-[calc(100vh-320px)] min-h-[400px]">
          <div className="flex-1 overflow-hidden">
            <DataGrid data={items} columns={columns} showCheckboxes={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
