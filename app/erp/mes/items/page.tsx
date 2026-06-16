"use client";

import { useState, useEffect } from "react";
import { DataGrid } from "@/components/ui/DataGrid";
import { Button } from "@/components/ui/Button";

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const res = await fetch("/api/mes/items");
    const data = await res.json();
    setItems(data);
  };

  const createItem = async () => {
    const code = prompt("품목코드:");
    if (!code) return;
    const name = prompt("품목명:");
    if (!name) return;
    const type = prompt("유형(완제품/반제품/원자재):");
    if (!type) return;
    const unit = prompt("단위(EA/KG/L 등):");
    if (!unit) return;
    const standard = prompt("규격(선택):") || "";

    const res = await fetch("/api/mes/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_code: code, item_name: name, item_type: type, unit, standard })
    });
    
    if (res.ok) {
      fetchItems();
    } else {
      alert("추가 실패");
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">품목 관리</h1>
        <Button onClick={createItem}>+ 품목 등록</Button>
      </div>
      <DataGrid data={items} columns={columns} />
    </div>
  );
}
