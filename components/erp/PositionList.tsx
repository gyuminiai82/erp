"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";

interface Position {
  id: number;
  name: string;
  level: number;
  description?: string;
}

export default function PositionList() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [editName, setEditName] = useState("");
  const [editLevel, setEditLevel] = useState(10);
  
  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState(10);

  const fetchPositions = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/positions");
      if (res.ok) {
        const data = await res.json();
        setPositions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("http://localhost:8000/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, level: newLevel })
      });
      if (res.ok) {
        setNewName("");
        setNewLevel(10);
        fetchPositions();
      } else {
        const data = await res.json();
        alert(data.detail || "생성 실패");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`http://localhost:8000/api/positions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, level: editLevel })
      });
      if (res.ok) {
        setEditingId(null);
        fetchPositions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 이 직급을 삭제하시겠습니까? (해당 직급을 가진 사원이 없어야 합니다)")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/positions/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchPositions();
      } else {
        const data = await res.json();
        alert(data.detail || "삭제 실패");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-4 text-gray-500">직급 목록 불러오는 중...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-indigo-600" />
          직급 관리
        </h3>
      </div>

      <div className="flex space-x-2 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <Input 
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="새로운 직급 이름 (예: 사원, 대리)"
          className="flex-1"
        />
        <div className="flex items-center space-x-2 w-48">
          <span className="text-sm text-gray-500 whitespace-nowrap">레벨:</span>
          <Input 
            type="number"
            value={newLevel}
            onChange={(e) => setNewLevel(Number(e.target.value))}
            placeholder="레벨"
            className="w-full"
            min={1}
          />
        </div>
        <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          추가
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
              <th className="py-3 px-4 font-semibold w-16 text-center">ID</th>
              <th className="py-3 px-4 font-semibold">직급명</th>
              <th className="py-3 px-4 font-semibold w-32 text-center">레벨</th>
              <th className="py-3 px-4 font-semibold w-32 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => (
              <tr key={pos.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4 text-center text-gray-500">{pos.id}</td>
                <td className="py-3 px-4">
                  {editingId === pos.id ? (
                    <Input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 py-1"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium text-gray-800">{pos.name}</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  {editingId === pos.id ? (
                    <Input 
                      type="number"
                      value={editLevel}
                      onChange={(e) => setEditLevel(Number(e.target.value))}
                      className="h-8 py-1 w-20 mx-auto"
                      min={1}
                    />
                  ) : (
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      Level {pos.level}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  {editingId === pos.id ? (
                    <div className="flex items-center justify-center space-x-1">
                      <Button size="sm" onClick={() => handleUpdate(pos.id)} className="h-8 bg-green-600 hover:bg-green-700 text-white px-2">저장</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-8 px-2">취소</Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => { 
                          setEditingId(pos.id); 
                          setEditName(pos.name);
                          setEditLevel(pos.level);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(pos.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {positions.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">등록된 직급이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
